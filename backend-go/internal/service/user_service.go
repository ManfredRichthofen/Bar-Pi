package service

import (
	"errors"
	"fmt"
	"regexp"
	"time"

	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/models"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/repository"
	"golang.org/x/crypto/bcrypt"
)

var pinPattern = regexp.MustCompile(`^\d{4,8}$`)

type UserService struct {
	repo *repository.UserRepository
}

func NewUserService(repo *repository.UserRepository) *UserService {
	return &UserService{repo: repo}
}

type UserPinOptions struct {
	Pin               string
	ClearPin          bool
	MaxDrinksPerDay   *int
	UpdateMaxDrinks   bool
}

func (s *UserService) Create(username, password string, role models.Role) (*models.User, error) {
	return s.CreateWithOptions(username, password, role, true, UserPinOptions{})
}

func (s *UserService) CreateWithLockState(username, password string, role models.Role, isAccountNonLocked bool) (*models.User, error) {
	return s.CreateWithOptions(username, password, role, isAccountNonLocked, UserPinOptions{})
}

func (s *UserService) CreateWithOptions(username, password string, role models.Role, isAccountNonLocked bool, opts UserPinOptions) (*models.User, error) {
	if username == "" {
		return nil, errors.New("username is required")
	}
	if password == "" {
		return nil, errors.New("password is required")
	}

	existing, err := s.repo.FindByUsername(username)
	if err != nil {
		return nil, fmt.Errorf("failed to check existing user: %w", err)
	}
	if existing != nil {
		return nil, errors.New("username already exists")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	user := &models.User{
		Username:           username,
		Password:           string(hashedPassword),
		Role:               role,
		IsAccountNonLocked: isAccountNonLocked,
		MaxDrinksPerDay:    0,
	}

	if opts.UpdateMaxDrinks && opts.MaxDrinksPerDay != nil {
		if *opts.MaxDrinksPerDay < 0 {
			return nil, errors.New("max drinks per day cannot be negative")
		}
		user.MaxDrinksPerDay = *opts.MaxDrinksPerDay
	}

	if opts.Pin != "" {
		pinHash, err := s.hashAndValidateUniquePin(opts.Pin, 0)
		if err != nil {
			return nil, err
		}
		user.PinHash = &pinHash
	}

	if err := s.repo.Create(user); err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	return user, nil
}

func (s *UserService) Authenticate(username, password string) (*models.User, error) {
	user, err := s.repo.FindByUsername(username)
	if err != nil {
		return nil, fmt.Errorf("failed to find user: %w", err)
	}
	if user == nil {
		return nil, errors.New("invalid credentials")
	}

	if !user.IsAccountNonLocked {
		return nil, errors.New("account is locked")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return nil, errors.New("invalid credentials")
	}

	return user, nil
}

func (s *UserService) AuthenticateByPin(pin string) (*models.User, error) {
	if !pinPattern.MatchString(pin) {
		return nil, errors.New("invalid credentials")
	}

	users, err := s.repo.FindUsersWithPin()
	if err != nil {
		return nil, fmt.Errorf("failed to find users: %w", err)
	}

	for i := range users {
		user := &users[i]
		if !user.HasPin() {
			continue
		}
		if err := bcrypt.CompareHashAndPassword([]byte(*user.PinHash), []byte(pin)); err == nil {
			if !user.IsAccountNonLocked {
				return nil, errors.New("account is locked")
			}
			return user, nil
		}
	}

	return nil, errors.New("invalid credentials")
}

func (s *UserService) GetByID(id int64) (*models.User, error) {
	return s.repo.FindByID(id)
}

func (s *UserService) GetAll() ([]models.User, error) {
	return s.repo.FindAll()
}

func (s *UserService) Update(user *models.User) error {
	return s.repo.Update(user)
}

func (s *UserService) UpdateUserFull(id int64, username string, role models.Role, isAccountNonLocked bool, updatePassword bool, newPassword string) (*models.User, error) {
	return s.UpdateUserFullWithOptions(id, username, role, isAccountNonLocked, updatePassword, newPassword, UserPinOptions{})
}

func (s *UserService) UpdateUserFullWithOptions(id int64, username string, role models.Role, isAccountNonLocked bool, updatePassword bool, newPassword string, opts UserPinOptions) (*models.User, error) {
	user, err := s.repo.FindByID(id)
	if err != nil {
		return nil, fmt.Errorf("failed to find user: %w", err)
	}
	if user == nil {
		return nil, errors.New("user not found")
	}

	if username != "" && username != user.Username {
		existing, err := s.repo.FindByUsername(username)
		if err != nil {
			return nil, fmt.Errorf("failed to check username: %w", err)
		}
		if existing != nil && existing.ID != id {
			return nil, errors.New("username already exists")
		}
		user.Username = username
	}

	user.Role = role
	user.IsAccountNonLocked = isAccountNonLocked

	if updatePassword && newPassword != "" && newPassword != "dummy_password_for_update" {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
		if err != nil {
			return nil, fmt.Errorf("failed to hash password: %w", err)
		}
		user.Password = string(hashedPassword)
	}

	if opts.ClearPin {
		user.PinHash = nil
	} else if opts.Pin != "" {
		pinHash, err := s.hashAndValidateUniquePin(opts.Pin, id)
		if err != nil {
			return nil, err
		}
		user.PinHash = &pinHash
	}

	if opts.UpdateMaxDrinks && opts.MaxDrinksPerDay != nil {
		if *opts.MaxDrinksPerDay < 0 {
			return nil, errors.New("max drinks per day cannot be negative")
		}
		user.MaxDrinksPerDay = *opts.MaxDrinksPerDay
	}

	if err := s.repo.Update(user); err != nil {
		return nil, fmt.Errorf("failed to update user: %w", err)
	}
	return user, nil
}

func (s *UserService) UpdatePassword(userID int64, newPassword string) error {
	user, err := s.repo.FindByID(userID)
	if err != nil {
		return fmt.Errorf("failed to find user: %w", err)
	}
	if user == nil {
		return errors.New("user not found")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	user.Password = string(hashedPassword)
	return s.repo.Update(user)
}

func (s *UserService) Delete(id int64) error {
	user, err := s.repo.FindByID(id)
	if err != nil {
		return err
	}
	if user == nil {
		return errors.New("user not found")
	}
	return s.repo.Delete(id)
}

func (s *UserService) CountCompletedOrdersToday(userID int64) (int64, error) {
	now := time.Now()
	dayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	return s.repo.CountCompletedOrdersToday(userID, dayStart)
}

func (s *UserService) EnsureDefaultAdmin() error {
	count, err := s.repo.Count()
	if err != nil {
		return fmt.Errorf("failed to count users: %w", err)
	}

	if count == 0 {
		fmt.Println("No users found, creating default admin user (username: admin, password: admin)")
		_, err := s.Create("admin", "admin", models.RoleSuperAdmin)
		if err != nil {
			return fmt.Errorf("failed to create default admin: %w", err)
		}
		fmt.Println("Default admin user created successfully")
	} else {
		fmt.Printf("Found %d existing user(s), skipping default admin creation\n", count)
	}

	return nil
}

func (s *UserService) hashAndValidateUniquePin(pin string, excludeUserID int64) (string, error) {
	if !pinPattern.MatchString(pin) {
		return "", errors.New("PIN must be 4 to 8 digits")
	}

	users, err := s.repo.FindUsersWithPin()
	if err != nil {
		return "", fmt.Errorf("failed to check PIN uniqueness: %w", err)
	}
	for i := range users {
		user := &users[i]
		if user.ID == excludeUserID || !user.HasPin() {
			continue
		}
		if err := bcrypt.CompareHashAndPassword([]byte(*user.PinHash), []byte(pin)); err == nil {
			return "", errors.New("PIN is already in use")
		}
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(pin), bcrypt.DefaultCost)
	if err != nil {
		return "", fmt.Errorf("failed to hash PIN: %w", err)
	}
	return string(hashed), nil
}
