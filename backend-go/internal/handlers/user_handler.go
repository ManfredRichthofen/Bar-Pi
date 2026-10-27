package handlers

import (
	"net/http"
	"strconv"

	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/middleware"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/models"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/service"
	"github.com/gin-gonic/gin"
)

type UserHandler struct {
	userService   *service.UserService
	systemService *service.SystemService
}

func NewUserHandler(userService *service.UserService, systemService ...*service.SystemService) *UserHandler {
	h := &UserHandler{userService: userService}
	if len(systemService) > 0 {
		h.systemService = systemService[0]
	}
	return h
}

type UserDtoPayload struct {
	Username           string `json:"username"`
	Password           string `json:"password"`
	Pin                string `json:"pin"`
	ClearPin           *bool  `json:"clearPin"`
	MaxDrinksPerDay    *int   `json:"maxDrinksPerDay"`
	Role               string `json:"role"`
	AdminLevel         *int   `json:"adminLevel"`
	AccountNonLocked   *bool  `json:"accountNonLocked"`
	IsAccountNonLocked *bool  `json:"isAccountNonLocked"`
}

type CreateOrUpdateUserEnvelope struct {
	UpdatePassword     *bool           `json:"updatePassword"`
	UserDto            *UserDtoPayload `json:"userDto"`
	Username           string          `json:"username"`
	Password           string          `json:"password"`
	Pin                string          `json:"pin"`
	ClearPin           *bool           `json:"clearPin"`
	MaxDrinksPerDay    *int            `json:"maxDrinksPerDay"`
	Role               string          `json:"role"`
	AdminLevel         *int            `json:"adminLevel"`
	AccountNonLocked   *bool           `json:"accountNonLocked"`
	IsAccountNonLocked *bool           `json:"isAccountNonLocked"`
}

type extractedUserFields struct {
	Username    string
	Password    string
	Role        models.Role
	NonLocked   bool
	UpdatePwd   bool
	PinOpts     service.UserPinOptions
}

func extractUserFields(env CreateOrUpdateUserEnvelope) extractedUserFields {
	dto := env.UserDto
	if dto == nil {
		dto = &UserDtoPayload{
			Username:           env.Username,
			Password:           env.Password,
			Pin:                env.Pin,
			ClearPin:           env.ClearPin,
			MaxDrinksPerDay:    env.MaxDrinksPerDay,
			Role:               env.Role,
			AdminLevel:         env.AdminLevel,
			AccountNonLocked:   env.AccountNonLocked,
			IsAccountNonLocked: env.IsAccountNonLocked,
		}
	}

	fields := extractedUserFields{
		Username:  dto.Username,
		Password:  dto.Password,
		Role:      models.ParseRole(dto.Role, dto.AdminLevel),
		NonLocked: true,
	}
	if dto.AccountNonLocked != nil {
		fields.NonLocked = *dto.AccountNonLocked
	} else if dto.IsAccountNonLocked != nil {
		fields.NonLocked = *dto.IsAccountNonLocked
	}
	if env.UpdatePassword != nil {
		fields.UpdatePwd = *env.UpdatePassword
	} else {
		fields.UpdatePwd = fields.Password != "" && fields.Password != "dummy_password_for_update"
	}

	fields.PinOpts = service.UserPinOptions{
		Pin:     dto.Pin,
		ClearPin: dto.ClearPin != nil && *dto.ClearPin,
	}
	if dto.MaxDrinksPerDay != nil {
		fields.PinOpts.MaxDrinksPerDay = dto.MaxDrinksPerDay
		fields.PinOpts.UpdateMaxDrinks = true
	}
	return fields
}

type UpdatePasswordRequest struct {
	NewPassword string `json:"newPassword" binding:"required"`
}

func (h *UserHandler) GetAll(c *gin.Context) {
	users, err := h.userService.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users", "message": "Failed to fetch users"})
		return
	}

	c.JSON(http.StatusOK, users)
}

func (h *UserHandler) GetCurrent(c *gin.Context) {
	claims, ok := middleware.GetClaims(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized", "message": "Unauthorized"})
		return
	}

	user, err := h.userService.GetByID(claims.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user", "message": "Failed to fetch user"})
		return
	}
	if user == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found", "message": "User not found"})
		return
	}

	c.JSON(http.StatusOK, user)
}

