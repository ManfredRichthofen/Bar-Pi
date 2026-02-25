package handlers

import (
	"net/http"

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
	Token      string `json:"token"`
	ExpiresAt  string `json:"expiresAt"`
	User       UserResponse `json:"user"`
}

type UserResponse struct {
	ID       int64  `json:"id"`
	Username string `json:"username"`
	Role     string `json:"role"`
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.userService.Authenticate(req.Username, req.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	token, expiresAt, err := h.jwtService.GenerateToken(user, req.Remember)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, LoginResponse{
		Token:     token,
		ExpiresAt: expiresAt.Format("2006-01-02T15:04:05Z07:00"),
		User: UserResponse{
			ID:       user.ID,
			Username: user.Username,
			Role:     string(user.Role),
		},
	})
}

func (h *AuthHandler) RefreshToken(c *gin.Context) {
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
		return
	}

	tokenString := authHeader[len("Bearer "):]
	newToken, expiresAt, err := h.jwtService.RefreshToken(tokenString)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
		return
	}

	claims, _ := middleware.GetClaims(c)
	c.JSON(http.StatusOK, LoginResponse{
		Token:     newToken,
		ExpiresAt: expiresAt.Format("2006-01-02T15:04:05Z07:00"),
		User: UserResponse{
			ID:       claims.UserID,
			Username: claims.Username,
			Role:     string(claims.Role),
		},
	})
}
