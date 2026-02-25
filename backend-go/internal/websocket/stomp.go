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
	hub      *Hub
	upgrader websocket.Upgrader
	clients  map[*StompClient]bool
	mu       sync.RWMutex
	topics   map[string]map[*StompClient]*Subscription
}

type StompClient struct {
	conn          *websocket.Conn
	subscriptions map[string]*Subscription // subscription ID -> Subscription
	sessionID     string
	username      string
	mu            sync.RWMutex
	send          chan []byte
}

type Subscription struct {
	ID          string
	Destination string
	Client      *StompClient
}

func NewStompServer(hub *Hub) *StompServer {
	return &StompServer{
		hub: hub,
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
	// Check if this is a SockJS request
	path := r.URL.Path
	if strings.Contains(path, "/websocket") && !strings.HasSuffix(path, "/websocket") {
		// SockJS info or iframe request
		if strings.HasSuffix(path, "/info") {
			s.handleSockJSInfo(w, r)
			return
		}
		if strings.Contains(path, "/iframe") {
			w.WriteHeader(http.StatusNotFound)
			return
		}
	}

	conn, err := s.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}

	client := &StompClient{
		conn:          conn,
		subscriptions: make(map[string]*Subscription),
		sessionID:     generateSessionID(),
		send:          make(chan []byte, 256),
	}

	s.mu.Lock()
	s.clients[client] = true
	s.mu.Unlock()

	defer func() {
		s.mu.Lock()
		delete(s.clients, client)
		// Clean up all subscriptions
		for _, sub := range client.subscriptions {
			if subscribers, ok := s.topics[sub.Destination]; ok {
				delete(subscribers, client)
				if len(subscribers) == 0 {
					delete(s.topics, sub.Destination)
				}
			}
		}
		s.mu.Unlock()
		close(client.send)
		conn.Close()
	}()

	// Start write pump
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

		// Handle SockJS envelope if present
		data := string(message)
		if strings.HasPrefix(data, "[") && strings.HasSuffix(data, "]") {
			// SockJS array format
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
	// Extract username from Authorization header if present
	if authHeader, ok := frame.Headers["Authorization"]; ok {
		// Simple extraction - in production, validate JWT token
		if strings.HasPrefix(authHeader, "Bearer ") {
			// For now, just mark as authenticated
			// In production, decode JWT and extract username
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
	client.sendFrame(response)
	log.Printf("Client connected with session: %s", client.sessionID)
}

func (s *StompServer) handleSubscribe(client *StompClient, frame *StompFrame) {
	destination := frame.Headers["destination"]
	id := frame.Headers["id"]

	if destination == "" || id == "" {
		log.Printf("Invalid SUBSCRIBE: missing destination or id")
		return
	}

	// Create subscription object
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
	s.mu.Unlock()

	log.Printf("Client %s subscribed to %s with id %s", client.sessionID, destination, id)
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

// Broadcast sends a message to all subscribers of a destination
func (s *StompServer) Broadcast(destination string, message string) {
	s.mu.RLock()
	subscribers, ok := s.topics[destination]
	s.mu.RUnlock()

	if !ok || len(subscribers) == 0 {
		return
	}

	for client, sub := range subscribers {
		frame := &StompFrame{
			Command: "MESSAGE",
			Headers: map[string]string{
				"destination":  destination,
				"message-id":   generateMessageID(),
				"subscription": sub.ID, // Use the actual subscription ID
			},
			Body: message,
		}
		go client.sendFrame(frame)
	}
}

// BroadcastToUser sends a message to a specific user's destination
func (s *StompServer) BroadcastToUser(username string, destination string, message string) {
	// Convert /user/topic/xxx to /topic/xxx for matching
	userDestination := "/user" + destination

	s.mu.RLock()
	subscribers, ok := s.topics[userDestination]
	s.mu.RUnlock()

	if !ok || len(subscribers) == 0 {
		return
	}

	for client, sub := range subscribers {
		// In production, check if client.username matches username
		frame := &StompFrame{
			Command: "MESSAGE",
			Headers: map[string]string{
				"destination":  userDestination,
				"message-id":   generateMessageID(),
				"subscription": sub.ID,
			},
			Body: message,
		}
		go client.sendFrame(frame)
	}
}

// BroadcastToAll sends a message to all connected clients on a destination
func (s *StompServer) BroadcastToAll(destination string, message interface{}) {
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
		line := lines[i]
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

	select {
	case c.send <- []byte(buf.String()):
		return nil
	default:
		return fmt.Errorf("send channel full")
	}
}

func (c *StompClient) writePump() {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.conn.WriteMessage(websocket.TextMessage, message); err != nil {
				return
			}

		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func generateSessionID() string {
	b := make([]byte, 16)
	rand.Read(b)
	return fmt.Sprintf("session-%s", hex.EncodeToString(b))
}

func generateMessageID() string {
	b := make([]byte, 16)
	rand.Read(b)
	return fmt.Sprintf("msg-%s-%d", hex.EncodeToString(b), time.Now().UnixNano())
}

// handleSockJSInfo handles SockJS info requests
func (s *StompServer) handleSockJSInfo(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Credentials", "true")

	info := map[string]interface{}{
		"websocket":     true,
		"origins":       []string{"*:*"},
		"cookie_needed": false,
		"entropy":       generateEntropy(),
	}

	json.NewEncoder(w).Encode(info)
}

func generateEntropy() int64 {
	b := make([]byte, 4)
	rand.Read(b)
	var entropy int64
	for _, v := range b {
		entropy = (entropy << 8) | int64(v)
	}
	return entropy
}
