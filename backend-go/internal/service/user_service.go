package service

import (
	"errors"
	"fmt"

	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/models"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/repository"
	"golang.org/x/crypto/bcrypt"
)

type UserService struct {
	repo *repository.UserRepository
}

func NewUserService(repo *repository.UserRepository) *UserService {
	return &UserService{repo: repo}
}

func (s *UserService) Create(username, password string, role models.Role) (*models.User, error) {
	return s.CreateWithLockState(username, password, role, true)
}

func (s *UserService) CreateWithLockState(username, password string, role models.Role, isAccountNonLocked bool) (*models.User, error) {
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

func (s *UserService) GetByID(id int64) (*models.User, error) {
	return s.repo.FindByID(id)
}

func (s *UserService) GetByUsername(username string) (*models.User, error) {
	return s.repo.FindByUsername(username)
}

func (s *UserService) GetAll() ([]models.User, error) {
	return s.repo.FindAll()
}

func (s *UserService) Update(user *models.User) error {
	return s.repo.Update(user)
}

func (s *UserService) UpdateUserFull(id int64, username string, role models.Role, isAccountNonLocked bool, updatePassword bool, newPassword string) (*models.User, error) {
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
