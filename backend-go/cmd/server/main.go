package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/config"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/database"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/process"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/router"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/version"
)

func main() {
	if len(os.Args) > 1 && (os.Args[1] == "--version" || os.Args[1] == "-v") {
		fmt.Println(version.Version)
		return
	}

	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	db, err := database.Initialize(cfg)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	restart := make(chan struct{}, 1)
	r, cleanup := router.SetupWithOptions(cfg, db, router.Options{
		OnRestart: func() {
			select {
			case restart <- struct{}{}:
			default:
			}
		},
	})

	srv := &http.Server{
		Addr:         fmt.Sprintf(":%d", cfg.Server.Port),
		Handler:      r,
		ReadTimeout:  cfg.Server.ReadTimeout,
		WriteTimeout: cfg.Server.WriteTimeout,
		IdleTimeout:  cfg.Server.IdleTimeout,
	}

	go func() {
		log.Printf("Starting server %s on port %d", version.Version, cfg.Server.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	restarting := false
	select {
	case <-quit:
	case <-restart:
		restarting = true
	}

	log.Println("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("Server forced to shutdown: %v", err)
	}

	if cleanup != nil {
		cleanup()
	}

	if sqlDB, err := db.DB(); err == nil && sqlDB != nil {
		_ = sqlDB.Close()
	}

	if restarting {
		log.Println("Restarting into updated binary...")
		if err := process.Reexec(); err != nil {
			// Exit non-zero so a supervisor (systemd Restart=always) starts the new binary
			log.Printf("Re-exec failed: %v", err)
			os.Exit(1)
		}
	}

	log.Println("Server exited")
}
