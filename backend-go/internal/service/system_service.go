package service

import (
	"encoding/json"
	"sync"

	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/config"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/models"
	"gorm.io/gorm"
)

// SystemService handles system-level operations and persists settings in SQLite
type SystemService struct {
	cfg                   *config.Config
	db                    *gorm.DB
	mu                    sync.RWMutex
	appearanceSettings    models.AppearanceSettings
	globalSettings        models.GlobalSettings
	i2cSettings           models.I2CSettings
	defaultFilterSettings models.DefaultFilterSettings
	reversePumpSettings   models.ReversePumpSettings
	loadCellSettings      *models.LoadCellSettings
}

// NewSystemService creates a new system service
func NewSystemService(cfg *config.Config, db ...*gorm.DB) *SystemService {
	var database *gorm.DB
	if len(db) > 0 {
		database = db[0]
	}

	s := &SystemService{
		cfg: cfg,
		db:  database,
		appearanceSettings: models.AppearanceSettings{
			RecipePageSize: 20,
			Language:       "en",
			Theme:          "light",
		},
		globalSettings: models.GlobalSettings{
			AppName:             cfg.App.Name,
			AppVersion:          cfg.App.Version,
			DisableDonation:     cfg.App.DisableDonation,
			HideProjectLinks:    cfg.App.HideProjectLinks,
			DisableUpdater:      cfg.App.DisableUpdater,
			DonationDisclaimer:  false,
			Donated:             false,
			AllowReversePumping: false,
		},
		i2cSettings: models.I2CSettings{
			Enabled: false,
			Enable:  false,
			BusID:   1,
		},
		defaultFilterSettings: models.DefaultFilterSettings{
			Enable:             false,
			ShowOnlyFabricable: false,
			ShowOnlyOwned:      false,
			Categories:         []int64{},
		},
		reversePumpSettings: models.ReversePumpSettings{
			Enable: false,
		},
		loadCellSettings: nil,
	}

	s.loadFromDB()
	return s
}

func (s *SystemService) loadFromDB() {
	if s.db == nil {
		return
	}
	s.loadJSON("appearance", &s.appearanceSettings)
	s.loadJSON("i2c", &s.i2cSettings)
	s.loadJSON("default_filter", &s.defaultFilterSettings)
	s.loadJSON("reverse_pump", &s.reversePumpSettings)

	var lc models.LoadCellSettings
	if s.loadJSON("load_cell", &lc) && lc.Enable {
		s.loadCellSettings = &lc
	}

	var globalPersisted struct {
		Donated            bool `json:"donated"`
		DonationDisclaimer bool `json:"donationDisclaimer"`
	}
	if s.loadJSON("global_flags", &globalPersisted) {
		s.globalSettings.Donated = globalPersisted.Donated
		s.globalSettings.DonationDisclaimer = globalPersisted.DonationDisclaimer
	}
	s.globalSettings.AllowReversePumping = s.reversePumpSettings.Enable
}

func (s *SystemService) loadJSON(key string, target any) bool {
	if s.db == nil {
		return false
	}
	var kv models.SystemSettingKV
	if err := s.db.Where("key = ?", key).First(&kv).Error; err != nil {
		return false
	}
	return json.Unmarshal([]byte(kv.Value), target) == nil
}

func (s *SystemService) saveJSON(key string, val any) {
	if s.db == nil {
		return
	}
	data, err := json.Marshal(val)
	if err != nil {
		return
	}
	kv := models.SystemSettingKV{
		Key:   key,
		Value: string(data),
	}
	_ = s.db.Save(&kv).Error
}

// GetAppearanceSettings returns appearance settings
func (s *SystemService) GetAppearanceSettings() models.AppearanceSettings {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.appearanceSettings
}

// SetAppearanceSettings updates appearance settings
func (s *SystemService) SetAppearanceSettings(settings models.AppearanceSettings) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if settings.RecipePageSize > 0 {
		s.appearanceSettings.RecipePageSize = settings.RecipePageSize
	}
	if settings.Language != "" {
		s.appearanceSettings.Language = settings.Language
	}
	if settings.Theme != "" {
		s.appearanceSettings.Theme = settings.Theme
	}
	s.saveJSON("appearance", s.appearanceSettings)
}

