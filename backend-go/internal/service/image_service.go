package service

import (
	"bytes"
	"errors"
	"fmt"
	"image"
	"image/jpeg"
	"os"
	"path/filepath"
)

// ImageService handles image operations
type ImageService struct {
	storageDir string
}

// NewImageService creates a new image service
func NewImageService(storageDir string) *ImageService {
	// Create storage directory if it doesn't exist
	os.MkdirAll(storageDir, 0755)
	return &ImageService{storageDir: storageDir}
}

// SaveImage saves an image file and returns the filename
func (s *ImageService) SaveImage(data []byte, entityType string, entityID int64) (string, error) {
	// Decode image to validate format
	img, _, err := image.Decode(bytes.NewReader(data))
	if err != nil {
		return "", errors.New("invalid image format")
	}

	// For now, save without resizing (can add resize later if needed)
	resized := img

	// Generate filename
	filename := fmt.Sprintf("%s_%d.jpg", entityType, entityID)
	filepath := filepath.Join(s.storageDir, filename)

	// Save as JPEG
	file, err := os.Create(filepath)
	if err != nil {
		return "", fmt.Errorf("failed to create file: %w", err)
	}
	defer file.Close()

	// Encode as JPEG with quality 85
	if err := jpeg.Encode(file, resized, &jpeg.Options{Quality: 85}); err != nil {
		return "", fmt.Errorf("failed to encode image: %w", err)
	}

	return filename, nil
}

// GetImage retrieves an image by filename
func (s *ImageService) GetImage(filename string) ([]byte, error) {
	filepath := filepath.Join(s.storageDir, filename)

	data, err := os.ReadFile(filepath)
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
	filepath := filepath.Join(s.storageDir, filename)

	err := os.Remove(filepath)
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

	// Only allow common formats
	switch format {
	case "jpeg", "jpg", "png", "gif":
		return format, nil
	default:
		return "", fmt.Errorf("unsupported image format: %s", format)
	}
}
