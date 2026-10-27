package handlers

import (
	"net/http"
	"strconv"

	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/models"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/repository"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/service"
	"github.com/gin-gonic/gin"
)

type EventHandler struct {
	repo    *repository.EventRepository
	service *service.EventService
}

func NewEventHandler(repo *repository.EventRepository, svc *service.EventService) *EventHandler {
	return &EventHandler{repo: repo, service: svc}
}

func (h *EventHandler) GetAll(c *gin.Context) {
	actions, err := h.repo.FindAll()
	if err != nil {
		respondGPIOError(c, err)
		return
	}
	dtos := make([]models.EventActionDto, 0, len(actions))
	for _, a := range actions {
		dtos = append(dtos, a.ToDto())
	}
	c.JSON(http.StatusOK, dtos)
}

func (h *EventHandler) GetTriggers(c *gin.Context) {
	c.JSON(http.StatusOK, models.EventTriggers)
}

func (h *EventHandler) GetByID(c *gin.Context) {
	action, ok := h.load(c)
	if !ok {
		return
	}
	c.JSON(http.StatusOK, action.ToDto())
}

func (h *EventHandler) Create(c *gin.Context) {
	var dto models.EventActionDto
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "message": err.Error()})
		return
	}
	action := dto.ToModel()
	if err := h.repo.Create(&action); err != nil {
		respondGPIOError(c, err)
		return
	}
	c.JSON(http.StatusCreated, action.ToDto())
}

func (h *EventHandler) Update(c *gin.Context) {
	existing, ok := h.load(c)
	if !ok {
		return
	}
	var dto models.EventActionDto
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "message": err.Error()})
		return
	}
	dto.ID = existing.ID
	action := dto.ToModel()
	if err := h.repo.Update(&action); err != nil {
		respondGPIOError(c, err)
		return
	}
	c.JSON(http.StatusOK, action.ToDto())
}

func (h *EventHandler) Delete(c *gin.Context) {
	action, ok := h.load(c)
	if !ok {
		return
	}
	if err := h.repo.Delete(action.ID); err != nil {
		respondGPIOError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Event deleted"})
}

// Run executes an action immediately so it can be tested without producing a drink.
func (h *EventHandler) Run(c *gin.Context) {
	action, ok := h.load(c)
	if !ok {
		return
	}
	if err := h.service.Execute(*action); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Event executed"})
}

func (h *EventHandler) load(c *gin.Context) (*models.EventAction, bool) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid event ID", "message": "Invalid event ID"})
		return nil, false
	}
	action, err := h.repo.FindByID(id)
	if err != nil {
		respondGPIOError(c, err)
		return nil, false
	}
	if action == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Event not found", "message": "Event not found"})
		return nil, false
	}
	return action, true
}
