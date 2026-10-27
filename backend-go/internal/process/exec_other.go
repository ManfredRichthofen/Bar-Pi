//go:build !unix

package process

import "errors"

// Reexec is not available on this platform
func Reexec() error {
	return errors.New("in-place restart is not supported on this platform")
}
