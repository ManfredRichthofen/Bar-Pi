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
	userService *service.UserService
}

func NewUserHandler(userService *service.UserService) *UserHandler {
	return &UserHandler{userService: userService}
}

type UserDtoPayload struct {
	Username           string `json:"username"`
	Password           string `json:"password"`
	Role               string `json:"role"`
	AdminLevel         *int   `json:"adminLevel"`
	AccountNonLocked   *bool  `json:"accountNonLocked"`
	IsAccountNonLocked *bool  `json:"isAccountNonLocked"`
}

type CreateOrUpdateUserEnvelope struct {
	UpdatePassword *bool           `json:"updatePassword"`
	UserDto        *UserDtoPayload `json:"userDto"`
	Username       string          `json:"username"`
	Password       string          `json:"password"`
	Role           string          `json:"role"`
	AdminLevel     *int            `json:"adminLevel"`
	AccountNonLocked   *bool       `json:"accountNonLocked"`
	IsAccountNonLocked *bool       `json:"isAccountNonLocked"`
}

func extractUserFields(env CreateOrUpdateUserEnvelope) (username, password string, role models.Role, nonLocked bool, updatePwd bool) {
	dto := env.UserDto
	if dto == nil {
		dto = &UserDtoPayload{
			Username:           env.Username,
			Password:           env.Password,
			Role:               env.Role,
			AdminLevel:         env.AdminLevel,
			AccountNonLocked:   env.AccountNonLocked,
			IsAccountNonLocked: env.IsAccountNonLocked,
		}
	}
	username = dto.Username
	password = dto.Password
	role = models.ParseRole(dto.Role, dto.AdminLevel)
	nonLocked = true
	if dto.AccountNonLocked != nil {
		nonLocked = *dto.AccountNonLocked
	} else if dto.IsAccountNonLocked != nil {
		nonLocked = *dto.IsAccountNonLocked
	}
	if env.UpdatePassword != nil {
		updatePwd = *env.UpdatePassword
	} else {
		updatePwd = password != "" && password != "dummy_password_for_update"
	}
	return
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

	username, password, _, _, updatePwd := extractUserFields(env)
	if username == "" {
		username = existing.Username
	}

	updated, err := h.userService.UpdateUserFull(
		claims.UserID,
		username,
		existing.Role,
		existing.IsAccountNonLocked,
		updatePwd,
		password,
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

	username, password, role, nonLocked, _ := extractUserFields(env)
	user, err := h.userService.CreateWithLockState(username, password, role, nonLocked)
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

	username, password, role, nonLocked, updatePwd := extractUserFields(env)
	updated, err := h.userService.UpdateUserFull(id, username, role, nonLocked, updatePwd, password)
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
