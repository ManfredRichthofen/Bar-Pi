//go:build unix

package process

import (
	"os"
	"syscall"
)

// Reexec replaces the current process image with the (updated) executable,
// keeping the same PID, arguments and environment.
func Reexec() error {
	exe, err := Executable()
	if err != nil {
		return err
	}
	return syscall.Exec(exe, os.Args, os.Environ())
}
