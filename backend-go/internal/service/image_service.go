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
	"time"

	"github.com/gen2brain/avif"
	_ "golang.org/x/image/webp"
)

const (
	extAVIF = ".avif"
	extJPEG = ".jpg"

	avifQuality = 58
	avifSpeed   = 8
	jpegQuality = 85
)

type StoredImage struct {
	Data        []byte
	ContentType string
	ModTime     time.Time
}

// ImageService handles image operations
type ImageService struct {
	storageDir string
}

// NewImageService creates a new image service
func NewImageService(storageDir string) *ImageService {
	_ = os.MkdirAll(storageDir, 0755)
	return &ImageService{storageDir: storageDir}
}

func (s *ImageService) SaveImage(data []byte, entityType string, entityID int64) (string, error) {
	img, _, err := image.Decode(bytes.NewReader(data))
	if err != nil {
		return "", errors.New("invalid image format")
	}

	var buf bytes.Buffer
	ext := extAVIF
	if err := avif.Encode(&buf, img, avif.Options{Quality: avifQuality, Speed: avifSpeed}); err != nil {
		buf.Reset()
		ext = extJPEG
		if err := jpeg.Encode(&buf, img, &jpeg.Options{Quality: jpegQuality}); err != nil {
			return "", fmt.Errorf("failed to encode image: %w", err)
		}
	}

	filename := s.filename(entityType, entityID, ext)
	if err := os.WriteFile(filepath.Join(s.storageDir, filename), buf.Bytes(), 0644); err != nil {
		return "", fmt.Errorf("failed to write image: %w", err)
	}

	other := extJPEG
	if ext == extJPEG {
		other = extAVIF
	}
	_ = os.Remove(filepath.Join(s.storageDir, s.filename(entityType, entityID, other)))

	return filename, nil
}

func (s *ImageService) GetEntityImage(entityType string, entityID int64) (*StoredImage, error) {
	for _, candidate := range []struct{ ext, contentType string }{
		{extAVIF, "image/avif"},
		{extJPEG, "image/jpeg"},
	} {
		path := filepath.Join(s.storageDir, s.filename(entityType, entityID, candidate.ext))
		data, err := os.ReadFile(path)
		if err != nil {
			if os.IsNotExist(err) {
				continue
			}
			return nil, fmt.Errorf("failed to read image: %w", err)
		}
		info, err := os.Stat(path)
		if err != nil {
			return nil, fmt.Errorf("failed to stat image: %w", err)
		}
		return &StoredImage{Data: data, ContentType: candidate.contentType, ModTime: info.ModTime()}, nil
	}
	return nil, nil
}

func (s *ImageService) DeleteEntityImage(entityType string, entityID int64) error {
	for _, ext := range []string{extAVIF, extJPEG} {
		err := os.Remove(filepath.Join(s.storageDir, s.filename(entityType, entityID, ext)))
		if err != nil && !os.IsNotExist(err) {
			return fmt.Errorf("failed to delete image: %w", err)
		}
	}
	return nil
}

func (s *ImageService) filename(entityType string, entityID int64, ext string) string {
	return fmt.Sprintf("%s_%d%s", filepath.Base(entityType), entityID, ext)
}
