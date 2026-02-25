package models

// AppearanceSettings represents appearance configuration
type AppearanceSettings struct {
	RecipePageSize int    `json:"recipePageSize"`
	Language       string `json:"language"`
	Theme          string `json:"theme"`
}

// GlobalSettings represents global system settings
type GlobalSettings struct {
	AppName              string `json:"appName"`
	AppVersion           string `json:"appVersion"`
	DisableDonation      bool   `json:"disableDonation"`
	HideProjectLinks     bool   `json:"hideProjectLinks"`
	DisableUpdater       bool   `json:"disableUpdater"`
	DonationDisclaimer   bool   `json:"donationDisclaimer"`
	Donated              bool   `json:"donated"`
}

// I2CSettings represents I2C configuration
type I2CSettings struct {
	Enabled bool `json:"enabled"`
	BusID   int  `json:"busId"`
}

// DefaultFilterSettings represents default filter preferences
type DefaultFilterSettings struct {
	ShowOnlyFabricable bool     `json:"showOnlyFabricable"`
	ShowOnlyOwned      bool     `json:"showOnlyOwned"`
	Categories         []int64  `json:"categories"`
}
