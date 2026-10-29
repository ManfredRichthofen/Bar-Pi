package router

import (
	"context"
	"encoding/json"
	"io/fs"
	"log"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/auth"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/config"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/handlers"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/middleware"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/models"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/mqtt"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/process"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/repository"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/service"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/static"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/version"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/websocket"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// Options holds optional process-level hooks for the router
type Options struct {
	// OnRestart is called by the self-updater after the binary was replaced.
	// When nil, self-update installation is reported as unsupported.
	OnRestart func()
}

func SetupWithCleanup(cfg *config.Config, db *gorm.DB) (*gin.Engine, func()) {
	return SetupWithOptions(cfg, db, Options{})
}

func SetupWithOptions(cfg *config.Config, db *gorm.DB, opts Options) (*gin.Engine, func()) {
	if cfg.Server.Port != 8080 {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default()
	r.RedirectTrailingSlash = false
	r.Use(middleware.CORS())

	userRepo := repository.NewUserRepository(db)
	recipeRepo := repository.NewRecipeRepository(db)
	ingredientRepo := repository.NewIngredientRepository(db)
	glassRepo := repository.NewGlassRepository(db)
	categoryRepo := repository.NewCategoryRepository(db)
	pumpRepo := repository.NewPumpRepository(db)
	gpioRepo := repository.NewGPIORepository(db)
	eventRepo := repository.NewEventRepository(db)
	collectionRepo := repository.NewCollectionRepository(db)

	wsHub := websocket.NewHub()
	go wsHub.Run()

	// STOMP server for SockJS compatibility
	stompServer := websocket.NewStompServer()
	wsService := websocket.NewService(stompServer)

	// Initialize GPIO service (may fail on non-Raspberry Pi systems)
	gpioService, err := service.NewGPIOService()
	if err != nil {
		log.Printf("Warning: GPIO hardware service not available (%v) - running in software/simulated GPIO mode", err)
	}

	imagesDir := cfg.App.ImagesDir
	if imagesDir == "" {
		imagesDir = "./images"
	}

	userService := service.NewUserService(userRepo)
	recipeService := service.NewRecipeService(recipeRepo)
	ingredientService := service.NewIngredientService(ingredientRepo)
	glassService := service.NewGlassService(glassRepo)
	categoryService := service.NewCategoryService(categoryRepo)
	systemService := service.NewSystemService(cfg, db)
	pumpService := service.NewPumpService(pumpRepo, ingredientRepo, gpioRepo, gpioService, wsService, systemService)
	cocktailService := service.NewCocktailService(recipeRepo, ingredientRepo, pumpRepo, gpioService, wsService, db, userService)
	var pinController interface {
		SetupOutputPin(pin int) error
		SetPinHigh(pin int) error
		SetPinLow(pin int) error
	}
	if gpioService != nil {
		pinController = gpioService
	}
	eventService := service.NewEventService(eventRepo, pinController)
	statisticsService := service.NewStatisticsService(db)
	imageService := service.NewImageService(imagesDir)
	updateService := service.NewUpdateService(service.UpdateServiceOptions{
		Repo:           cfg.App.UpdaterRepo,
		Token:          cfg.App.GitHubToken,
		CurrentVersion: version.Version,
		Variant:        static.Variant(),
		Disabled:       cfg.App.DisableUpdater,
		Settings:       systemService.GetUpdaterSettings,
		ExecutablePath: process.Executable,
		IsBusy: func() bool {
			p := cocktailService.GetCurrentProgress()
			return p != nil && (p.Status == "pending" || p.Status == "in_progress" || p.Status == "paused")
		},
		Broadcast: func(st service.UpdateStatus) { wsService.BroadcastUpdateStatus(st) },
		Restart:   opts.OnRestart,
	})
	mqttService := mqtt.New(mqtt.Config{
		Stats:           statisticsService,
		Pumps:           pumpRepo,
		Version:         version.Version,
		UpdateAvailable: func() bool { return updateService.Status().HasUpdate },
	})
	cocktailService.SetEventDispatcher(service.MultiDispatcher{eventService, mqttService})
	cocktailService.SetProgressObserver(mqttService.PublishProgress)
	go mqttService.Apply(systemService.GetMQTTSettings())

	updaterCtx, stopUpdater := context.WithCancel(context.Background())
	updateService.Start(updaterCtx)

	// Push initial state immediately when a STOMP client subscribes to a topic
	stompServer.OnSubscribe = func(client *websocket.StompClient, sub *websocket.Subscription) {
		dest := sub.Destination
		switch {
		case dest == websocket.WS_COCKTAIL_DESTINATION || dest == "/user"+websocket.WS_COCKTAIL_DESTINATION:
			prog := cocktailService.GetCurrentProgress()
			if prog == nil {
				stompServer.SendToSubscription(client, sub, "DELETE")
			} else if data, err := json.Marshal(prog); err == nil {
				stompServer.SendToSubscription(client, sub, string(data))
			}

		case dest == websocket.WS_PUMP_LAYOUT_DESTINATION || dest == "/user"+websocket.WS_PUMP_LAYOUT_DESTINATION:
			if pumps, err := pumpService.GetAll(); err == nil {
				if data, err := json.Marshal(pumps); err == nil {
					stompServer.SendToSubscription(client, sub, string(data))
				}
			}

		case dest == websocket.WS_UPDATE_STATUS_DESTINATION || dest == "/user"+websocket.WS_UPDATE_STATUS_DESTINATION:
			if data, err := json.Marshal(updateService.Status()); err == nil {
				stompServer.SendToSubscription(client, sub, string(data))
			}

		case strings.HasPrefix(dest, websocket.WS_PUMP_RUNNING_STATE_DESTINATION+"/") ||
			strings.HasPrefix(dest, "/user"+websocket.WS_PUMP_RUNNING_STATE_DESTINATION+"/"):
			parts := strings.Split(dest, "/")
			if len(parts) > 0 {
				if pumpID, err := strconv.ParseInt(parts[len(parts)-1], 10, 64); err == nil {
					state := pumpService.GetJobState(pumpID)
					if data, err := json.Marshal(state); err == nil {
						stompServer.SendToSubscription(client, sub, string(data))
					}
				}
			}
		}
	}

	cleanup := func() {
		stopUpdater()
		mqttService.Close()
		_ = cocktailService.CancelOrder(0, true)
		_ = pumpService.StopPump(nil)
		if gpioService != nil {
			_ = gpioService.Close()
		}
	}

	if err := userService.EnsureDefaultAdmin(); err != nil {
		log.Printf("Error ensuring default admin user: %v", err)
	}

	jwtService := auth.NewJWTService(cfg)

	authHandler := handlers.NewAuthHandler(userService, jwtService, systemService)
	userHandler := handlers.NewUserHandler(userService, systemService)
	recipeHandler := handlers.NewRecipeHandler(recipeService, imageService, wsService)
	ingredientHandler := handlers.NewIngredientHandler(ingredientService, imageService)
	glassHandler := handlers.NewGlassHandler(glassService)
	categoryHandler := handlers.NewCategoryHandler(categoryService)
	pumpHandler := handlers.NewPumpHandler(pumpService, systemService)
	systemHandler := handlers.NewSystemHandler(systemService)
	systemHandler.SetMQTT(mqttService)
	updateHandler := handlers.NewUpdateHandler(updateService, systemService)
	cocktailHandler := handlers.NewCocktailHandler(cocktailService)
	gpioHandler := handlers.NewGPIOHandler(gpioService, gpioRepo)
	eventHandler := handlers.NewEventHandler(eventRepo, eventService)
	statisticsHandler := handlers.NewStatisticsHandler(statisticsService)
	collectionHandler := handlers.NewCollectionHandler(collectionRepo)

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
			authGroup.POST("/login/pin", authHandler.LoginWithPin)
			authGroup.GET("/login/settings", systemHandler.GetLoginSettings)
			authGroup.GET("/refreshToken", middleware.AuthMiddleware(jwtService), authHandler.RefreshToken)
		}

		registerUserRoutes := func(group *gin.RouterGroup) {
			group.Use(middleware.AuthMiddleware(jwtService))
			group.GET("", middleware.RequireRole(models.RoleAdmin), userHandler.GetAll)
			group.GET("/", middleware.RequireRole(models.RoleAdmin), userHandler.GetAll)
			group.GET("/current", userHandler.GetCurrent)
			group.GET("/current/ordering", userHandler.GetCurrentOrdering)
			group.PUT("/current", userHandler.UpdateCurrent)
			group.GET("/:id", userHandler.GetByID)
			group.POST("", middleware.RequireRole(models.RoleAdmin), userHandler.Create)
			group.POST("/", middleware.RequireRole(models.RoleAdmin), userHandler.Create)
			group.PUT("/:id", middleware.RequireRole(models.RoleAdmin), userHandler.Update)
			group.PUT("/:id/password", userHandler.UpdatePassword)
			group.DELETE("/:id", middleware.RequireRole(models.RoleAdmin), userHandler.Delete)
		}
		registerUserRoutes(api.Group("/user"))
		registerUserRoutes(api.Group("/users"))

		registerRecipeRoutes := func(group *gin.RouterGroup) {
			group.Use(middleware.AuthMiddleware(jwtService))
			group.GET("", recipeHandler.GetAll)
			group.GET("/", recipeHandler.GetAll)
			group.GET("/search", recipeHandler.Search)
			group.GET("/ingredient", recipeHandler.GetIngredientRecipes)
			group.GET("/:id", recipeHandler.GetByID)
			group.GET("/:id/image", recipeHandler.GetImage)
			group.POST("", middleware.RequireRole(models.RoleRecipeCreator), recipeHandler.Create)
			group.POST("/", middleware.RequireRole(models.RoleRecipeCreator), recipeHandler.Create)
			group.PUT("/:id", middleware.RequireRole(models.RoleRecipeCreator), recipeHandler.Update)
			group.DELETE("/:id", middleware.RequireRole(models.RoleRecipeCreator), recipeHandler.Delete)
		}
		registerRecipeRoutes(api.Group("/recipe"))
		registerRecipeRoutes(api.Group("/recipes"))

		ingredientGroup := api.Group("/ingredient")
		ingredientGroup.Use(middleware.AuthMiddleware(jwtService))
		{
			ingredientGroup.GET("", ingredientHandler.GetAll)
			ingredientGroup.GET("/", ingredientHandler.GetAll)
			ingredientGroup.GET("/boostable", ingredientHandler.GetBoostable)
			ingredientGroup.GET("/export", middleware.RequireRole(models.RolePumpIngredientEditor), ingredientHandler.GetExport)
			ingredientGroup.GET("/:id", ingredientHandler.GetByID)
			ingredientGroup.GET("/:id/image", ingredientHandler.GetImage)
			ingredientGroup.POST("", middleware.RequireRole(models.RoleRecipeCreator), ingredientHandler.Create)
			ingredientGroup.POST("/", middleware.RequireRole(models.RoleRecipeCreator), ingredientHandler.Create)
			ingredientGroup.PUT("/:id", middleware.RequireRole(models.RoleRecipeCreator), ingredientHandler.Update)
			ingredientGroup.DELETE("/:id", middleware.RequireRole(models.RoleRecipeCreator), ingredientHandler.Delete)
			ingredientGroup.PUT("/:id/bar", ingredientHandler.AddToBar)
			ingredientGroup.DELETE("/:id/bar", ingredientHandler.RemoveFromBar)
		}

		glassGroup := api.Group("/glass")
		glassGroup.Use(middleware.AuthMiddleware(jwtService))
		{
			glassGroup.GET("", glassHandler.GetAll)
			glassGroup.GET("/", glassHandler.GetAll)
			glassGroup.GET("/:id", glassHandler.GetByID)
			glassGroup.POST("", middleware.RequireRole(models.RoleAdmin), glassHandler.Create)
			glassGroup.POST("/", middleware.RequireRole(models.RoleAdmin), glassHandler.Create)
			glassGroup.PUT("/:id", middleware.RequireRole(models.RoleAdmin), glassHandler.Update)
			glassGroup.DELETE("/:id", middleware.RequireRole(models.RoleAdmin), glassHandler.Delete)
		}

		categoryGroup := api.Group("/category")
		categoryGroup.Use(middleware.AuthMiddleware(jwtService))
		{
			categoryGroup.GET("", categoryHandler.GetAll)
			categoryGroup.GET("/", categoryHandler.GetAll)
			categoryGroup.GET("/:id", categoryHandler.GetByID)
			categoryGroup.POST("", middleware.RequireRole(models.RoleRecipeCreator), categoryHandler.Create)
			categoryGroup.POST("/", middleware.RequireRole(models.RoleRecipeCreator), categoryHandler.Create)
			categoryGroup.PUT("/:id", middleware.RequireRole(models.RoleRecipeCreator), categoryHandler.Update)
			categoryGroup.DELETE("/:id", middleware.RequireRole(models.RoleRecipeCreator), categoryHandler.Delete)
		}

		collectionGroup := api.Group("/collection")
		collectionGroup.Use(middleware.AuthMiddleware(jwtService))
		{
			collectionGroup.GET("", collectionHandler.GetAll)
			collectionGroup.GET("/", collectionHandler.GetAll)
			collectionGroup.GET("/:id", collectionHandler.GetByID)
			collectionGroup.POST("", collectionHandler.Create)
			collectionGroup.POST("/", collectionHandler.Create)
			collectionGroup.PUT("/:id", collectionHandler.Update)
			collectionGroup.DELETE("/:id", collectionHandler.Delete)
			collectionGroup.POST("/:id/add", collectionHandler.AddRecipe)
			collectionGroup.DELETE("/:id/:recipeId", collectionHandler.RemoveRecipe)
		}

		pumpGroup := api.Group("/pump")
		pumpGroup.Use(middleware.AuthMiddleware(jwtService))
		{
			pumpGroup.GET("", pumpHandler.GetAll)
			pumpGroup.GET("/", pumpHandler.GetAll)
			pumpGroup.GET("/jobmetrics/:id", pumpHandler.GetJobMetrics)
			pumpGroup.PUT("/start", middleware.RequireRole(models.RolePumpIngredientEditor), pumpHandler.Start)
			pumpGroup.PUT("/stop", middleware.RequireRole(models.RolePumpIngredientEditor), pumpHandler.Stop)

			pumpSettingsGroup := pumpGroup.Group("/settings")
			{
				pumpSettingsGroup.GET("/reversepumping", pumpHandler.GetReversePumpSettings)
				pumpSettingsGroup.PUT("/reversepumping", middleware.RequireRole(models.RoleAdmin), pumpHandler.SetReversePumpSettings)
				pumpSettingsGroup.GET("/loadcell", pumpHandler.GetLoadCell)
				pumpSettingsGroup.PUT("/loadcell", middleware.RequireRole(models.RoleAdmin), pumpHandler.SetLoadCell)
				pumpSettingsGroup.GET("/loadcell/read", pumpHandler.ReadLoadCell)
				pumpSettingsGroup.PUT("/loadcell/calibratezero", middleware.RequireRole(models.RoleAdmin), pumpHandler.CalibrateLoadCellZero)
				pumpSettingsGroup.PUT("/loadcell/calibratereference", middleware.RequireRole(models.RoleAdmin), pumpHandler.CalibrateLoadCellReference)
			}

			pumpGroup.GET("/:id", pumpHandler.GetByID)
			pumpGroup.POST("", middleware.RequireRole(models.RolePumpIngredientEditor), pumpHandler.Create)
			pumpGroup.POST("/", middleware.RequireRole(models.RolePumpIngredientEditor), pumpHandler.Create)
			pumpGroup.PATCH("/:id", middleware.RequireRole(models.RolePumpIngredientEditor), pumpHandler.Update)
			pumpGroup.PUT("/:id", middleware.RequireRole(models.RolePumpIngredientEditor), pumpHandler.Update)
			pumpGroup.DELETE("/:id", middleware.RequireRole(models.RolePumpIngredientEditor), pumpHandler.Delete)
			pumpGroup.PUT("/:id/pumpup", middleware.RequireRole(models.RolePumpIngredientEditor), pumpHandler.PumpUp)
			pumpGroup.PUT("/:id/pumpback", middleware.RequireRole(models.RolePumpIngredientEditor), pumpHandler.PumpBack)
			pumpGroup.PUT("/:id/runjob", middleware.RequireRole(models.RolePumpIngredientEditor), pumpHandler.RunJob)
		}

		cocktailGroup := api.Group("/cocktail")
		cocktailGroup.Use(middleware.AuthMiddleware(jwtService))
		{
			cocktailGroup.GET("/progress", cocktailHandler.GetProgress)
			cocktailGroup.POST("/continueproduction", cocktailHandler.ContinueProduction)
			cocktailGroup.DELETE("", cocktailHandler.CancelCocktail)
			cocktailGroup.DELETE("/", cocktailHandler.CancelCocktail)
			cocktailGroup.PUT("/:recipeId", cocktailHandler.OrderCocktail)
			cocktailGroup.PUT("/:recipeId/feasibility", cocktailHandler.CheckFeasibility)
		}

		systemGroup := api.Group("/system")
		systemGroup.Use(middleware.AuthMiddleware(jwtService))
		{
			systemGroup.GET("/version", systemHandler.GetVersion)
			systemGroup.GET("/settings/appearance", systemHandler.GetAppearance)
			systemGroup.PUT("/settings/appearance", middleware.RequireRole(models.RoleAdmin), systemHandler.SetAppearance)
			systemGroup.GET("/settings/appearance/language", systemHandler.GetLanguages)
			systemGroup.GET("/settings/global", systemHandler.GetGlobalSettings)
			systemGroup.PUT("/settings/donated", systemHandler.SetDonated)
			systemGroup.PUT("/settings/sawdonationdisclaimer", systemHandler.SetDonationDisclaimer)
			systemGroup.GET("/settings/i2c", middleware.RequireRole(models.RoleAdmin), systemHandler.GetI2CSettings)
			systemGroup.PUT("/settings/i2c", middleware.RequireRole(models.RoleAdmin), systemHandler.SetI2CSettings)
			systemGroup.GET("/settings/mqtt", middleware.RequireRole(models.RoleAdmin), systemHandler.GetMQTTSettings)
			systemGroup.PUT("/settings/mqtt", middleware.RequireRole(models.RoleAdmin), systemHandler.SetMQTTSettings)
			systemGroup.GET("/settings/mqtt/status", middleware.RequireRole(models.RoleAdmin), systemHandler.GetMQTTStatus)
			systemGroup.GET("/settings/defaultfilter", systemHandler.GetDefaultFilter)
			systemGroup.PUT("/settings/defaultfilter", middleware.RequireRole(models.RoleAdmin), systemHandler.SetDefaultFilter)
			systemGroup.GET("/settings/ordering", systemHandler.GetOrderingPolicy)
			systemGroup.PUT("/settings/ordering", middleware.RequireRole(models.RoleAdmin), systemHandler.SetOrderingPolicy)
			systemGroup.GET("/settings/login", systemHandler.GetLoginSettings)
			systemGroup.PUT("/settings/login", middleware.RequireRole(models.RoleAdmin), systemHandler.SetLoginSettings)
			systemGroup.PUT("/shutdown", middleware.RequireRole(models.RoleAdmin), systemHandler.Shutdown)
			systemGroup.GET("/settings/updater", middleware.RequireRole(models.RoleAdmin), updateHandler.GetSettings)
			systemGroup.PUT("/settings/updater", middleware.RequireRole(models.RoleAdmin), updateHandler.SetSettings)
			systemGroup.GET("/update/status", middleware.RequireRole(models.RoleAdmin), updateHandler.GetStatus)
			systemGroup.POST("/update/check", middleware.RequireRole(models.RoleAdmin), updateHandler.Check)
			systemGroup.POST("/update/install", middleware.RequireRole(models.RoleAdmin), updateHandler.Install)
		}

		gpioGroup := api.Group("/gpio")
		gpioGroup.Use(middleware.AuthMiddleware(jwtService))
		{
			gpioGroup.GET("", gpioHandler.GetBoards)
			gpioGroup.GET("/", gpioHandler.GetBoards)
			gpioGroup.POST("", middleware.RequireRole(models.RoleAdmin), gpioHandler.CreateBoard)
			gpioGroup.POST("/", middleware.RequireRole(models.RoleAdmin), gpioHandler.CreateBoard)
			gpioGroup.GET("/status", gpioHandler.GetStatus)
			gpioGroup.POST("/test", middleware.RequireRole(models.RoleAdmin), gpioHandler.TestPin)
			gpioGroup.POST("/pump", middleware.RequireRole(models.RoleAdmin), gpioHandler.RunPump)
			gpioGroup.GET("/pin/:pin", gpioHandler.GetPinValue)
			gpioGroup.DELETE("/pin/:pin", middleware.RequireRole(models.RoleAdmin), gpioHandler.ReleasePin)
			gpioGroup.GET("/:id", gpioHandler.GetBoardByID)
			gpioGroup.PUT("/:id", middleware.RequireRole(models.RoleAdmin), gpioHandler.UpdateBoard)
			gpioGroup.DELETE("/:id", middleware.RequireRole(models.RoleAdmin), gpioHandler.DeleteBoard)
			gpioGroup.GET("/:id/pin", gpioHandler.GetBoardPins)
		}

		eventGroup := api.Group("/eventaction")
		eventGroup.Use(middleware.AuthMiddleware(jwtService), middleware.RequireRole(models.RoleAdmin))
		{
			eventGroup.GET("", eventHandler.GetAll)
			eventGroup.GET("/", eventHandler.GetAll)
			eventGroup.GET("/executiongroup", eventHandler.GetExecutionGroups)
			eventGroup.POST("", eventHandler.Create)
			eventGroup.POST("/", eventHandler.Create)
			eventGroup.PUT("/:id", eventHandler.Update)
			eventGroup.DELETE("/:id", eventHandler.Delete)
			eventGroup.POST("/:id/start", eventHandler.Start)
			eventGroup.DELETE("/process/:processId", eventHandler.KillProcess)
		}

		statisticsGroup := api.Group("/statistics")
		statisticsGroup.Use(middleware.AuthMiddleware(jwtService))
		{
			statisticsGroup.GET("", statisticsHandler.GetOverview)
			statisticsGroup.GET("/", statisticsHandler.GetOverview)
			statisticsGroup.GET("/recipes", statisticsHandler.GetTopRecipes)
			statisticsGroup.GET("/ingredients", statisticsHandler.GetTopIngredients)
			statisticsGroup.GET("/orders", statisticsHandler.GetRecentOrders)
			statisticsGroup.DELETE("/orders", middleware.RequireRole(models.RoleAdmin), statisticsHandler.ClearOrderHistory)
		}

		api.GET("/ws", func(c *gin.Context) {
			websocket.ServeWs(wsHub, c.Writer, c.Request)
		})
	}

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"backend": "go",
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

	eventService.Dispatch(models.EventTriggerApplicationStartup, 0)
	return r, cleanup
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

	r.NoRoute(func(c *gin.Context) {
		path := c.Request.URL.Path

		if strings.HasPrefix(path, "/api/") {
			c.JSON(http.StatusNotFound, gin.H{"error": "API endpoint not found", "message": "API endpoint not found"})
			return
		}

		path = filepath.ToSlash(filepath.Clean(path))
		if path == "/" || path == "." {
			path = "index.html"
		} else {
			path = strings.TrimPrefix(path, "/")
		}

		file, err := distFS.Open(path)
		if err != nil {
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

		stat, err := file.(fs.File).Stat()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read file"})
			return
		}

		if strings.HasPrefix(path, "assets/") {
			c.Header("Cache-Control", "public, max-age=31536000, immutable")
		} else {
			c.Header("Cache-Control", "no-cache")
		}

		contentType := getContentType(path)
		c.DataFromReader(http.StatusOK, stat.Size(), contentType, file, nil)
	})
}

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
	case ".avif":
		return "image/avif"
	case ".webmanifest":
		return "application/manifest+json"
	default:
		return "application/octet-stream"
	}
}
