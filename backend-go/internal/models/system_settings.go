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
	Backend             string `json:"backend"`
	AppName             string `json:"appName"`
	AppVersion          string `json:"appVersion"`
	DisableDonation     bool   `json:"disableDonation"`
	HideProjectLinks    bool   `json:"hideProjectLinks"`
	DisableUpdater      bool   `json:"disableUpdater"`
	DonationDisclaimer  bool   `json:"donationDisclaimer"`
	Donated             bool   `json:"donated"`
	AllowReversePumping bool   `json:"allowReversePumping"`
}

// I2CSettings represents I2C configuration
type I2CSettings struct {
	Enabled bool    `json:"enabled"`
	Enable  bool    `json:"enable"`
	BusID   int     `json:"busId"`
	SdaPin  *PinDto `json:"sdaPin,omitempty"`
	SclPin  *PinDto `json:"sclPin,omitempty"`
}

// MQTTSettings configures the Home Assistant / MQTT connector.
// Password is stored but never returned by the API.
type MQTTSettings struct {
	Enabled         bool   `json:"enabled"`
	BrokerURL       string `json:"brokerUrl"`
	Username        string `json:"username"`
	Password        string `json:"password"`
	BaseTopic       string `json:"baseTopic"`
	DiscoveryPrefix string `json:"discoveryPrefix"`
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

// UpdaterSettings represents the automatic update configuration
type UpdaterSettings struct {
	AutoCheck         bool `json:"autoCheck"`
	AutoInstall       bool `json:"autoInstall"`
	IncludePrerelease bool `json:"includePrerelease"`
	WindowEnabled     bool `json:"windowEnabled"`
	WindowStartHour   int  `json:"windowStartHour"` // 0-23 local time
	WindowEndHour     int  `json:"windowEndHour"`
}

// OrderingPolicySettings controls PIN re-auth and related ordering rules
type OrderingPolicySettings struct {
	RequirePinAfterDrink bool `json:"requirePinAfterDrink"`
}

// LoginSettings controls which sign-in methods the login screen offers
type LoginSettings struct {
	PinLoginEnabled bool `json:"pinLoginEnabled"`
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
