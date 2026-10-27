package mqtt

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	paho "github.com/eclipse/paho.mqtt.golang"

	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/models"
)

const (
	refreshInterval = 60 * time.Second
	retryInterval   = 10 * time.Second
	connectTimeout  = 5 * time.Second
	applyWait       = 4 * time.Second
	publishWait     = 2 * time.Second
)

// StatsSource provides the statistics published to Home Assistant.
type StatsSource interface {
	GetOverview(days int) (*models.StatisticsOverview, error)
}

// PumpSource provides the pump filling levels.
type PumpSource interface {
	FindAll() ([]models.Pump, error)
}

type Config struct {
	Stats           StatsSource
	Pumps           PumpSource
	Version         string
	UpdateAvailable func() bool
}

// Status is the connection state shown in the settings UI.
type Status struct {
	Enabled   bool   `json:"enabled"`
	Connected bool   `json:"connected"`
	Error     string `json:"error,omitempty"`
}

// Service publishes Bar-Pi state to an MQTT broker with Home Assistant discovery.
type Service struct {
	cfg Config

	mu           sync.RWMutex
	settings     models.MQTTSettings
	client       paho.Client
	cancel       context.CancelFunc
	done         chan struct{}
	connected    bool
	lastErr      string
	lastProgress *models.CocktailProgress
	knownPumps   map[int64]bool
}

func New(cfg Config) *Service {
	return &Service{cfg: cfg, knownPumps: map[int64]bool{}}
}

func (s *Service) Status() Status {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return Status{Enabled: s.settings.Enabled, Connected: s.connected, Error: s.lastErr}
}

// Apply replaces the running connection with one for the new settings. It waits briefly
// for the first connection attempt so the caller can report the outcome.
func (s *Service) Apply(settings models.MQTTSettings) Status {
	s.stop()

	s.mu.Lock()
	s.settings = settings
	s.lastErr = ""
	s.connected = false
	if !settings.Enabled {
		s.mu.Unlock()
		return s.Status()
	}
	ctx, cancel := context.WithCancel(context.Background())
	s.cancel = cancel
	s.done = make(chan struct{})
	done := s.done
	s.mu.Unlock()

	first := make(chan struct{})
	go func() {
		defer close(done)
		s.run(ctx, settings, first)
	}()

	select {
	case <-first:
	case <-time.After(applyWait):
	}
	return s.Status()
}

// Close disconnects cleanly, marking the device unavailable first.
func (s *Service) Close() {
	s.stop()
}

func (s *Service) stop() {
	s.mu.Lock()
	cancel, done := s.cancel, s.done
	s.cancel, s.done = nil, nil
	s.mu.Unlock()
	if cancel != nil {
		cancel()
		<-done
	}
}

func (s *Service) run(ctx context.Context, settings models.MQTTSettings, first chan struct{}) {
	var once sync.Once
	signalFirst := func() { once.Do(func() { close(first) }) }
	defer signalFirst()

	t := newTopics(settings.BaseTopic, settings.DiscoveryPrefix)
	var client paho.Client
	for {
		client = s.newClient(settings, t)
		token := client.Connect()
		if token.WaitTimeout(connectTimeout) && token.Error() == nil {
			break
		}
		err := token.Error()
		if err == nil {
			err = fmt.Errorf("timed out connecting to %s", settings.BrokerURL)
		}
		client.Disconnect(0)
		s.setError(err.Error())
		signalFirst()
		select {
		case <-ctx.Done():
			return
		case <-time.After(retryInterval):
		}
	}
	signalFirst()

	ticker := time.NewTicker(refreshInterval)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			s.publishNow(t.available, "offline", true)
			client.Disconnect(250)
			s.mu.Lock()
			s.client = nil
			s.connected = false
			s.mu.Unlock()
			return
		case <-ticker.C:
			s.Refresh()
		}
	}
}

func (s *Service) newClient(settings models.MQTTSettings, t topics) paho.Client {
	opts := paho.NewClientOptions().
		AddBroker(settings.BrokerURL).
		SetClientID("barpi-"+t.node).
		SetCleanSession(true).
		SetKeepAlive(30*time.Second).
		SetConnectTimeout(connectTimeout).
		SetAutoReconnect(true).
		SetMaxReconnectInterval(30*time.Second).
		SetWill(t.available, "offline", 1, true)
	if settings.Username != "" {
		opts.SetUsername(settings.Username).SetPassword(settings.Password)
	}
	opts.SetOnConnectHandler(func(c paho.Client) {
		s.mu.Lock()
		s.client = c
		s.connected = true
		s.lastErr = ""
		s.mu.Unlock()
		s.publishAll(t)
	})
	opts.SetConnectionLostHandler(func(_ paho.Client, err error) {
		s.mu.Lock()
		s.connected = false
		s.lastErr = err.Error()
		s.mu.Unlock()
	})
	return paho.NewClient(opts)
}

