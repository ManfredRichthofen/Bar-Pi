package service

import (
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/config"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/models"
)

// SystemService handles system-level operations
type SystemService struct {
	cfg                   *config.Config
	appearanceSettings    models.AppearanceSettings
	globalSettings        models.GlobalSettings
	i2cSettings           models.I2CSettings
	defaultFilterSettings models.DefaultFilterSettings
}

// NewSystemService creates a new system service
func NewSystemService(cfg *config.Config) *SystemService {
	return &SystemService{
		cfg: cfg,
		appearanceSettings: models.AppearanceSettings{
			RecipePageSize: 20,
			Language:       "en",
			Theme:          "light",
		},
		globalSettings: models.GlobalSettings{
			AppName:            cfg.App.Name,
			AppVersion:         cfg.App.Version,
			DisableDonation:    cfg.App.DisableDonation,
			HideProjectLinks:   cfg.App.HideProjectLinks,
			DisableUpdater:     cfg.App.DisableUpdater,
			DonationDisclaimer: false,
			Donated:            false,
		},
		i2cSettings: models.I2CSettings{
			Enabled: false,
			BusID:   1,
		},
		defaultFilterSettings: models.DefaultFilterSettings{
			ShowOnlyFabricable: false,
			ShowOnlyOwned:      false,
			Categories:         []int64{},
		},
	}
}

// GetAppearanceSettings returns appearance settings
func (s *SystemService) GetAppearanceSettings() models.AppearanceSettings {
	return s.appearanceSettings
}

// SetAppearanceSettings updates appearance settings
func (s *SystemService) SetAppearanceSettings(settings models.AppearanceSettings) {
	if settings.RecipePageSize > 0 {
		s.appearanceSettings.RecipePageSize = settings.RecipePageSize
	}
	if settings.Language != "" {
		s.appearanceSettings.Language = settings.Language
	}
	if settings.Theme != "" {
		s.appearanceSettings.Theme = settings.Theme
	}
}

// GetGlobalSettings returns global settings
func (s *SystemService) GetGlobalSettings() models.GlobalSettings {
	return s.globalSettings
}

// SetDonated sets the donated flag
func (s *SystemService) SetDonated(donated bool) {
	s.globalSettings.Donated = donated
}

// SetDonationDisclaimer sets the donation disclaimer flag
func (s *SystemService) SetDonationDisclaimer() {
	s.globalSettings.DonationDisclaimer = true
}

// GetI2CSettings returns I2C settings
func (s *SystemService) GetI2CSettings() models.I2CSettings {
	return s.i2cSettings
}

// SetI2CSettings updates I2C settings
func (s *SystemService) SetI2CSettings(settings models.I2CSettings) {
	s.i2cSettings = settings
}

// GetDefaultFilterSettings returns default filter settings
func (s *SystemService) GetDefaultFilterSettings() models.DefaultFilterSettings {
	return s.defaultFilterSettings
}

// SetDefaultFilterSettings updates default filter settings
func (s *SystemService) SetDefaultFilterSettings(settings models.DefaultFilterSettings) {
	s.defaultFilterSettings = settings
}

// GetAvailableLanguages returns available languages
func (s *SystemService) GetAvailableLanguages() []string {
	return []string{"en", "de", "es", "fr", "it"}
}