// GetGlobalSettings returns global settings
func (s *SystemService) GetGlobalSettings() models.GlobalSettings {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.globalSettings
}

// SetDonated sets the donated flag
func (s *SystemService) SetDonated(donated bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.globalSettings.Donated = donated
	s.saveJSON("global_flags", map[string]bool{
		"donated":            s.globalSettings.Donated,
		"donationDisclaimer": s.globalSettings.DonationDisclaimer,
	})
}

// SetDonationDisclaimer sets the donation disclaimer flag
func (s *SystemService) SetDonationDisclaimer() {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.globalSettings.DonationDisclaimer = true
	s.saveJSON("global_flags", map[string]bool{
		"donated":            s.globalSettings.Donated,
		"donationDisclaimer": s.globalSettings.DonationDisclaimer,
	})
}

// GetI2CSettings returns I2C settings
func (s *SystemService) GetI2CSettings() models.I2CSettings {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.i2cSettings
}

// SetI2CSettings updates I2C settings
func (s *SystemService) SetI2CSettings(settings models.I2CSettings) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if settings.Enable && !settings.Enabled {
		settings.Enabled = true
	} else if settings.Enabled && !settings.Enable {
		settings.Enable = true
	}
	s.i2cSettings = settings
	s.saveJSON("i2c", s.i2cSettings)
}

// GetDefaultFilterSettings returns default filter settings
func (s *SystemService) GetDefaultFilterSettings() models.DefaultFilterSettings {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.defaultFilterSettings
}

// SetDefaultFilterSettings updates default filter settings
func (s *SystemService) SetDefaultFilterSettings(settings models.DefaultFilterSettings) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if settings.Categories == nil {
		settings.Categories = []int64{}
	}
	s.defaultFilterSettings = settings
	s.saveJSON("default_filter", s.defaultFilterSettings)
}

// GetReversePumpSettings returns reverse pump settings
func (s *SystemService) GetReversePumpSettings() models.ReversePumpSettings {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.reversePumpSettings
}

// SetReversePumpSettings updates reverse pump settings
func (s *SystemService) SetReversePumpSettings(settings models.ReversePumpSettings) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if !settings.Enable {
		settings.Settings = nil
	}
	s.reversePumpSettings = settings
	s.globalSettings.AllowReversePumping = settings.Enable
	s.saveJSON("reverse_pump", s.reversePumpSettings)
}

// GetLoadCellSettings returns load cell settings
func (s *SystemService) GetLoadCellSettings() *models.LoadCellSettings {
	s.mu.RLock()
	defer s.mu.RUnlock()
	if s.loadCellSettings == nil {
		return nil
	}
	cp := *s.loadCellSettings
	return &cp
}

// SetLoadCellSettings updates load cell settings
func (s *SystemService) SetLoadCellSettings(settings *models.LoadCellSettings) *models.LoadCellSettings {
	s.mu.Lock()
	defer s.mu.Unlock()
	if settings == nil || (settings.ClkPin == nil && settings.DtPin == nil && !settings.Enable) {
		s.loadCellSettings = nil
		s.saveJSON("load_cell", models.LoadCellSettings{Enable: false})
		return nil
	}
	settings.Enable = true
	s.loadCellSettings = settings
	s.saveJSON("load_cell", s.loadCellSettings)
	cp := *s.loadCellSettings
	return &cp
}

func (s *SystemService) CalibrateLoadCellZero() *models.LoadCellSettings {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.loadCellSettings == nil {
		s.loadCellSettings = &models.LoadCellSettings{Enable: true}
	}
	s.loadCellSettings.ZeroOffset = 0
	s.saveJSON("load_cell", s.loadCellSettings)
	cp := *s.loadCellSettings
	return &cp
}

func (s *SystemService) CalibrateLoadCellRef(weight float64) *models.LoadCellSettings {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.loadCellSettings == nil {
		s.loadCellSettings = &models.LoadCellSettings{Enable: true}
	}
	s.loadCellSettings.ReferenceWeight = weight
	s.loadCellSettings.Calibrated = true
	s.saveJSON("load_cell", s.loadCellSettings)
	cp := *s.loadCellSettings
	return &cp
}

// GetAvailableLanguages returns available languages
func (s *SystemService) GetAvailableLanguages() []string {
	return []string{"en", "de", "es", "fr", "it"}
}