func (s *Service) setError(msg string) {
	s.mu.Lock()
	s.lastErr = msg
	s.connected = false
	s.mu.Unlock()
}

// publishAll announces the device and publishes current state; run after every (re)connect.
func (s *Service) publishAll(t topics) {
	s.publishNow(t.available, "online", true)
	s.mu.Lock()
	s.knownPumps = map[int64]bool{}
	progress := s.lastProgress
	s.mu.Unlock()
	s.publishDiscovery(t)
	s.publishState(t, progress)
	s.Refresh()
}

func (s *Service) publishDiscovery(t topics) {
	for _, m := range discoveryMessages(t, s.cfg.Version) {
		s.send(m)
	}
}

// PublishProgress reports the current production state; nil means idle.
func (s *Service) PublishProgress(p *models.CocktailProgress) {
	t, ok := s.currentTopics()
	var snapshot *models.CocktailProgress
	if p != nil {
		cp := *p
		cp.Recipe = nil
		cp.User = nil
		snapshot = &cp
	}
	s.mu.Lock()
	s.lastProgress = snapshot
	s.mu.Unlock()
	if !ok {
		return
	}
	s.publishState(t, snapshot)
	if snapshot != nil && (snapshot.Status == "completed" || snapshot.Status == "cancelled") {
		go s.Refresh()
	}
}

func (s *Service) publishState(t topics, p *models.CocktailProgress) {
	s.send(message{t.state, statePayload(p), true})
}

// Dispatch publishes a production event. It satisfies service.EventDispatcher.
func (s *Service) Dispatch(trigger string, recipeID int64) {
	t, ok := s.currentTopics()
	if !ok {
		return
	}
	s.mu.RLock()
	recipe := ""
	if s.lastProgress != nil && s.lastProgress.RecipeID == recipeID {
		recipe = s.lastProgress.RecipeName
	}
	s.mu.RUnlock()
	payload := map[string]any{
		"event_type": trigger,
		"recipe_id":  recipeID,
		"recipe":     recipe,
		"timestamp":  time.Now().UTC().Format(time.RFC3339),
	}
	s.send(message{t.event, payload, false})
}

// Refresh republishes statistics and pump levels.
func (s *Service) Refresh() {
	t, ok := s.currentTopics()
	if !ok {
		return
	}
	if s.cfg.Stats != nil {
		if overview, err := s.cfg.Stats.GetOverview(1); err != nil {
			log.Printf("mqtt: failed to load statistics: %v", err)
		} else {
			updateAvailable := s.cfg.UpdateAvailable != nil && s.cfg.UpdateAvailable()
			s.send(message{t.stats, statsPayload(overview, s.cfg.Version, updateAvailable), true})
		}
	}
	if s.cfg.Pumps != nil {
		pumps, err := s.cfg.Pumps.FindAll()
		if err != nil {
			log.Printf("mqtt: failed to load pumps: %v", err)
			return
		}
		s.syncPumps(t, pumps)
	}
}

// syncPumps announces new pumps, drops entities of removed ones and publishes levels.
func (s *Service) syncPumps(t topics, pumps []models.Pump) {
	current := map[int64]bool{}
	var added []models.Pump
	s.mu.Lock()
	for _, p := range pumps {
		current[p.ID] = true
		if !s.knownPumps[p.ID] {
			added = append(added, p)
		}
	}
	var removed []int64
	for id := range s.knownPumps {
		if !current[id] {
			removed = append(removed, id)
		}
	}
	s.knownPumps = current
	s.mu.Unlock()

	for _, m := range pumpDiscoveryMessages(t, s.cfg.Version, added) {
		s.send(m)
	}
	for _, id := range removed {
		s.publishNow(t.config("sensor", pumpObject(id)), "", true)
		s.publishNow(t.pump(id), "", true)
	}
	for _, p := range pumps {
		s.send(message{t.pump(p.ID), pumpPayload(p), true})
	}
}

func (s *Service) currentTopics() (topics, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	if s.client == nil || !s.connected || !s.settings.Enabled {
		return topics{}, false
	}
	return newTopics(s.settings.BaseTopic, s.settings.DiscoveryPrefix), true
}

func (s *Service) send(m message) {
	var data []byte
	switch v := m.payload.(type) {
	case string:
		data = []byte(v)
	default:
		var err error
		if data, err = json.Marshal(v); err != nil {
			log.Printf("mqtt: failed to encode %s: %v", m.topic, err)
			return
		}
	}
	s.publishNow(m.topic, string(data), m.retain)
}

func (s *Service) publishNow(topic, payload string, retain bool) {
	s.mu.RLock()
	client := s.client
	s.mu.RUnlock()
	if client == nil || !client.IsConnectionOpen() {
		return
	}
	token := client.Publish(topic, 1, retain, payload)
	if !token.WaitTimeout(publishWait) {
		log.Printf("mqtt: publish to %s timed out", topic)
	}
}
