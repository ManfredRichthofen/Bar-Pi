package websocket

import (
	"encoding/json"
	"log"
	"strconv"
)

// WebSocket destination constants matching the Spring Boot backend
const (
	WS_COCKTAIL_DESTINATION           = "/topic/cocktailprogress"
	WS_PUMP_LAYOUT_DESTINATION        = "/topic/pump/layout"
	WS_PUMP_RUNNING_STATE_DESTINATION = "/topic/pump/runningstate"
	WS_UI_STATE_INFOS                 = "/topic/uistateinfos"
	WS_UPDATE_STATUS_DESTINATION      = "/topic/update/status"
)

// Service provides high-level WebSocket messaging functionality
type Service struct {
	stompServer *StompServer
}

// NewService creates a new WebSocket service
func NewService(stompServer *StompServer) *Service {
	return &Service{
		stompServer: stompServer,
	}
}

// BroadcastCocktailProgress broadcasts cocktail progress to all subscribers
func (s *Service) BroadcastCocktailProgress(progress any) {
	if s == nil || s.stompServer == nil {
		return
	}
	if progress == nil {
		s.stompServer.Broadcast(WS_COCKTAIL_DESTINATION, "DELETE")
		return
	}
	s.broadcastJSON(WS_COCKTAIL_DESTINATION, progress)
}

// BroadcastPumpLayout broadcasts pump layout to all subscribers
func (s *Service) BroadcastPumpLayout(pumps any) {
	if s == nil || s.stompServer == nil {
		return
	}
	s.broadcastJSON(WS_PUMP_LAYOUT_DESTINATION, pumps)
}

// BroadcastPumpRunningState broadcasts pump running state
func (s *Service) BroadcastPumpRunningState(pumpID int64, state any) {
	if s == nil || s.stompServer == nil {
		return
	}
	destination := WS_PUMP_RUNNING_STATE_DESTINATION + "/" + strconv.FormatInt(pumpID, 10)
	s.broadcastJSON(destination, state)
}

// BroadcastUpdateStatus broadcasts the self-updater status
func (s *Service) BroadcastUpdateStatus(status any) {
	if s == nil || s.stompServer == nil {
		return
	}
	s.broadcastJSON(WS_UPDATE_STATUS_DESTINATION, status)
}

// InvalidateRecipeScrollCaches broadcasts a cache invalidation message
func (s *Service) InvalidateRecipeScrollCaches() {
	if s == nil || s.stompServer == nil {
		return
	}
	s.stompServer.Broadcast(WS_UI_STATE_INFOS, "INVALIDATE_CACHED_RECIPES")
}

// Helper methods

func (s *Service) broadcastJSON(destination string, data any) {
	jsonData, err := json.Marshal(data)
	if err != nil {
		log.Printf("Error marshaling data for broadcast: %v", err)
		return
	}
	s.stompServer.Broadcast(destination, string(jsonData))
}
