package version

// Version is the release version of the binary, injected at build time via
// -ldflags "-X github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/version.Version=<ver>".
var Version = "dev"

// IsRelease reports whether the binary was built with a release version
func IsRelease() bool {
	return Version != "" && Version != "dev"
}
