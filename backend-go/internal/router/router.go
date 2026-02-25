package router

import (
	"io/fs"
	"log"
	"net/http"
	"path/filepath"
	"strings"

	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/auth"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/config"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/handlers"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/middleware"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/models"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/repository"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/service"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/static"
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
	glassRepo := repository.NewGlassRepository(db)
	categoryRepo := repository.NewCategoryRepository(db)
	pumpRepo := repository.NewPumpRepository(db)

	userService := service.NewUserService(userRepo)
	recipeService := service.NewRecipeService(recipeRepo)
	ingredientService := service.NewIngredientService(ingredientRepo)
	glassService := service.NewGlassService(glassRepo)
	categoryService := service.NewCategoryService(categoryRepo)
	pumpService := service.NewPumpService(pumpRepo, ingredientRepo)
	systemService := service.NewSystemService(cfg)
	cocktailService := service.NewCocktailService(recipeRepo, ingredientRepo, pumpRepo)
	imageService := service.NewImageService("./images")

	if err := userService.EnsureDefaultAdmin(); err != nil {
		panic(err)
	}

	// Initialize GPIO service (may fail on non-Raspberry Pi systems)
	gpioService, err := service.NewGPIOService()
	if err != nil {
		// Log warning but don't panic - GPIO may not be available
		println("Warning: GPIO service not available:", err.Error())
	}

	jwtService := auth.NewJWTService(cfg)

	authHandler := handlers.NewAuthHandler(userService, jwtService)
	userHandler := handlers.NewUserHandler(userService)
	recipeHandler := handlers.NewRecipeHandler(recipeService, imageService)
	ingredientHandler := handlers.NewIngredientHandler(ingredientService)
	glassHandler := handlers.NewGlassHandler(glassService)
	categoryHandler := handlers.NewCategoryHandler(categoryService)
	pumpHandler := handlers.NewPumpHandler(pumpService)
	systemHandler := handlers.NewSystemHandler(systemService)
	cocktailHandler := handlers.NewCocktailHandler(cocktailService)

	var gpioHandler *handlers.GPIOHandler
	if gpioService != nil {
		gpioHandler = handlers.NewGPIOHandler(gpioService)
	}

	wsHub := websocket.NewHub()
	go wsHub.Run()

	// STOMP server for SockJS compatibility
	stompServer := websocket.NewStompServer(wsHub)

	// WebSocket endpoints - support both /websocket (SockJS pattern) and /api/ws
	r.GET("/websocket", func(c *gin.Context) {
		stompServer.ServeHTTP(c.Writer, c.Request)
	})
	r.GET("/websocket/*any", func(c *gin.Context) {
		stompServer.ServeHTTP(c.Writer, c.Request)
	})

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

		ingredientGroup := api.Group("/ingredient")
		ingredientGroup.Use(middleware.AuthMiddleware(jwtService))
		{
			ingredientGroup.GET("", ingredientHandler.GetAll)
			ingredientGroup.GET("/:id", ingredientHandler.GetByID)
			ingredientGroup.POST("", middleware.RequireRole(models.RoleAdmin), ingredientHandler.Create)
			ingredientGroup.PUT("/:id", middleware.RequireRole(models.RoleAdmin), ingredientHandler.Update)
			ingredientGroup.DELETE("/:id", middleware.RequireRole(models.RoleAdmin), ingredientHandler.Delete)
			ingredientGroup.GET("/export", middleware.RequireRole(models.RoleAdmin), ingredientHandler.GetExport)
			ingredientGroup.PUT("/:id/bar", ingredientHandler.AddToBar)
			ingredientGroup.DELETE("/:id/bar", ingredientHandler.RemoveFromBar)
		}

		glassGroup := api.Group("/glass")
		glassGroup.Use(middleware.AuthMiddleware(jwtService))
		{
			glassGroup.GET("", glassHandler.GetAll)
			glassGroup.GET("/:id", glassHandler.GetByID)
			glassGroup.POST("", middleware.RequireRole(models.RoleAdmin), glassHandler.Create)
			glassGroup.PUT("/:id", middleware.RequireRole(models.RoleAdmin), glassHandler.Update)
			glassGroup.DELETE("/:id", middleware.RequireRole(models.RoleAdmin), glassHandler.Delete)
		}

		categoryGroup := api.Group("/category")
		categoryGroup.Use(middleware.AuthMiddleware(jwtService))
		{
			categoryGroup.GET("", categoryHandler.GetAll)
			categoryGroup.GET("/:id", categoryHandler.GetByID)
			categoryGroup.POST("", middleware.RequireRole(models.RoleAdmin), categoryHandler.Create)
			categoryGroup.PUT("/:id", middleware.RequireRole(models.RoleAdmin), categoryHandler.Update)
			categoryGroup.DELETE("/:id", middleware.RequireRole(models.RoleAdmin), categoryHandler.Delete)
		}

		pumpGroup := api.Group("/pump")
		pumpGroup.Use(middleware.AuthMiddleware(jwtService))
		{
			pumpGroup.GET("", pumpHandler.GetAll)
			pumpGroup.GET("/:id", pumpHandler.GetByID)
			pumpGroup.POST("", middleware.RequireRole(models.RoleAdmin), pumpHandler.Create)
			pumpGroup.PATCH("/:id", pumpHandler.Update)
			pumpGroup.DELETE("/:id", middleware.RequireRole(models.RoleAdmin), pumpHandler.Delete)
			pumpGroup.PUT("/:id/pumpup", pumpHandler.PumpUp)
			pumpGroup.PUT("/:id/pumpback", pumpHandler.PumpBack)
			pumpGroup.PUT("/start", pumpHandler.Start)
			pumpGroup.PUT("/stop", pumpHandler.Stop)
		}

		cocktailGroup := api.Group("/cocktail")
		cocktailGroup.Use(middleware.AuthMiddleware(jwtService))
		{
			cocktailGroup.PUT("/:recipeId", cocktailHandler.OrderCocktail)
			cocktailGroup.PUT("/:recipeId/feasibility", cocktailHandler.CheckFeasibility)
			cocktailGroup.DELETE("", cocktailHandler.CancelCocktail)
			cocktailGroup.POST("/continueproduction", cocktailHandler.ContinueProduction)
			cocktailGroup.GET("/progress", cocktailHandler.GetProgress)
		}

		systemGroup := api.Group("/system")
		systemGroup.Use(middleware.AuthMiddleware(jwtService))
		{
			systemGroup.GET("/settings/appearance", systemHandler.GetAppearance)
			systemGroup.PUT("/settings/appearance", middleware.RequireRole(models.RoleAdmin), systemHandler.SetAppearance)
			systemGroup.GET("/settings/appearance/language", systemHandler.GetLanguages)
			systemGroup.GET("/settings/global", systemHandler.GetGlobalSettings)
			systemGroup.PUT("/settings/donated", systemHandler.SetDonated)
			systemGroup.PUT("/settings/sawdonationdisclaimer", systemHandler.SetDonationDisclaimer)
			systemGroup.GET("/settings/i2c", middleware.RequireRole(models.RoleAdmin), systemHandler.GetI2CSettings)
			systemGroup.PUT("/settings/i2c", middleware.RequireRole(models.RoleAdmin), systemHandler.SetI2CSettings)
			systemGroup.GET("/settings/defaultfilter", systemHandler.GetDefaultFilter)
			systemGroup.PUT("/settings/defaultfilter", middleware.RequireRole(models.RoleAdmin), systemHandler.SetDefaultFilter)
			systemGroup.PUT("/shutdown", middleware.RequireRole(models.RoleAdmin), systemHandler.Shutdown)
		}

		// GPIO routes (only if GPIO service is available)
		if gpioHandler != nil {
			gpioGroup := api.Group("/gpio")
			gpioGroup.Use(middleware.AuthMiddleware(jwtService))
			{
				gpioGroup.GET("/status", gpioHandler.GetStatus)
				gpioGroup.POST("/test", gpioHandler.TestPin)
				gpioGroup.POST("/pump", gpioHandler.RunPump)
				gpioGroup.GET("/pin/:pin", gpioHandler.GetPinValue)
				gpioGroup.DELETE("/pin/:pin", gpioHandler.ReleasePin)
			}
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

	// Serve static frontend files only in bundle mode
	if !static.IsStandaloneMode() {
		setupStaticFileServer(r)
	} else {
		log.Println("Running in standalone mode - API-only, no frontend serving")
	}

	return r
}

// setupStaticFileServer configures serving of static frontend files
// Supports both embedded files and external dist directory
func setupStaticFileServer(r *gin.Engine) {
	distFS, err := static.GetDistFS()
	if err != nil {
		log.Printf("Warning: Frontend files not available: %v", err)
		log.Println("API endpoints will work, but no frontend will be served")
		return
	}

	if static.HasEmbeddedFiles() {
		log.Println("Serving embedded frontend files")
	} else {
		log.Println("Serving frontend files from external dist directory")
	}

	// Serve static files
	r.NoRoute(func(c *gin.Context) {
		path := c.Request.URL.Path

		// Don't handle API routes
		if strings.HasPrefix(path, "/api/") {
			c.JSON(http.StatusNotFound, gin.H{"error": "API endpoint not found"})
			return
		}

		// Clean the path
		path = filepath.Clean(path)
		if path == "/" {
			path = "index.html"
		} else {
			path = strings.TrimPrefix(path, "/")
		}

		// Try to serve the file
		file, err := distFS.Open(path)
		if err != nil {
			// For SPA routing: if file not found and not an asset, serve index.html
			if !strings.Contains(path, ".") {
				indexFile, indexErr := distFS.Open("index.html")
				if indexErr != nil {
					c.JSON(http.StatusNotFound, gin.H{"error": "Page not found"})
					return
				}
				defer indexFile.Close()

				stat, _ := indexFile.(fs.File).Stat()
				c.DataFromReader(http.StatusOK, stat.Size(), "text/html", indexFile, nil)
				return
			}

			c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
			return
		}
		defer file.Close()

		// Get file info for content type and size
		stat, err := file.(fs.File).Stat()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read file"})
			return
		}

		// Determine content type based on file extension
		contentType := getContentType(path)
		c.DataFromReader(http.StatusOK, stat.Size(), contentType, file, nil)
	})
}

// getContentType returns the MIME type for common file extensions
func getContentType(path string) string {
	ext := filepath.Ext(path)
	switch ext {
	case ".html":
		return "text/html"
	case ".css":
		return "text/css"
	case ".js":
		return "application/javascript"
	case ".json":
		return "application/json"
	case ".png":
		return "image/png"
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".gif":
		return "image/gif"
	case ".svg":
		return "image/svg+xml"
	case ".ico":
		return "image/x-icon"
	case ".woff":
		return "font/woff"
	case ".woff2":
		return "font/woff2"
	case ".ttf":
		return "font/ttf"
	case ".webp":
		return "image/webp"
	case ".webmanifest":
		return "application/manifest+json"
	default:
		return "application/octet-stream"
	}
}
