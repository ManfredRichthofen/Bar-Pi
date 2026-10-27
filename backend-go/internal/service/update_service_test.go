package service

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/models"
)

func TestIsNewerVersion(t *testing.T) {
	cases := []struct {
		candidate, current string
		want               bool
	}{
		{"v1.2.0", "1.1.9", true},
		{"1.2.0", "v1.2.0", false},
		{"v1.10.0", "v1.9.0", true},
		{"v2.0.0-beta.1", "v1.9.0", true},
		{"v2.0.0-beta.1", "v2.0.0", false},
		{"v2.0.0", "v2.0.0-beta.1", true},
		{"v1.0.0", "dev", false},
		{"backend-v1.0.0", "v0.1.0", false},
	}
	for _, c := range cases {
		if got := isNewerVersion(c.candidate, c.current); got != c.want {
			t.Errorf("isNewerVersion(%q, %q) = %v, want %v", c.candidate, c.current, got, c.want)
		}
	}
}

func TestPickNewestRelease(t *testing.T) {
	releases := []githubRelease{
		{TagName: "v1.0.0"},
		{TagName: "v1.2.0-beta.1", Prerelease: true},
		{TagName: "v1.3.0", Draft: true},
		{TagName: "backend-v9.0.0"},
		{TagName: "v1.1.0"},
	}
	got := pickNewestRelease(releases)
	if got == nil || got.TagName != "v1.2.0-beta.1" {
		t.Fatalf("pickNewestRelease = %+v, want v1.2.0-beta.1", got)
	}
	if pickNewestRelease(nil) != nil {
		t.Fatal("expected nil for empty list")
	}
}

func TestAssetName(t *testing.T) {
	cases := []struct{ variant, arch, want string }{
		{"bundle", "arm64", "bar-pi-bundle-linux-arm64"},
		{"server", "arm", "bar-pi-server-linux-arm"},
		{"bundle", "amd64", "bar-pi-bundle-linux-amd64"},
	}
	for _, c := range cases {
		s := NewUpdateService(UpdateServiceOptions{Variant: c.variant, GOOS: "linux", GOARCH: c.arch})
		if got := s.AssetName(); got != c.want {
			t.Errorf("AssetName() = %q, want %q", got, c.want)
		}
	}
}

func TestInInstallWindow(t *testing.T) {
	at := func(h int) time.Time { return time.Date(2026, 1, 1, h, 30, 0, 0, time.Local) }
	cases := []struct {
		hour, start, end int
		want             bool
	}{
		{3, 3, 5, true},
		{4, 3, 5, true},
		{5, 3, 5, false},
		{2, 3, 5, false},
		{23, 22, 2, true},
		{1, 22, 2, true},
		{2, 22, 2, false},
		{12, 22, 2, false},
		{12, 4, 4, true},
	}
	for _, c := range cases {
		if got := inInstallWindow(at(c.hour), c.start, c.end); got != c.want {
			t.Errorf("inInstallWindow(%d, %d, %d) = %v, want %v", c.hour, c.start, c.end, got, c.want)
		}
	}
}

func TestParseChecksums(t *testing.T) {
	in := "abc123  bar-pi-bundle-linux-arm64\nDEF456 *bar-pi-server-linux-arm\n\ngarbage\n"
	got := parseChecksums(strings.NewReader(in))
	if got["bar-pi-bundle-linux-arm64"] != "abc123" || got["bar-pi-server-linux-arm"] != "def456" || len(got) != 2 {
		t.Fatalf("unexpected checksums: %v", got)
	}
}

type fakeGitHub struct {
	server   *httptest.Server
	binary   []byte
	checksum string
}

func newFakeGitHub(t *testing.T, tag string, binary []byte, checksum string) *fakeGitHub {
	t.Helper()
	f := &fakeGitHub{binary: binary, checksum: checksum}
	mux := http.NewServeMux()
	f.server = httptest.NewServer(mux)
	t.Cleanup(f.server.Close)

	asset := "bar-pi-bundle-linux-arm64"
	mux.HandleFunc("/repos/owner/repo/releases/latest", func(w http.ResponseWriter, r *http.Request) {
		_ = json.NewEncoder(w).Encode(githubRelease{
			TagName: tag,
			Body:    "## Features\n- something",
			HTMLURL: "https://example.invalid/release",
			Assets: []githubAsset{
				{Name: asset, URL: f.server.URL + "/dl/" + asset, Size: int64(len(binary))},
				{Name: checksumAssetName, URL: f.server.URL + "/dl/SHA256SUMS"},
			},
		})
	})
	mux.HandleFunc("/dl/"+asset, func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write(f.binary)
	})
	mux.HandleFunc("/dl/SHA256SUMS", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "%s  %s\n", f.checksum, asset)
	})
	return f
}

func sha256Hex(b []byte) string {
	sum := sha256.Sum256(b)
	return hex.EncodeToString(sum[:])
}

func newTestUpdater(t *testing.T, gh *fakeGitHub, restarted chan struct{}) (*UpdateService, string) {
	t.Helper()
	dir := t.TempDir()
	exe := filepath.Join(dir, "bar-pi-server")
	if err := os.WriteFile(exe, []byte("old-binary"), 0o755); err != nil {
		t.Fatal(err)
	}
	s := NewUpdateService(UpdateServiceOptions{
		Repo:           "owner/repo",
		APIBase:        gh.server.URL,
		CurrentVersion: "1.0.0",
		Variant:        "bundle",
		GOOS:           "linux",
		GOARCH:         "arm64",
		ExecutablePath: func() (string, error) { return exe, nil },
		Settings:       func() models.UpdaterSettings { return models.UpdaterSettings{AutoCheck: true} },
		Restart:        func() { close(restarted) },
	})
	return s, exe
}

