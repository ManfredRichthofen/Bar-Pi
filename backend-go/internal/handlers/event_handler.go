package handlers

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strconv"
	"strings"

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

func (h *EventHandler) GetExecutionGroups(c *gin.Context) {
	groups, err := h.repo.FindExecutionGroups()
	if err != nil {
		respondGPIOError(c, err)
		return
	}
	c.JSON(http.StatusOK, groups)
}

func (h *EventHandler) Create(c *gin.Context) {
	dto, ok := bindEventAction(c)
	if !ok {
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
	dto, ok := bindEventAction(c)
	if !ok {
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

// Start executes an action immediately, without waiting for its trigger.
func (h *EventHandler) Start(c *gin.Context) {
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

// KillProcess exists for CocktailPi client compatibility. Actions here run to completion
// without a long-lived process, so there is never one to kill.
func (h *EventHandler) KillProcess(c *gin.Context) {
	c.JSON(http.StatusNotFound, gin.H{"error": "Process not found", "message": "Process not found"})
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

// bindEventAction reads the DTO from plain JSON or from CocktailPi's multipart form,
// where it arrives as the "eventAction" part next to an optional "file" part.
func bindEventAction(c *gin.Context) (models.EventActionDto, bool) {
	var dto models.EventActionDto
	fail := func(err error) (models.EventActionDto, bool) {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "message": err.Error()})
		return dto, false
	}

	if !strings.HasPrefix(c.ContentType(), "multipart/") {
		if err := c.ShouldBindJSON(&dto); err != nil {
			return fail(err)
		}
		return dto, true
	}

	var raw []byte
	if header, err := c.FormFile("eventAction"); err == nil {
		f, err := header.Open()
		if err != nil {
			return fail(err)
		}
		defer f.Close()
		if raw, err = io.ReadAll(f); err != nil {
			return fail(err)
		}
	} else if v := c.PostForm("eventAction"); v != "" {
		raw = []byte(v)
	} else {
		return fail(errors.New("missing eventAction part"))
	}
	if err := json.Unmarshal(raw, &dto); err != nil {
		return fail(err)
	}
	return dto, true
}
