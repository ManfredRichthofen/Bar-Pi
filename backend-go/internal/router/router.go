package router

import (
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/auth"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/config"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/handlers"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/middleware"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/models"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/repository"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/service"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/websocket"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func Setup(cfg *config.Config, db *gorm.DB) *gin.Engine {
	if cfg.Server.Port != 8080 {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default()
	r.Use(middleware.CORS())

	userRepo := repository.NewUserRepository(db)
	recipeRepo := repository.NewRecipeRepository(db)
	ingredientRepo := repository.NewIngredientRepository(db)

	userService := service.NewUserService(userRepo)
	recipeService := service.NewRecipeService(recipeRepo)

	if err := userService.EnsureDefaultAdmin(); err != nil {
		panic(err)
	}

	jwtService := auth.NewJWTService(cfg)

	authHandler := handlers.NewAuthHandler(userService, jwtService)
	userHandler := handlers.NewUserHandler(userService)
	recipeHandler := handlers.NewRecipeHandler(recipeService)

	wsHub := websocket.NewHub()
	go wsHub.Run()

	api := r.Group("/api")
	{
		authGroup := api.Group("/auth")
		{
			authGroup.POST("/login", authHandler.Login)
			authGroup.GET("/refreshToken", middleware.AuthMiddleware(jwtService), authHandler.RefreshToken)
		}

		userGroup := api.Group("/users")
		userGroup.Use(middleware.AuthMiddleware(jwtService))
		{
			userGroup.GET("", middleware.RequireRole(models.RoleAdmin), userHandler.GetAll)
			userGroup.GET("/:id", userHandler.GetByID)
			userGroup.POST("", middleware.RequireRole(models.RoleAdmin), userHandler.Create)
			userGroup.PUT("/:id/password", userHandler.UpdatePassword)
			userGroup.DELETE("/:id", middleware.RequireRole(models.RoleAdmin), userHandler.Delete)
		}

		recipeGroup := api.Group("/recipes")
		recipeGroup.Use(middleware.AuthMiddleware(jwtService))
		{
			recipeGroup.GET("", recipeHandler.GetAll)
			recipeGroup.GET("/search", recipeHandler.Search)
			recipeGroup.GET("/:id", recipeHandler.GetByID)
			recipeGroup.POST("", recipeHandler.Create)
			recipeGroup.PUT("/:id", recipeHandler.Update)
			recipeGroup.DELETE("/:id", recipeHandler.Delete)
		}

		api.GET("/ws", func(c *gin.Context) {
			websocket.ServeWs(wsHub, c.Writer, c.Request)
		})
	}

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"version": cfg.App.Version,
			"name":    cfg.App.Name,
		})
	})

	return r
}
