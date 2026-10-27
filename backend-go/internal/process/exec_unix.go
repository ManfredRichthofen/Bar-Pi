//go:build unix

package process

import (
	"os"
	"path/filepath"
	"syscall"
)

// Reexec replaces the current process image with the (updated) executable,
// keeping the same PID, arguments and environment.
func Reexec() error {
	exe, err := os.Executable()
	if err != nil {
		return err
	}
	if resolved, err := filepath.EvalSymlinks(exe); err == nil {
		exe = resolved
	}
	return syscall.Exec(exe, os.Args, os.Environ())
}
