package models

import "time"

type Role string

const (
	RoleUser  Role = "ROLE_USER"
	RoleAdmin Role = "ROLE_ADMIN"
)

func (r Role) Level() int {
	switch r {
	case RoleAdmin:
		return 2
	case RoleUser:
		return 1
	default:
		return 0
	}
}

type User struct {
	ID                 int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	Username           string    `gorm:"unique;not null" json:"username"`
	Password           string    `gorm:"not null" json:"-"`
	Role               Role      `gorm:"not null" json:"role"`
	IsAccountNonLocked bool      `gorm:"not null;default:true" json:"isAccountNonLocked"`
	CreatedAt          time.Time `gorm:"autoCreateTime:nano" json:"createdAt"`
	UpdatedAt          time.Time `gorm:"autoUpdateTime:nano" json:"updatedAt"`
}

func (User) TableName() string {
	return "users"
}

func (u *User) HasRole(role Role) bool {
	return u.Role.Level() >= role.Level()
}
