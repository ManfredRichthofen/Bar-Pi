package handlers

import (
	"net/http"
	"strings"

	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/auth"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/middleware"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/service"
	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	userService *service.UserService
	jwtService  *auth.JWTService
}

func NewAuthHandler(userService *service.UserService, jwtService *auth.JWTService) *AuthHandler {
	return &AuthHandler{
		userService: userService,
		jwtService:  jwtService,
	}
}

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
	Remember bool   `json:"remember"`
}

type LoginResponse struct {
	AccessToken     string       `json:"accessToken"`
	TokenExpiration int64        `json:"tokenExpiration"`
	TokenType       string       `json:"tokenType"`
	User            UserResponse `json:"user"`
}

type UserResponse struct {
	ID               int64  `json:"id"`
	Username         string `json:"username"`
	Role             string `json:"role"`
	AdminLevel       int    `json:"adminLevel"`
	AccountNonLocked bool   `json:"accountNonLocked"`
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "message": err.Error()})
		return
	}

	user, err := h.userService.Authenticate(req.Username, req.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials", "message": "Invalid credentials"})
		return
	}

	token, expiresAt, err := h.jwtService.GenerateToken(user, req.Remember)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token", "message": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, LoginResponse{
		AccessToken:     token,
		TokenExpiration: expiresAt.UnixMilli(),
		TokenType:       "Bearer",
		User: UserResponse{
			ID:               user.ID,
			Username:         user.Username,
			Role:             string(user.Role),
			AdminLevel:       user.Role.Level(),
			AccountNonLocked: user.IsAccountNonLocked,
		},
	})
}

func (h *AuthHandler) RefreshToken(c *gin.Context) {
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required", "message": "Authorization header required"})
		return
	}

	tokenString := strings.TrimPrefix(authHeader, "Bearer ")
	newToken, expiresAt, err := h.jwtService.RefreshToken(tokenString)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token", "message": "Invalid or expired token"})
		return
	}

	claims, ok := middleware.GetClaims(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized", "message": "Unauthorized"})
		return
	}

	c.JSON(http.StatusOK, LoginResponse{
		AccessToken:     newToken,
		TokenExpiration: expiresAt.UnixMilli(),
		TokenType:       "Bearer",
		User: UserResponse{
			ID:               claims.UserID,
			Username:         claims.Username,
			Role:             string(claims.Role),
			AdminLevel:       claims.Role.Level(),
			AccountNonLocked: true,
		},
	})
}
