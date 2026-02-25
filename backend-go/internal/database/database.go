package database

import (
	"fmt"
	"log"
	"time"

	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/config"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	_ "modernc.org/sqlite"
)

func Initialize(cfg *config.Config) (*gorm.DB, error) {
	// Use Dialector with DriverName to force pure Go SQLite (modernc.org/sqlite)
	dialector := sqlite.Dialector{
		DriverName: "sqlite",
		DSN:        cfg.Database.Path + "?_foreign_keys=on&_busy_timeout=10000&_journal_mode=wal&_time_format=sqlite",
	}

	db, err := gorm.Open(dialector, &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
		NowFunc: func() time.Time {
			return time.Now().UTC()
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get database instance: %w", err)
	}

	sqlDB.SetMaxOpenConns(cfg.Database.MaxOpenConns)
	sqlDB.SetMaxIdleConns(cfg.Database.MaxIdleConns)
	sqlDB.SetConnMaxLifetime(cfg.Database.ConnMaxLifetime)

	if err := runMigrations(sqlDB); err != nil {
		return nil, fmt.Errorf("failed to run migrations: %w", err)
	}

	log.Println("Database initialized successfully")
	return db, nil
}
