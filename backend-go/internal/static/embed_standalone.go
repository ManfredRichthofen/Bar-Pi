//go:build !bundle

package static

import (
	"errors"
	"io/fs"
)

// GetDistFS returns an error in standalone mode
// Standalone builds are API-only and do not serve frontend files
func GetDistFS() (fs.FS, error) {
	return nil, errors.New("frontend serving disabled in standalone mode - API-only build")
}

// HasEmbeddedFiles returns false in standalone mode
func HasEmbeddedFiles() bool {
	return false
}

// IsStandaloneMode returns true when built without bundle tag
func IsStandaloneMode() bool {
	return true
}
