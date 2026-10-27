package websocket

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

type StompServer struct {
	upgrader    websocket.Upgrader
	clients     map[*StompClient]bool
	mu          sync.RWMutex
	topics      map[string]map[*StompClient]*Subscription
	OnSubscribe func(client *StompClient, sub *Subscription)
}

type StompClient struct {
	conn          *websocket.Conn
	subscriptions map[string]*Subscription // subscription ID -> Subscription
	sessionID     string
	username      string
	isSockJS      bool
	closed        bool
	mu            sync.RWMutex
	send          chan []byte
}

type Subscription struct {
	ID          string
	Destination string
	Client      *StompClient
}

func NewStompServer() *StompServer {
	return &StompServer{
		upgrader: websocket.Upgrader{
			ReadBufferSize:  1024,
			WriteBufferSize: 1024,
			CheckOrigin: func(r *http.Request) bool {
				return true
			},
		},
		clients: make(map[*StompClient]bool),
		topics:  make(map[string]map[*StompClient]*Subscription),
	}
}

func (s *StompServer) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Path
	if strings.Contains(path, "/websocket") && !strings.HasSuffix(path, "/websocket") {
		if strings.HasSuffix(path, "/info") {
			s.handleSockJSInfo(w, r)
			return
		}
		if strings.Contains(path, "/iframe") {
			w.WriteHeader(http.StatusNotFound)
			return
		}
	}

	isSockJS := strings.HasSuffix(path, "/websocket") && path != "/websocket"

	conn, err := s.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}

	client := &StompClient{
		conn:          conn,
		subscriptions: make(map[string]*Subscription),
		sessionID:     generateSessionID(),
		isSockJS:      isSockJS,
		send:          make(chan []byte, 256),
	}

	s.mu.Lock()
	s.clients[client] = true
	s.mu.Unlock()

	defer func() {
		s.mu.Lock()
		delete(s.clients, client)
		client.mu.Lock()
		for _, sub := range client.subscriptions {
			if subscribers, ok := s.topics[sub.Destination]; ok {
				delete(subscribers, client)
				if len(subscribers) == 0 {
					delete(s.topics, sub.Destination)
				}
			}
		}
		client.closed = true
		close(client.send)
		client.mu.Unlock()
		s.mu.Unlock()
		conn.Close()
	}()

	if client.isSockJS {
		// SockJS requires an initial "o" (open) frame immediately after WebSocket upgrade
		client.send <- []byte("o")
	}

	go client.writePump()

	s.handleClient(client)
}

func (s *StompServer) handleClient(client *StompClient) {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("Recovered from panic in handleClient: %v", r)
		}
	}()

	for {
		_, message, err := client.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		data := string(message)
		if strings.HasPrefix(data, "[") && strings.HasSuffix(data, "]") {
			var messages []string
			if err := json.Unmarshal(message, &messages); err == nil {
				for _, msg := range messages {
					frame := parseStompFrame(msg)
					if frame != nil {
						s.handleFrame(client, frame)
					}
				}
				continue
			}
		}

		frame := parseStompFrame(data)
		if frame != nil {
			s.handleFrame(client, frame)
		}
	}
}

func (s *StompServer) handleFrame(client *StompClient, frame *StompFrame) {
	switch frame.Command {
	case "CONNECT", "STOMP":
		s.handleConnect(client, frame)
	case "SUBSCRIBE":
		s.handleSubscribe(client, frame)
	case "UNSUBSCRIBE":
		s.handleUnsubscribe(client, frame)
	case "SEND":
		s.handleSend(client, frame)
	case "DISCONNECT":
		client.conn.Close()
	}
}

func (s *StompServer) handleConnect(client *StompClient, frame *StompFrame) {
	if authHeader, ok := frame.Headers["Authorization"]; ok {
		if strings.HasPrefix(authHeader, "Bearer ") {
			client.username = "authenticated-user"
		}
	}

	response := &StompFrame{
		Command: "CONNECTED",
		Headers: map[string]string{
			"version":    "1.2",
			"session":    client.sessionID,
			"server":     "Bar-Pi-Go/1.0",
			"heart-beat": "0,0",
		},
	}
	_ = client.sendFrame(response)
	log.Printf("Client connected with session: %s", client.sessionID)
}

func (s *StompServer) handleSubscribe(client *StompClient, frame *StompFrame) {
	destination := frame.Headers["destination"]
	id := frame.Headers["id"]

	if destination == "" || id == "" {
		log.Printf("Invalid SUBSCRIBE: missing destination or id")
		return
	}

	sub := &Subscription{
		ID:          id,
		Destination: destination,
		Client:      client,
	}

	client.mu.Lock()
	client.subscriptions[id] = sub
	client.mu.Unlock()

	s.mu.Lock()
	if s.topics[destination] == nil {
		s.topics[destination] = make(map[*StompClient]*Subscription)
	}
	s.topics[destination][client] = sub
	onSub := s.OnSubscribe
	s.mu.Unlock()

	log.Printf("Client %s subscribed to %s with id %s", client.sessionID, destination, id)

	if onSub != nil {
		onSub(client, sub)
	}
}

// SendToSubscription sends a message directly to a specific client subscription
func (s *StompServer) SendToSubscription(client *StompClient, sub *Subscription, body string) {
	if client == nil || sub == nil {
		return
	}
	frame := &StompFrame{
		Command: "MESSAGE",
		Headers: map[string]string{
			"destination":  sub.Destination,
			"message-id":   generateMessageID(),
			"subscription": sub.ID,
		},
		Body: body,
	}
	_ = client.sendFrame(frame)
}

