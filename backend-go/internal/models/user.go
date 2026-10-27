package models

import (
	"encoding/json"
	"time"
)

type Role string

const (
	RoleUser                 Role = "ROLE_USER"
	RoleRecipeCreator        Role = "ROLE_RECIPE_CREATOR"
	RolePumpIngredientEditor Role = "ROLE_PUMP_INGREDIENT_EDITOR"
	RoleAdmin                Role = "ROLE_ADMIN"
	RoleSuperAdmin           Role = "ROLE_SUPER_ADMIN"
)

func (r Role) Level() int {
	switch r {
	case RoleSuperAdmin:
		return 4
	case RoleAdmin:
		return 3
	case RolePumpIngredientEditor:
		return 2
	case RoleRecipeCreator:
		return 1
	case RoleUser:
		return 0
	default:
		return 0
	}
}

func RoleFromAdminLevel(level int) Role {
	switch level {
	case 4:
		return RoleSuperAdmin
	case 3:
		return RoleAdmin
	case 2:
		return RolePumpIngredientEditor
	case 1:
		return RoleRecipeCreator
	default:
		return RoleUser
	}
}

func ParseRole(roleStr string, adminLevel *int) Role {
	if adminLevel != nil {
		return RoleFromAdminLevel(*adminLevel)
	}
	switch roleStr {
	case "ROLE_SUPER_ADMIN", "super-admin":
		return RoleSuperAdmin
	case "ROLE_ADMIN", "admin":
		return RoleAdmin
	case "ROLE_PUMP_INGREDIENT_EDITOR", "pump-ingredient-editor":
		return RolePumpIngredientEditor
	case "ROLE_RECIPE_CREATOR", "recipe-creator":
		return RoleRecipeCreator
	case "ROLE_USER", "user":
		return RoleUser
	default:
		return RoleUser
	}
}

type User struct {
	ID                 int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	Username           string    `gorm:"unique;not null" json:"username"`
	Password           string    `gorm:"not null" json:"-"`
	PinHash            *string   `gorm:"column:pin_hash" json:"-"`
	MaxDrinksPerDay    int       `gorm:"not null;default:0" json:"maxDrinksPerDay"`
	Role               Role      `gorm:"not null" json:"role"`
	IsAccountNonLocked bool      `gorm:"not null;default:true" json:"isAccountNonLocked"`
	CreatedAt          time.Time `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt          time.Time `gorm:"autoUpdateTime" json:"updatedAt"`
}

func (u *User) HasPin() bool {
	return u.PinHash != nil && *u.PinHash != ""
}

func (User) TableName() string {
	return "users"
}

func (u *User) HasRole(role Role) bool {
	return u.Role.Level() >= role.Level()
}

func (u User) MarshalJSON() ([]byte, error) {
	type Alias User
	return json.Marshal(&struct {
		Alias
		AdminLevel       int  `json:"adminLevel"`
		AccountNonLocked bool `json:"accountNonLocked"`
		HasPin           bool `json:"hasPin"`
	}{
		Alias:            (Alias)(u),
		AdminLevel:       u.Role.Level(),
		AccountNonLocked: u.IsAccountNonLocked,
		HasPin:           u.HasPin(),
	})
}
