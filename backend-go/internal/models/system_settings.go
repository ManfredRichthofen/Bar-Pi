package models

// SystemSettingKV represents a persistent key-value setting in SQLite
type SystemSettingKV struct {
	Key   string `gorm:"primaryKey;column:key" json:"key"`
	Value string `gorm:"column:value;not null" json:"value"`
}

func (SystemSettingKV) TableName() string {
	return "system_settings"
}

// AppearanceSettings represents appearance configuration
type AppearanceSettings struct {
	RecipePageSize int    `json:"recipePageSize"`
	Language       string `json:"language"`
	Theme          string `json:"theme"`
}

// GlobalSettings represents global system settings
type GlobalSettings struct {
	AppName            string `json:"appName"`
	AppVersion         string `json:"appVersion"`
	DisableDonation    bool   `json:"disableDonation"`
	HideProjectLinks   bool   `json:"hideProjectLinks"`
	DisableUpdater     bool   `json:"disableUpdater"`
	DonationDisclaimer bool   `json:"donationDisclaimer"`
	Donated            bool   `json:"donated"`
	AllowReversePumping bool  `json:"allowReversePumping"`
}

// I2CSettings represents I2C configuration
type I2CSettings struct {
	Enabled bool    `json:"enabled"`
	Enable  bool    `json:"enable"`
	BusID   int     `json:"busId"`
	SdaPin  *PinDto `json:"sdaPin,omitempty"`
	SclPin  *PinDto `json:"sclPin,omitempty"`
}

// DefaultFilterSettings represents default filter preferences
type DefaultFilterSettings struct {
	Enable             bool    `json:"enable"`
	ShowOnlyFabricable bool    `json:"showOnlyFabricable"`
	ShowOnlyOwned      bool    `json:"showOnlyOwned"`
	Categories         []int64 `json:"categories"`
}

// ReversePumpSettingsInner represents inner details of reverse pumping
type ReversePumpSettingsInner struct {
	DirectorPin       *PinDto `json:"directorPin"`
	Overshoot         int     `json:"overshoot"`
	AutoPumpBackTimer int     `json:"autoPumpBackTimer"`
	ForwardStateHigh  bool    `json:"forwardStateHigh"`
}

// ReversePumpSettings represents reverse pumping settings
type ReversePumpSettings struct {
	Enable   bool                      `json:"enable"`
	Settings *ReversePumpSettingsInner `json:"settings,omitempty"`
}

// LoadCellSettings represents load cell settings
type LoadCellSettings struct {
	Enable                 bool    `json:"enable"`
	ClkPin                 *PinDto `json:"clkPin,omitempty"`
	DtPin                  *PinDto `json:"dtPin,omitempty"`
	Calibrated             bool    `json:"calibrated"`
	DispensingAreaLv       bool    `json:"dispensingAreaLv"`
	MatchGlass             bool    `json:"matchGlass"`
	ReferenceWeight        float64 `json:"referenceWeight,omitempty"`
	ZeroOffset             float64 `json:"zeroOffset,omitempty"`
}
