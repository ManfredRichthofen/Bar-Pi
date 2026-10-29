package service

import (
	"bytes"
	"image"
	"image/color"
	"image/jpeg"
	"image/png"
	"os"
	"path/filepath"
	"testing"
)

func testPNG(t *testing.T) []byte {
	t.Helper()
	img := image.NewRGBA(image.Rect(0, 0, 64, 64))
	for x := 0; x < 64; x++ {
		for y := 0; y < 64; y++ {
			img.Set(x, y, color.RGBA{uint8(x * 4), uint8(y * 4), 128, 255})
		}
	}
	var buf bytes.Buffer
	if err := png.Encode(&buf, img); err != nil {
		t.Fatal(err)
	}
	return buf.Bytes()
}

func TestSaveImageStoresAVIFAndReplacesLegacyJPEG(t *testing.T) {
	dir := t.TempDir()
	svc := NewImageService(dir)

	var legacy bytes.Buffer
	_ = jpeg.Encode(&legacy, image.NewRGBA(image.Rect(0, 0, 8, 8)), nil)
	if err := os.WriteFile(filepath.Join(dir, "recipe_7.jpg"), legacy.Bytes(), 0644); err != nil {
		t.Fatal(err)
	}

	got, err := svc.GetEntityImage("recipe", 7)
	if err != nil || got == nil || got.ContentType != "image/jpeg" {
		t.Fatalf("legacy jpeg should still be served, got %+v err %v", got, err)
	}

	name, err := svc.SaveImage(testPNG(t), "recipe", 7)
	if err != nil {
		t.Fatal(err)
	}
	if name != "recipe_7.avif" {
		t.Fatalf("expected recipe_7.avif, got %s", name)
	}
	if _, err := os.Stat(filepath.Join(dir, "recipe_7.jpg")); !os.IsNotExist(err) {
		t.Fatal("legacy jpeg should be removed after saving avif")
	}

	got, err = svc.GetEntityImage("recipe", 7)
	if err != nil || got == nil || got.ContentType != "image/avif" || len(got.Data) == 0 {
		t.Fatalf("expected avif image, got %+v err %v", got, err)
	}
}

func TestSaveImageRejectsInvalidData(t *testing.T) {
	svc := NewImageService(t.TempDir())
	if _, err := svc.SaveImage([]byte("not an image"), "recipe", 1); err == nil {
		t.Fatal("expected error for invalid image")
	}
}

func TestDeleteEntityImageRemovesAllFormats(t *testing.T) {
	dir := t.TempDir()
	svc := NewImageService(dir)
	if _, err := svc.SaveImage(testPNG(t), "ingredient", 3); err != nil {
		t.Fatal(err)
	}
	if err := svc.DeleteEntityImage("ingredient", 3); err != nil {
		t.Fatal(err)
	}
	if got, _ := svc.GetEntityImage("ingredient", 3); got != nil {
		t.Fatal("image should be gone")
	}
}
