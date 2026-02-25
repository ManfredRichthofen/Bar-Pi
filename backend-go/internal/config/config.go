package config

import (
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	JWT      JWTConfig
	App      AppConfig
}

type ServerConfig struct {
	Port         int
	ReadTimeout  time.Duration
	WriteTimeout time.Duration
	IdleTimeout  time.Duration
}

type DatabaseConfig struct {
	Path            string
	MaxOpenConns    int
	MaxIdleConns    int
	ConnMaxLifetime time.Duration
}

type JWTConfig struct {
	Secret         string
	ExpirationTime time.Duration
}

type AppConfig struct {
	Name            string
	Version         string
	DisableDonation bool
	HideProjectLinks bool
	DisableUpdater  bool
}

func Load() (*Config, error) {
	_ = godotenv.Load()

	cfg := &Config{
		Server: ServerConfig{
			Port:         getEnvAsInt("SERVER_PORT", 8080),
			ReadTimeout:  getEnvAsDuration("SERVER_READ_TIMEOUT", 15*time.Second),
			WriteTimeout: getEnvAsDuration("SERVER_WRITE_TIMEOUT", 15*time.Second),
			IdleTimeout:  getEnvAsDuration("SERVER_IDLE_TIMEOUT", 60*time.Second),
		},
		Database: DatabaseConfig{
			Path:            getEnv("DATABASE_PATH", "cocktailpi-data.db"),
			MaxOpenConns:    getEnvAsInt("DATABASE_MAX_OPEN_CONNS", 1),
			MaxIdleConns:    getEnvAsInt("DATABASE_MAX_IDLE_CONNS", 1),
			ConnMaxLifetime: getEnvAsDuration("DATABASE_CONN_MAX_LIFETIME", 0),
		},
		JWT: JWTConfig{
			Secret:         getEnv("JWT_SECRET", generateDefaultSecret()),
			ExpirationTime: getEnvAsDuration("JWT_EXPIRATION", 24*time.Hour),
		},
		App: AppConfig{
			Name:            getEnv("APP_NAME", "CocktailPi"),
			Version:         getEnv("APP_VERSION", "2.0.0"),
			DisableDonation: getEnvAsBool("APP_DISABLE_DONATION", false),
			HideProjectLinks: getEnvAsBool("APP_HIDE_PROJECT_LINKS", false),
			DisableUpdater:  getEnvAsBool("APP_DISABLE_UPDATER", false),
		},
	}

	if err := cfg.validate(); err != nil {
		return nil, err
	}

	return cfg, nil
}

func (c *Config) validate() error {
	if c.Server.Port < 1 || c.Server.Port > 65535 {
		return fmt.Errorf("invalid server port: %d", c.Server.Port)
	}
	if c.JWT.Secret == "" {
		return fmt.Errorf("JWT secret cannot be empty")
	}
	return nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	valueStr := os.Getenv(key)
	if value, err := strconv.Atoi(valueStr); err == nil {
		return value
	}
	return defaultValue
}

func getEnvAsBool(key string, defaultValue bool) bool {
	valueStr := os.Getenv(key)
	if value, err := strconv.ParseBool(valueStr); err == nil {
		return value
	}
	return defaultValue
}

func getEnvAsDuration(key string, defaultValue time.Duration) time.Duration {
	valueStr := os.Getenv(key)
	if value, err := time.ParseDuration(valueStr); err == nil {
		return value
	}
	return defaultValue
}

func generateDefaultSecret() string {
	return "change-me-in-production-please-use-a-secure-random-string"
}
