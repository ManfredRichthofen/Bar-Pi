package middleware

import (
	"net/http"
	"strings"

	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/auth"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/models"
	"github.com/gin-gonic/gin"
)

const (
	AuthorizationHeader = "Authorization"
	BearerPrefix        = "Bearer "
	UserContextKey      = "user"
	ClaimsContextKey    = "claims"
)

func AuthMiddleware(jwtService *auth.JWTService) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader(AuthorizationHeader)
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		if !strings.HasPrefix(authHeader, BearerPrefix) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header format"})
			c.Abort()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, BearerPrefix)
		claims, err := jwtService.ValidateToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		c.Set(ClaimsContextKey, claims)
		c.Next()
	}
}

func RequireRole(role models.Role) gin.HandlerFunc {
	return func(c *gin.Context) {
		claims, exists := c.Get(ClaimsContextKey)
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			c.Abort()
			return
		}

		userClaims := claims.(*auth.Claims)
		if userClaims.Role.Level() < role.Level() {
			c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
			c.Abort()
			return
		}

		c.Next()
	}
}

func GetClaims(c *gin.Context) (*auth.Claims, bool) {
	claims, exists := c.Get(ClaimsContextKey)
	if !exists {
		return nil, false
	}
	return claims.(*auth.Claims), true
}