func TestInstallSuccess(t *testing.T) {
	newBin := []byte("new-binary-contents")
	gh := newFakeGitHub(t, "v1.1.0", newBin, sha256Hex(newBin))
	restarted := make(chan struct{})
	s, exe := newTestUpdater(t, gh, restarted)

	st, err := s.Check(context.Background())
	if err != nil {
		t.Fatalf("Check: %v", err)
	}
	if !st.HasUpdate || st.LatestVersion != "1.1.0" || !st.Supported {
		t.Fatalf("unexpected status: %+v", st)
	}

	if err := s.Install(context.Background()); err != nil {
		t.Fatalf("Install: %v", err)
	}
	got, _ := os.ReadFile(exe)
	if string(got) != string(newBin) {
		t.Fatalf("binary not replaced, got %q", got)
	}
	if bak, _ := os.ReadFile(exe + backupSuffix); string(bak) != "old-binary" {
		t.Fatalf("backup missing, got %q", bak)
	}
	select {
	case <-restarted:
	case <-time.After(3 * time.Second):
		t.Fatal("restart was not triggered")
	}
	if s.Status().State != UpdateStateRestarting {
		t.Fatalf("state = %s, want restarting", s.Status().State)
	}
}

func TestInstallChecksumMismatch(t *testing.T) {
	gh := newFakeGitHub(t, "v1.1.0", []byte("tampered"), sha256Hex([]byte("expected")))
	restarted := make(chan struct{})
	s, exe := newTestUpdater(t, gh, restarted)

	if _, err := s.Check(context.Background()); err != nil {
		t.Fatalf("Check: %v", err)
	}
	err := s.Install(context.Background())
	if !errors.Is(err, ErrChecksumMismatch) {
		t.Fatalf("Install err = %v, want checksum mismatch", err)
	}
	got, _ := os.ReadFile(exe)
	if string(got) != "old-binary" {
		t.Fatalf("binary should be untouched, got %q", got)
	}
	if _, err := os.Stat(filepath.Join(filepath.Dir(exe), updateTempFileName)); !os.IsNotExist(err) {
		t.Fatal("temp file should be removed")
	}
	st := s.Status()
	if st.State != UpdateStateError || st.Error == "" {
		t.Fatalf("unexpected status after failure: %+v", st)
	}
}

func TestInstallRefusedWhenBusyOrUpToDate(t *testing.T) {
	gh := newFakeGitHub(t, "v1.0.0", []byte("x"), sha256Hex([]byte("x")))
	s, _ := newTestUpdater(t, gh, make(chan struct{}))
	if _, err := s.Check(context.Background()); err != nil {
		t.Fatal(err)
	}
	if err := s.Install(context.Background()); !errors.Is(err, ErrNoUpdateAvailable) {
		t.Fatalf("err = %v, want no update available", err)
	}

	s.opts.IsBusy = func() bool { return true }
	if err := s.Install(context.Background()); !errors.Is(err, ErrOrderInProgress) {
		t.Fatalf("err = %v, want order in progress", err)
	}
}

func TestShouldAutoInstall(t *testing.T) {
	newBin := []byte("new")
	gh := newFakeGitHub(t, "v1.1.0", newBin, sha256Hex(newBin))
	s, _ := newTestUpdater(t, gh, make(chan struct{}))
	s.opts.Now = func() time.Time { return time.Date(2026, 1, 1, 4, 0, 0, 0, time.Local) }
	if _, err := s.Check(context.Background()); err != nil {
		t.Fatal(err)
	}

	settings := models.UpdaterSettings{AutoInstall: true, WindowEnabled: true, WindowStartHour: 3, WindowEndHour: 5}
	if !s.shouldAutoInstall(settings) {
		t.Fatal("expected auto-install inside window")
	}
	settings.WindowStartHour, settings.WindowEndHour = 10, 12
	if s.shouldAutoInstall(settings) {
		t.Fatal("expected no auto-install outside window")
	}
	settings.WindowEnabled = false
	s.opts.IsBusy = func() bool { return true }
	if s.shouldAutoInstall(settings) {
		t.Fatal("expected no auto-install while busy")
	}
	s.opts.IsBusy = func() bool { return false }
	settings.AutoInstall = false
	if s.shouldAutoInstall(settings) {
		t.Fatal("expected no auto-install when disabled")
	}
}

func TestUnsupportedBuilds(t *testing.T) {
	cases := []struct {
		opts UpdateServiceOptions
		want string
	}{
		{UpdateServiceOptions{CurrentVersion: "1.0.0", GOOS: "linux", Disabled: true, Restart: func() {}}, "disabled"},
		{UpdateServiceOptions{CurrentVersion: "1.0.0", GOOS: "windows", Restart: func() {}}, "unsupported_os"},
		{UpdateServiceOptions{CurrentVersion: "dev", GOOS: "linux", Restart: func() {}}, "dev_build"},
		{UpdateServiceOptions{CurrentVersion: "1.0.0", GOOS: "linux"}, "no_restart"},
		{UpdateServiceOptions{CurrentVersion: "1.0.0", GOOS: "linux", Restart: func() {}}, ""},
	}
	for _, c := range cases {
		st := NewUpdateService(c.opts).Status()
		if st.UnsupportedReason != c.want || st.Supported != (c.want == "") {
			t.Errorf("opts %+v: reason=%q supported=%v, want %q", c.opts, st.UnsupportedReason, st.Supported, c.want)
		}
	}
}
