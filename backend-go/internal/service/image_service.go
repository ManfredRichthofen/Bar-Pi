package service

import (
	"bytes"
	"errors"
	"fmt"
	"image"
	_ "image/gif"
	"image/jpeg"
	_ "image/png"
	"os"
	"path/filepath"
)

// ImageService handles image operations
type ImageService struct {
	storageDir string
}

// NewImageService creates a new image service
func NewImageService(storageDir string) *ImageService {
	_ = os.MkdirAll(storageDir, 0755)
	return &ImageService{storageDir: storageDir}
}

// SaveImage saves an image file and returns the filename
func (s *ImageService) SaveImage(data []byte, entityType string, entityID int64) (string, error) {
	img, _, err := image.Decode(bytes.NewReader(data))
	if err != nil {
		return "", errors.New("invalid image format")
	}

	safeEntityType := filepath.Base(entityType)
	filename := fmt.Sprintf("%s_%d.jpg", safeEntityType, entityID)
	fullPath := filepath.Join(s.storageDir, filename)

	file, err := os.Create(fullPath)
	if err != nil {
		return "", fmt.Errorf("failed to create file: %w", err)
	}
	defer file.Close()

	if err := jpeg.Encode(file, img, &jpeg.Options{Quality: 85}); err != nil {
		return "", fmt.Errorf("failed to encode image: %w", err)
	}

	return filename, nil
}

// GetImage retrieves an image by filename
func (s *ImageService) GetImage(filename string) ([]byte, error) {
	safeFilename := filepath.Base(filename)
	if safeFilename == "." || safeFilename == "/" || safeFilename == "" {
		return nil, errors.New("invalid filename")
	}
	fullPath := filepath.Join(s.storageDir, safeFilename)

	data, err := os.ReadFile(fullPath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to read image: %w", err)
	}

	return data, nil
}

// DeleteImage deletes an image file
func (s *ImageService) DeleteImage(filename string) error {
	safeFilename := filepath.Base(filename)
	if safeFilename == "." || safeFilename == "/" || safeFilename == "" {
		return errors.New("invalid filename")
	}
	fullPath := filepath.Join(s.storageDir, safeFilename)

	err := os.Remove(fullPath)
	if err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("failed to delete image: %w", err)
	}

	return nil
}

// ValidateImageFormat checks if the data is a valid image
func (s *ImageService) ValidateImageFormat(data []byte) (string, error) {
	_, format, err := image.Decode(bytes.NewReader(data))
	if err != nil {
		return "", errors.New("invalid image format")
	}

	switch format {
	case "jpeg", "jpg", "png", "gif":
		return format, nil
	default:
		return "", fmt.Errorf("unsupported image format: %s", format)
	}
}
