package mqtt

import (
	"encoding/json"
	"fmt"
	"net"
	"sync"
	"testing"
	"time"

	paho "github.com/eclipse/paho.mqtt.golang"
	mochi "github.com/mochi-mqtt/server/v2"
	"github.com/mochi-mqtt/server/v2/hooks/auth"
	"github.com/mochi-mqtt/server/v2/listeners"

	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/models"
)

func freePort(t *testing.T) int {
	t.Helper()
	l, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("listen: %v", err)
	}
	defer l.Close()
	return l.Addr().(*net.TCPAddr).Port
}

func startBroker(t *testing.T) string {
	t.Helper()
	port := freePort(t)
	server := mochi.New(&mochi.Options{InlineClient: true})
	if err := server.AddHook(new(auth.AllowHook), nil); err != nil {
		t.Fatalf("add hook: %v", err)
	}
	addr := fmt.Sprintf("127.0.0.1:%d", port)
	if err := server.AddListener(listeners.NewTCP(listeners.Config{ID: "test", Address: addr})); err != nil {
		t.Fatalf("add listener: %v", err)
	}
	go func() { _ = server.Serve() }()
	t.Cleanup(func() { _ = server.Close() })

	// Wait until the listener accepts connections.
	deadline := time.Now().Add(3 * time.Second)
	for time.Now().Before(deadline) {
		if c, err := net.Dial("tcp", addr); err == nil {
			_ = c.Close()
			return "tcp://" + addr
		}
		time.Sleep(20 * time.Millisecond)
	}
	t.Fatalf("broker did not start")
	return ""
}

type recorder struct {
	mu   sync.Mutex
	msgs []received
}

type received struct {
	topic   string
	payload string
}

func subscribe(t *testing.T, broker string) *recorder {
	t.Helper()
	rec := &recorder{}
	client := paho.NewClient(paho.NewClientOptions().AddBroker(broker).SetClientID("test-subscriber"))
	if tok := client.Connect(); !tok.WaitTimeout(3*time.Second) || tok.Error() != nil {
		t.Fatalf("subscriber connect: %v", tok.Error())
	}
	t.Cleanup(func() { client.Disconnect(100) })
	tok := client.Subscribe("#", 1, func(_ paho.Client, m paho.Message) {
		rec.mu.Lock()
		rec.msgs = append(rec.msgs, received{m.Topic(), string(m.Payload())})
		rec.mu.Unlock()
	})
	if !tok.WaitTimeout(3*time.Second) || tok.Error() != nil {
		t.Fatalf("subscribe: %v", tok.Error())
	}
	return rec
}

// last returns the most recent payload on a topic.
func (r *recorder) last(topic string) (string, bool) {
	r.mu.Lock()
	defer r.mu.Unlock()
	for i := len(r.msgs) - 1; i >= 0; i-- {
		if r.msgs[i].topic == topic {
			return r.msgs[i].payload, true
		}
	}
	return "", false
}

func (r *recorder) waitFor(t *testing.T, topic string, ok func(payload string) bool) string {
	t.Helper()
	deadline := time.Now().Add(5 * time.Second)
	for time.Now().Before(deadline) {
		if p, found := r.last(topic); found && ok(p) {
			return p
		}
		time.Sleep(20 * time.Millisecond)
	}
	p, _ := r.last(topic)
	t.Fatalf("timed out waiting for %s (last payload %q)", topic, p)
	return ""
}

func jsonField(t *testing.T, payload, key string) any {
	t.Helper()
	var m map[string]any
	if err := json.Unmarshal([]byte(payload), &m); err != nil {
		t.Fatalf("payload %q is not JSON: %v", payload, err)
	}
	return m[key]
}

type fakeStats struct{}

func (fakeStats) GetOverview(int) (*models.StatisticsOverview, error) {
	return &models.StatisticsOverview{
		Summary: models.SummaryStats{
			CompletedOrders: 12, CancelledOrders: 2, OrdersLast24h: 3, OrdersLast7d: 9,
			TotalVolumeDispensedMl: 3000, AverageDrinkSizeMl: 250.4,
		},
		Inventory:  models.InventoryStats{TotalPumpFillingMl: 900, LowLiquidPumps: 1},
		TopRecipes: []models.RecipeStat{{RecipeName: "Mojito"}},
	}, nil
}

type fakePumps struct {
	mu    sync.Mutex
	pumps []models.Pump
}

func (f *fakePumps) FindAll() ([]models.Pump, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	return append([]models.Pump(nil), f.pumps...), nil
}

func (f *fakePumps) set(p []models.Pump) {
	f.mu.Lock()
	f.pumps = p
	f.mu.Unlock()
}

func pumpNamed(id int64, name string, level int) models.Pump {
	return models.Pump{ID: id, Name: &name, FillingLevelInMl: level, CurrentIngredient: &models.Ingredient{Name: "Rum"}}
}

