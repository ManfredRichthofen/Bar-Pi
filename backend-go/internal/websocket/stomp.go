package websocket

import (
	"fmt"
	"log"
	"net/http"
	"strings"
	"sync"

	"github.com/gorilla/websocket"
)

type StompServer struct {
	hub      *Hub
	upgrader websocket.Upgrader
	clients  map[*StompClient]bool
	mu       sync.RWMutex
	topics   map[string]map[*StompClient]bool
}

type StompClient struct {
	conn          *websocket.Conn
	subscriptions map[string]string
	sessionID     string
	mu            sync.RWMutex
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
		topics:  make(map[string]map[*StompClient]bool),
	}
}

func (s *StompServer) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	conn, err := s.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}

	client := &StompClient{
		conn:          conn,
		subscriptions: make(map[string]string),
		sessionID:     generateSessionID(),
	}

	s.mu.Lock()
	s.clients[client] = true
	s.mu.Unlock()

	defer func() {
		s.mu.Lock()
		delete(s.clients, client)
		for topic := range client.subscriptions {
			if subscribers, ok := s.topics[topic]; ok {
				delete(subscribers, client)
			}
		}
		s.mu.Unlock()
		conn.Close()
	}()

	s.handleClient(client)
}

func (s *StompServer) handleClient(client *StompClient) {
	for {
		_, message, err := client.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		frame := parseStompFrame(string(message))
		s.handleFrame(client, frame)
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
}

func (s *StompServer) handleSubscribe(client *StompClient, frame *StompFrame) {
	destination := frame.Headers["destination"]
	id := frame.Headers["id"]

	if destination == "" || id == "" {
		return
	}

	client.mu.Lock()
	client.subscriptions[id] = destination
	client.mu.Unlock()

	s.mu.Lock()
	if s.topics[destination] == nil {
		s.topics[destination] = make(map[*StompClient]bool)
	}
	s.topics[destination][client] = true
	s.mu.Unlock()

	log.Printf("Client subscribed to %s with id %s", destination, id)
}

func (s *StompServer) handleUnsubscribe(client *StompClient, frame *StompFrame) {
	id := frame.Headers["id"]

	client.mu.RLock()
	destination, ok := client.subscriptions[id]
	client.mu.RUnlock()

	if !ok {
		return
	}

	client.mu.Lock()
	delete(client.subscriptions, id)
	client.mu.Unlock()

	s.mu.Lock()
	if subscribers, ok := s.topics[destination]; ok {
		delete(subscribers, client)
	}
	s.mu.Unlock()
}

func (s *StompServer) handleSend(client *StompClient, frame *StompFrame) {
	destination := frame.Headers["destination"]
	if destination == "" {
		return
	}

	s.Broadcast(destination, frame.Body)
}

func (s *StompServer) Broadcast(destination string, message string) {
	s.mu.RLock()
	subscribers, ok := s.topics[destination]
	s.mu.RUnlock()

	if !ok {
		return
	}

	frame := &StompFrame{
		Command: "MESSAGE",
		Headers: map[string]string{
			"destination":  destination,
			"message-id":   generateMessageID(),
			"subscription": "0",
		},
		Body: message,
	}

	for client := range subscribers {
		go client.sendFrame(frame)
	}
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

	c.mu.Lock()
	defer c.mu.Unlock()
	return c.conn.WriteMessage(websocket.TextMessage, []byte(buf.String()))
}

func generateSessionID() string {
	return fmt.Sprintf("session-%d", len(fmt.Sprintf("%p", &struct{}{})))
}

func generateMessageID() string {
	return fmt.Sprintf("msg-%d", len(fmt.Sprintf("%p", &struct{}{})))
}
