//go:build bundle

package static

import (
	"embed"
	"io/fs"
)

// Embed the frontend dist directory (only when building with -tags bundle)
//
//go:embed all:dist
var distFS embed.FS

// GetDistFS returns the filesystem for the frontend dist directory
func GetDistFS() (fs.FS, error) {
	subFS, err := fs.Sub(distFS, "dist")
	if err != nil {
		return nil, err
	}
	return subFS, nil
}

// HasEmbeddedFiles returns true if the binary has embedded frontend files
func HasEmbeddedFiles() bool {
	subFS, err := fs.Sub(distFS, "dist")
	if err != nil {
		return false
	}
	entries, _ := fs.ReadDir(subFS, ".")
	return len(entries) > 0
}

// IsStandaloneMode returns false when built with bundle tag
func IsStandaloneMode() bool {
	return false
}
