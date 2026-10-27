package process

import (
	"os"
	"path/filepath"
)

// Resolved at startup: on Linux os.Executable follows the inode, so once the
// updater renames the running binary to *.bak it would point at the old file.
var startupExe, startupExeErr = resolveExecutable()

func resolveExecutable() (string, error) {
	exe, err := os.Executable()
	if err != nil {
		return "", err
	}
	if resolved, err := filepath.EvalSymlinks(exe); err == nil {
		exe = resolved
	}
	return exe, nil
}

// Executable returns the path the current binary was started from
func Executable() (string, error) {
	return startupExe, startupExeErr
}