func (s *StompServer) handleUnsubscribe(client *StompClient, frame *StompFrame) {
	id := frame.Headers["id"]

	client.mu.RLock()
	sub, ok := client.subscriptions[id]
	client.mu.RUnlock()

	if !ok {
		return
	}

	destination := sub.Destination

	client.mu.Lock()
	delete(client.subscriptions, id)
	client.mu.Unlock()

	s.mu.Lock()
	if subscribers, ok := s.topics[destination]; ok {
		delete(subscribers, client)
		if len(subscribers) == 0 {
			delete(s.topics, destination)
		}
	}
	s.mu.Unlock()

	log.Printf("Client %s unsubscribed from %s (id: %s)", client.sessionID, destination, id)
}

func (s *StompServer) handleSend(client *StompClient, frame *StompFrame) {
	destination := frame.Headers["destination"]
	if destination == "" {
		return
	}

	s.Broadcast(destination, frame.Body)
}

// Broadcast sends a message to all subscribers of a destination (and its /user/ prefixed variant)
func (s *StompServer) Broadcast(destination string, message string) {
	destinations := []string{destination}
	if !strings.HasPrefix(destination, "/user") {
		destinations = append(destinations, "/user"+destination)
	}

	type target struct {
		client *StompClient
		subID  string
		dest   string
	}
	var targets []target

	s.mu.RLock()
	for _, dest := range destinations {
		if subscribers, ok := s.topics[dest]; ok {
			for client, sub := range subscribers {
				targets = append(targets, target{
					client: client,
					subID:  sub.ID,
					dest:   dest,
				})
			}
		}
	}
	s.mu.RUnlock()

	for _, t := range targets {
		frame := &StompFrame{
			Command: "MESSAGE",
			Headers: map[string]string{
				"destination":  t.dest,
				"message-id":   generateMessageID(),
				"subscription": t.subID,
			},
			Body: message,
		}
		_ = t.client.sendFrame(frame)
	}
}

// BroadcastToAll sends a message to all connected clients on a destination
func (s *StompServer) BroadcastToAll(destination string, message any) {
	var body string
	switch v := message.(type) {
	case string:
		body = v
	default:
		data, err := json.Marshal(message)
		if err != nil {
			log.Printf("Error marshaling message: %v", err)
			return
		}
		body = string(data)
	}

	s.Broadcast(destination, body)
}

type StompFrame struct {
	Command string
	Headers map[string]string
	Body    string
}

func parseStompFrame(data string) *StompFrame {
	trimmed := strings.TrimSpace(data)
	if trimmed == "" {
		return nil
	}
	lines := strings.Split(data, "\n")
	if len(lines) == 0 {
		return nil
	}

	frame := &StompFrame{
		Command: strings.TrimSpace(lines[0]),
		Headers: make(map[string]string),
	}

	bodyStart := -1
	for i := 1; i < len(lines); i++ {
		line := strings.TrimRight(lines[i], "\r")
		if line == "" {
			bodyStart = i + 1
			break
		}

		parts := strings.SplitN(line, ":", 2)
		if len(parts) == 2 {
			frame.Headers[strings.TrimSpace(parts[0])] = strings.TrimSpace(parts[1])
		}
	}

	if bodyStart > 0 && bodyStart < len(lines) {
		body := strings.Join(lines[bodyStart:], "\n")
		frame.Body = strings.TrimRight(body, "\x00")
	}

	return frame
}

func (c *StompClient) sendFrame(frame *StompFrame) error {
	var buf strings.Builder
	buf.WriteString(frame.Command)
	buf.WriteString("\n")

	for key, value := range frame.Headers {
		buf.WriteString(key)
		buf.WriteString(":")
		buf.WriteString(value)
		buf.WriteString("\n")
	}

	buf.WriteString("\n")
	if frame.Body != "" {
		buf.WriteString(frame.Body)
	}
	buf.WriteString("\x00")

	payload := []byte(buf.String())
	if c.isSockJS {
		encoded, err := json.Marshal([]string{buf.String()})
		if err == nil {
			payload = append([]byte("a"), encoded...)
		}
	}

	c.mu.RLock()
	defer c.mu.RUnlock()
	if c.closed {
		return fmt.Errorf("client closed")
	}

	select {
	case c.send <- payload:
		return nil
	default:
		return fmt.Errorf("send channel full")
	}
}

func (c *StompClient) writePump() {
	ticker := time.NewTicker(25 * time.Second)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			if !ok {
				_ = c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			_ = c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.conn.WriteMessage(websocket.TextMessage, message); err != nil {
				return
			}

		case <-ticker.C:
			_ = c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if c.isSockJS {
				if err := c.conn.WriteMessage(websocket.TextMessage, []byte("h")); err != nil {
					return
				}
			} else {
				if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
					return
				}
			}
		}
	}
}

func generateSessionID() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	return fmt.Sprintf("session-%s", hex.EncodeToString(b))
}

func generateMessageID() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	return fmt.Sprintf("msg-%s-%d", hex.EncodeToString(b), time.Now().UnixNano())
}

// handleSockJSInfo handles SockJS info requests
func (s *StompServer) handleSockJSInfo(w http.ResponseWriter, r *http.Request) {
	origin := r.Header.Get("Origin")
	if origin == "" {
		origin = "*"
	}
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", origin)
	w.Header().Set("Access-Control-Allow-Credentials", "true")

	info := map[string]any{
		"websocket":     true,
		"origins":       []string{"*:*"},
		"cookie_needed": false,
		"entropy":       generateEntropy(),
	}

	_ = json.NewEncoder(w).Encode(info)
}

func generateEntropy() int64 {
	b := make([]byte, 4)
	_, _ = rand.Read(b)
	var entropy int64
	for _, v := range b {
		entropy = (entropy << 8) | int64(v)
	}
	return entropy
}
