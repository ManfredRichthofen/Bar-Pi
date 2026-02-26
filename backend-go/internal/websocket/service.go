package websocket

import (
	"encoding/json"
	"log"
)

// WebSocket destination constants matching the Spring Boot backend
const (
	WS_COCKTAIL_DESTINATION           = "/topic/cocktailprogress"
	WS_PUMP_LAYOUT_DESTINATION        = "/topic/pump/layout"
	WS_ACTIONS_STATUS_DESTINATION     = "/topic/eventactionstatus"
	WS_ACTIONS_LOG_DESTINATION        = "/topic/eventactionlog"
	WS_DISPENSING_AREA                = "/topic/dispensingarea"
	WS_PUMP_RUNNING_STATE_DESTINATION = "/topic/pump/runningstate"
	WS_UI_STATE_INFOS                 = "/topic/uistateinfos"
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
	s.broadcastJSON(WS_COCKTAIL_DESTINATION, progress)
}

// SendCocktailProgressToUser sends cocktail progress to a specific user
func (s *Service) SendCocktailProgressToUser(progress any, username string) {
	s.sendJSONToUser(username, WS_COCKTAIL_DESTINATION, progress)
}

// BroadcastPumpLayout broadcasts pump layout to all subscribers
func (s *Service) BroadcastPumpLayout(pumps any) {
	s.broadcastJSON(WS_PUMP_LAYOUT_DESTINATION, pumps)
}

// SendPumpLayoutToUser sends pump layout to a specific user
func (s *Service) SendPumpLayoutToUser(pumps any, username string) {
	s.sendJSONToUser(username, WS_PUMP_LAYOUT_DESTINATION, pumps)
}

// BroadcastRunningEventActionsStatus broadcasts event action status
func (s *Service) BroadcastRunningEventActionsStatus(status any) {
	s.broadcastJSON(WS_ACTIONS_STATUS_DESTINATION, status)
}

// SendRunningEventActionsStatusToUser sends event action status to a specific user
func (s *Service) SendRunningEventActionsStatusToUser(status any, username string) {
	s.sendJSONToUser(username, WS_ACTIONS_STATUS_DESTINATION, status)
}

// BroadcastEventActionLog broadcasts event action log
func (s *Service) BroadcastEventActionLog(actionID int64, logEntries any) {
	destination := WS_ACTIONS_LOG_DESTINATION + "/" + string(rune(actionID))
	s.broadcastJSON(destination, logEntries)
}

// SendEventActionLogToUser sends event action log to a specific user
func (s *Service) SendEventActionLogToUser(actionID int64, logEntries any, username string) {
	destination := WS_ACTIONS_LOG_DESTINATION + "/" + string(rune(actionID))
	s.sendJSONToUser(username, destination, logEntries)
}

// BroadcastClearEventActionLog broadcasts a clear signal for event action log
func (s *Service) BroadcastClearEventActionLog(actionID int64) {
	destination := WS_ACTIONS_LOG_DESTINATION + "/" + string(rune(actionID))
	s.stompServer.Broadcast(destination, "DELETE")
}

// BroadcastPumpRunningState broadcasts pump running state
func (s *Service) BroadcastPumpRunningState(pumpID int64, state any) {
	destination := WS_PUMP_RUNNING_STATE_DESTINATION + "/" + string(rune(pumpID))
	s.broadcastJSON(destination, state)
}

// SendPumpRunningStateToUser sends pump running state to a specific user
func (s *Service) SendPumpRunningStateToUser(pumpID int64, state any, username string) {
	destination := WS_PUMP_RUNNING_STATE_DESTINATION + "/" + string(rune(pumpID))
	s.sendJSONToUser(username, destination, state)
}

// BroadcastDetectedGlass broadcasts detected glass state
func (s *Service) BroadcastDetectedGlass(state any) {
	s.broadcastJSON(WS_DISPENSING_AREA, state)
}

// SendDetectedGlassToUser sends detected glass state to a specific user
func (s *Service) SendDetectedGlassToUser(state any, username string) {
	s.sendJSONToUser(username, WS_DISPENSING_AREA, state)
}

// InvalidateRecipeScrollCaches broadcasts a cache invalidation message
func (s *Service) InvalidateRecipeScrollCaches() {
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

func (s *Service) sendJSONToUser(username string, destination string, data any) {
	jsonData, err := json.Marshal(data)
	if err != nil {
		log.Printf("Error marshaling data for user send: %v", err)
		return
	}
	s.stompServer.BroadcastToUser(username, destination, string(jsonData))
}