func (h *UserHandler) GetCurrentOrdering(c *gin.Context) {
	claims, ok := middleware.GetClaims(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized", "message": "Unauthorized"})
		return
	}

	user, err := h.userService.GetByID(claims.UserID)
	if err != nil || user == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found", "message": "User not found"})
		return
	}

	drinksToday, err := h.userService.CountCompletedOrdersToday(claims.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch drink count", "message": "Failed to fetch drink count"})
		return
	}

	requirePin := false
	if h.systemService != nil {
		requirePin = h.systemService.GetOrderingPolicySettings().RequirePinAfterDrink
	}

	c.JSON(http.StatusOK, gin.H{
		"drinksToday":          drinksToday,
		"maxDrinksPerDay":      user.MaxDrinksPerDay,
		"requirePinAfterDrink": requirePin,
		"hasPin":               user.HasPin(),
	})
}

func (h *UserHandler) UpdateCurrent(c *gin.Context) {
	claims, ok := middleware.GetClaims(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized", "message": "Unauthorized"})
		return
	}

	var env CreateOrUpdateUserEnvelope
	if err := c.ShouldBindJSON(&env); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "message": err.Error()})
		return
	}

	existing, err := h.userService.GetByID(claims.UserID)
	if err != nil || existing == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found", "message": "User not found"})
		return
	}

	fields := extractUserFields(env)
	username := fields.Username
	if username == "" {
		username = existing.Username
	}

	updated, err := h.userService.UpdateUserFullWithOptions(
		claims.UserID,
		username,
		existing.Role,
		existing.IsAccountNonLocked,
		fields.UpdatePwd,
		fields.Password,
		fields.PinOpts,
	)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, updated)
}

func (h *UserHandler) GetByID(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID", "message": "Invalid user ID"})
		return
	}

	claims, ok := middleware.GetClaims(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized", "message": "Unauthorized"})
		return
	}
	if claims.UserID != id && claims.Role.Level() < models.RoleAdmin.Level() {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden", "message": "Forbidden"})
		return
	}

	user, err := h.userService.GetByID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user", "message": "Failed to fetch user"})
		return
	}
	if user == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found", "message": "User not found"})
		return
	}

	c.JSON(http.StatusOK, user)
}

func (h *UserHandler) Create(c *gin.Context) {
	var env CreateOrUpdateUserEnvelope
	if err := c.ShouldBindJSON(&env); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "message": err.Error()})
		return
	}

	fields := extractUserFields(env)
	user, err := h.userService.CreateWithOptions(fields.Username, fields.Password, fields.Role, fields.NonLocked, fields.PinOpts)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "message": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, user)
}

func (h *UserHandler) Update(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID", "message": "Invalid user ID"})
		return
	}

	var env CreateOrUpdateUserEnvelope
	if err := c.ShouldBindJSON(&env); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "message": err.Error()})
		return
	}

	fields := extractUserFields(env)
	updated, err := h.userService.UpdateUserFullWithOptions(id, fields.Username, fields.Role, fields.NonLocked, fields.UpdatePwd, fields.Password, fields.PinOpts)
	if err != nil {
		if err.Error() == "user not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error(), "message": err.Error()})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, updated)
}

func (h *UserHandler) UpdatePassword(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID", "message": "Invalid user ID"})
		return
	}

	claims, ok := middleware.GetClaims(c)
	if !ok || (claims.UserID != id && claims.Role.Level() < models.RoleAdmin.Level()) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Unauthorized", "message": "Unauthorized"})
		return
	}

	var req UpdatePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "message": err.Error()})
		return
	}

	if err := h.userService.UpdatePassword(id, req.NewPassword); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update password", "message": "Failed to update password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password updated successfully"})
}

func (h *UserHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID", "message": "Invalid user ID"})
		return
	}

	claims, ok := middleware.GetClaims(c)
	if ok && claims.UserID == id {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete your own user account", "message": "Cannot delete your own user account"})
		return
	}

	if err := h.userService.Delete(id); err != nil {
		if err.Error() == "user not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error(), "message": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user", "message": "Failed to delete user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
}