func TestServicePublishesDiscoveryStateStatsAndEvents(t *testing.T) {
	broker := startBroker(t)
	rec := subscribe(t, broker)
	pumps := &fakePumps{}
	pumps.set([]models.Pump{pumpNamed(1, "Rum pump", 400)})

	svc := New(Config{Stats: fakeStats{}, Pumps: pumps, Version: "1.2.3", UpdateAvailable: func() bool { return true }})
	t.Cleanup(svc.Close)
	status := svc.Apply(models.MQTTSettings{Enabled: true, BrokerURL: broker, BaseTopic: "barpi", DiscoveryPrefix: "homeassistant"})
	if status.Error != "" {
		t.Fatalf("apply reported error: %s", status.Error)
	}

	rec.waitFor(t, "barpi/availability", func(p string) bool { return p == "online" })

	cfg := rec.waitFor(t, "homeassistant/sensor/barpi/status/config", func(string) bool { return true })
	if jsonField(t, cfg, "unique_id") != "barpi_status" {
		t.Fatalf("unexpected status config: %s", cfg)
	}
	if jsonField(t, cfg, "availability_topic") != "barpi/availability" {
		t.Fatalf("status config missing availability topic: %s", cfg)
	}
	rec.waitFor(t, "homeassistant/event/barpi/production/config", func(string) bool { return true })

	stats := rec.waitFor(t, "barpi/stats", func(string) bool { return true })
	if jsonField(t, stats, "drinks_completed") != float64(12) || jsonField(t, stats, "top_recipe") != "Mojito" ||
		jsonField(t, stats, "average_size_ml") != float64(250) || jsonField(t, stats, "update_available") != true ||
		jsonField(t, stats, "version") != "1.2.3" {
		t.Fatalf("unexpected stats payload: %s", stats)
	}

	rec.waitFor(t, "homeassistant/sensor/barpi/pump_1_level/config", func(string) bool { return true })
	pump := rec.waitFor(t, "barpi/pump/1", func(string) bool { return true })
	if jsonField(t, pump, "level_ml") != float64(400) || jsonField(t, pump, "ingredient") != "Rum" {
		t.Fatalf("unexpected pump payload: %s", pump)
	}

	state := rec.waitFor(t, "barpi/state", func(string) bool { return true })
	if jsonField(t, state, "status") != "idle" || jsonField(t, state, "making") != false {
		t.Fatalf("expected idle state, got %s", state)
	}

	svc.PublishProgress(&models.CocktailProgress{RecipeID: 7, RecipeName: "Mojito", Status: "in_progress", Progress: 40, Username: "admin"})
	state = rec.waitFor(t, "barpi/state", func(p string) bool { return jsonField(t, p, "status") == "making" })
	if jsonField(t, state, "recipe") != "Mojito" || jsonField(t, state, "progress") != float64(40) || jsonField(t, state, "making") != true {
		t.Fatalf("unexpected making state: %s", state)
	}
	svc.PublishProgress(&models.CocktailProgress{RecipeID: 7, RecipeName: "Mojito", Status: "paused"})
	rec.waitFor(t, "barpi/state", func(p string) bool { return jsonField(t, p, "status") == "waiting_for_user" })

	svc.Dispatch(models.EventTriggerProductionFinished, 7)
	event := rec.waitFor(t, "barpi/event", func(string) bool { return true })
	if jsonField(t, event, "event_type") != models.EventTriggerProductionFinished || jsonField(t, event, "recipe") != "Mojito" {
		t.Fatalf("unexpected event payload: %s", event)
	}

	svc.PublishProgress(nil)
	rec.waitFor(t, "barpi/state", func(p string) bool { return jsonField(t, p, "status") == "idle" })

	// A removed pump has its entity cleared; a new one is announced.
	pumps.set([]models.Pump{pumpNamed(2, "Gin pump", 100)})
	svc.Refresh()
	rec.waitFor(t, "homeassistant/sensor/barpi/pump_1_level/config", func(p string) bool { return p == "" })
	rec.waitFor(t, "homeassistant/sensor/barpi/pump_2_level/config", func(p string) bool { return p != "" })

	// Disabling marks the device unavailable.
	if status := svc.Apply(models.MQTTSettings{Enabled: false}); status.Connected {
		t.Fatalf("expected disconnected after disabling")
	}
	rec.waitFor(t, "barpi/availability", func(p string) bool { return p == "offline" })
}

func TestApplyReportsUnreachableBroker(t *testing.T) {
	svc := New(Config{})
	t.Cleanup(svc.Close)
	start := time.Now()
	status := svc.Apply(models.MQTTSettings{
		Enabled:         true,
		BrokerURL:       fmt.Sprintf("tcp://127.0.0.1:%d", freePort(t)),
		BaseTopic:       "barpi",
		DiscoveryPrefix: "homeassistant",
	})
	if status.Connected || status.Error == "" {
		t.Fatalf("expected a connection error, got %+v", status)
	}
	if time.Since(start) > applyWait+time.Second {
		t.Fatalf("apply blocked too long: %v", time.Since(start))
	}
	svc.Apply(models.MQTTSettings{Enabled: false})
	if svc.Status().Error != "" {
		t.Fatalf("error should clear when disabled")
	}
}

func TestNormalize(t *testing.T) {
	ok, err := Normalize(models.MQTTSettings{Enabled: true, BrokerURL: "mqtt://broker.local"})
	if err != nil || ok.BrokerURL != "tcp://broker.local:1883" || ok.BaseTopic != "barpi" || ok.DiscoveryPrefix != "homeassistant" {
		t.Fatalf("unexpected normalization: %+v, %v", ok, err)
	}
	if tls, _ := Normalize(models.MQTTSettings{Enabled: true, BrokerURL: "mqtts://broker.local"}); tls.BrokerURL != "ssl://broker.local:8883" {
		t.Fatalf("unexpected tls url: %s", tls.BrokerURL)
	}

	invalid := map[string]models.MQTTSettings{
		"enabled without url": {Enabled: true},
		"bad scheme":          {Enabled: true, BrokerURL: "http://broker.local"},
		"wildcard topic":      {BaseTopic: "bar/#"},
		"leading slash":       {BaseTopic: "/barpi"},
		"spaces":              {DiscoveryPrefix: "home assistant"},
	}
	for name, s := range invalid {
		if _, err := Normalize(s); err == nil {
			t.Fatalf("%s: expected an error", name)
		}
	}
	if _, err := Normalize(models.MQTTSettings{BrokerURL: "not a url"}); err != nil {
		t.Fatalf("a disabled config with a bad URL should still save: %v", err)
	}
}
