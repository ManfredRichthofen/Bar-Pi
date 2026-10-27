package service

import (
	"bufio"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"time"

	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/models"
	"golang.org/x/mod/semver"
)

const (
	defaultGitHubAPI     = "https://api.github.com"
	checksumAssetName    = "SHA256SUMS"
	updateTempFileName   = ".bar-pi-update.tmp"
	backupSuffix         = ".bak"
	defaultCheckInterval = 6 * time.Hour
	defaultPollInterval  = 10 * time.Minute
	defaultInitialDelay  = 2 * time.Minute
	backupCleanupDelay   = 60 * time.Second
)

// UpdateState describes what the updater is currently doing
type UpdateState string

const (
	UpdateStateIdle        UpdateState = "idle"
	UpdateStateChecking    UpdateState = "checking"
	UpdateStateDownloading UpdateState = "downloading"
	UpdateStateInstalling  UpdateState = "installing"
	UpdateStateRestarting  UpdateState = "restarting"
	UpdateStateError       UpdateState = "error"
)

var (
	ErrUpdaterDisabled    = errors.New("updater is disabled")
	ErrUpdateUnsupported  = errors.New("self-update is not supported on this build")
	ErrUpdateInProgress   = errors.New("an update operation is already in progress")
	ErrNoUpdateAvailable  = errors.New("no update available")
	ErrOrderInProgress    = errors.New("cannot update while a cocktail is being prepared")
	ErrAssetNotFound      = errors.New("no matching binary found in the release")
	ErrChecksumMissing    = errors.New("release does not provide SHA256SUMS; refusing to install")
	ErrChecksumMismatch   = errors.New("downloaded binary failed checksum verification")
	ErrInvalidReleaseInfo = errors.New("release has no valid semantic version tag")
)

// UpdateStatus is the updater state exposed to the API and websocket
type UpdateStatus struct {
	Supported         bool        `json:"supported"`
	UnsupportedReason string      `json:"unsupportedReason,omitempty"`
	Disabled          bool        `json:"disabled"`
	CurrentVersion    string      `json:"currentVersion"`
	LatestVersion     string      `json:"latestVersion,omitempty"`
	HasUpdate         bool        `json:"hasUpdate"`
	Prerelease        bool        `json:"prerelease"`
	ReleaseNotes      string      `json:"releaseNotes,omitempty"`
	ReleaseURL        string      `json:"releaseUrl,omitempty"`
	PublishedAt       *time.Time  `json:"publishedAt,omitempty"`
	LastChecked       *time.Time  `json:"lastChecked,omitempty"`
	State             UpdateState `json:"state"`
	Progress          int         `json:"progress"`
	Error             string      `json:"error,omitempty"`
	Variant           string      `json:"variant"`
	AssetName         string      `json:"assetName"`
}

type githubAsset struct {
	Name string `json:"name"`
	URL  string `json:"browser_download_url"`
	Size int64  `json:"size"`
}

type githubRelease struct {
	TagName     string        `json:"tag_name"`
	Name        string        `json:"name"`
	Body        string        `json:"body"`
	HTMLURL     string        `json:"html_url"`
	Draft       bool          `json:"draft"`
	Prerelease  bool          `json:"prerelease"`
	PublishedAt time.Time     `json:"published_at"`
	Assets      []githubAsset `json:"assets"`
}

// UpdateServiceOptions configures an UpdateService
type UpdateServiceOptions struct {
	Repo           string
	Token          string
	APIBase        string
	CurrentVersion string
	Variant        string
	GOOS           string
	GOARCH         string
	Disabled       bool
	HTTPClient     *http.Client

	// ExecutablePath returns the path of the binary to replace
	ExecutablePath func() (string, error)
	// Settings returns the current persisted updater settings
	Settings func() models.UpdaterSettings
	// IsBusy reports whether an update must be deferred (e.g. an active order)
	IsBusy func() bool
	// Broadcast pushes status changes to connected clients
	Broadcast func(UpdateStatus)
	// Restart re-executes the process after the binary was replaced
	Restart func()
	Now     func() time.Time
}

// UpdateService checks GitHub releases and replaces the running binary
type UpdateService struct {
	opts UpdateServiceOptions

	checkInterval time.Duration
	pollInterval  time.Duration
	initialDelay  time.Duration

	mu          sync.Mutex
	state       UpdateState
	progress    int
	lastErr     string
	lastChecked *time.Time
	latest      *githubRelease
}

// NewUpdateService creates a new update service
func NewUpdateService(opts UpdateServiceOptions) *UpdateService {
	if opts.APIBase == "" {
		opts.APIBase = defaultGitHubAPI
	}
	if opts.GOOS == "" {
		opts.GOOS = runtime.GOOS
	}
	if opts.GOARCH == "" {
		opts.GOARCH = runtime.GOARCH
	}
	if opts.HTTPClient == nil {
		opts.HTTPClient = &http.Client{Timeout: 15 * time.Minute}
	}
	if opts.ExecutablePath == nil {
		opts.ExecutablePath = func() (string, error) {
			exe, err := os.Executable()
			if err != nil {
				return "", err
			}
			return filepath.EvalSymlinks(exe)
		}
	}
	if opts.Settings == nil {
		opts.Settings = func() models.UpdaterSettings { return models.UpdaterSettings{} }
	}
	if opts.IsBusy == nil {
		opts.IsBusy = func() bool { return false }
	}
	if opts.Now == nil {
		opts.Now = time.Now
	}
	return &UpdateService{
		opts:          opts,
		checkInterval: defaultCheckInterval,
		pollInterval:  defaultPollInterval,
		initialDelay:  defaultInitialDelay,
		state:         UpdateStateIdle,
	}
}

// AssetName returns the release asset name matching this binary
func (s *UpdateService) AssetName() string {
	return fmt.Sprintf("bar-pi-%s-%s-%s", s.opts.Variant, s.opts.GOOS, s.opts.GOARCH)
}

func (s *UpdateService) unsupportedReason() string {
	switch {
	case s.opts.Disabled:
		return "disabled"
	case s.opts.GOOS != "linux":
		return "unsupported_os"
	case !semver.IsValid(canonicalVersion(s.opts.CurrentVersion)):
		return "dev_build"
	case s.opts.Restart == nil:
		return "no_restart"
	}
	return ""
}

// Status returns a snapshot of the updater status
func (s *UpdateService) Status() UpdateStatus {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.statusLocked()
}

func (s *UpdateService) statusLocked() UpdateStatus {
	reason := s.unsupportedReason()
	st := UpdateStatus{
		Supported:         reason == "",
		UnsupportedReason: reason,
		Disabled:          s.opts.Disabled,
		CurrentVersion:    s.opts.CurrentVersion,
		LastChecked:       s.lastChecked,
		State:             s.state,
		Progress:          s.progress,
		Error:             s.lastErr,
		Variant:           s.opts.Variant,
		AssetName:         s.AssetName(),
	}
	if s.latest != nil {
		published := s.latest.PublishedAt
		st.LatestVersion = strings.TrimPrefix(s.latest.TagName, "v")
		st.HasUpdate = isNewerVersion(s.latest.TagName, s.opts.CurrentVersion)
		st.Prerelease = s.latest.Prerelease
		st.ReleaseNotes = s.latest.Body
		st.ReleaseURL = s.latest.HTMLURL
		st.PublishedAt = &published
	}
	return st
}

func (s *UpdateService) setState(state UpdateState, progress int, errMsg string) {
	s.mu.Lock()
	s.state = state
	s.progress = progress
	s.lastErr = errMsg
	s.mu.Unlock()
	s.broadcast()
}

func (s *UpdateService) broadcast() {
	if s.opts.Broadcast != nil {
		s.opts.Broadcast(s.Status())
	}
}

func (s *UpdateService) isActiveLocked() bool {
	switch s.state {
	case UpdateStateChecking, UpdateStateDownloading, UpdateStateInstalling, UpdateStateRestarting:
		return true
	}
	return false
}

// Check queries GitHub for the newest release and caches the result
func (s *UpdateService) Check(ctx context.Context) (UpdateStatus, error) {
	if s.opts.Disabled {
		return s.Status(), ErrUpdaterDisabled
	}
	s.mu.Lock()
	if s.isActiveLocked() {
		st := s.statusLocked()
		s.mu.Unlock()
		return st, ErrUpdateInProgress
	}
	s.state, s.progress, s.lastErr = UpdateStateChecking, 0, ""
	s.mu.Unlock()
	s.broadcast()

	release, err := s.fetchLatestRelease(ctx, s.opts.Settings().IncludePrerelease)
	now := s.opts.Now()
	s.mu.Lock()
	s.lastChecked = &now
	if err == nil {
		s.latest = release
	}
	s.mu.Unlock()

	if err != nil {
		s.setState(UpdateStateError, 0, err.Error())
		return s.Status(), err
	}
	s.setState(UpdateStateIdle, 0, "")
	return s.Status(), nil
}

func (s *UpdateService) fetchLatestRelease(ctx context.Context, includePrerelease bool) (*githubRelease, error) {
	if !includePrerelease {
		var rel githubRelease
		if err := s.getJSON(ctx, fmt.Sprintf("%s/repos/%s/releases/latest", s.opts.APIBase, s.opts.Repo), &rel); err != nil {
			return nil, err
		}
		if !semver.IsValid(canonicalVersion(rel.TagName)) {
			return nil, ErrInvalidReleaseInfo
		}
		return &rel, nil
	}

	var releases []githubRelease
	if err := s.getJSON(ctx, fmt.Sprintf("%s/repos/%s/releases?per_page=20", s.opts.APIBase, s.opts.Repo), &releases); err != nil {
		return nil, err
	}
	best := pickNewestRelease(releases)
	if best == nil {
		return nil, ErrInvalidReleaseInfo
	}
	return best, nil
}

// pickNewestRelease returns the highest semver non-draft release
func pickNewestRelease(releases []githubRelease) *githubRelease {
	var best *githubRelease
	for i := range releases {
		r := &releases[i]
		if r.Draft || !semver.IsValid(canonicalVersion(r.TagName)) {
			continue
		}
		if best == nil || semver.Compare(canonicalVersion(r.TagName), canonicalVersion(best.TagName)) > 0 {
			best = r
		}
	}
	return best
}

func (s *UpdateService) getJSON(ctx context.Context, url string, target any) error {
	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()
	resp, err := s.doGet(ctx, url, "application/vnd.github+json")
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	return json.NewDecoder(resp.Body).Decode(target)
}

func (s *UpdateService) doGet(ctx context.Context, url, accept string) (*http.Response, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Accept", accept)
	req.Header.Set("User-Agent", "Bar-Pi-Updater/"+s.opts.CurrentVersion)
	if s.opts.Token != "" && strings.HasPrefix(url, s.opts.APIBase) {
		req.Header.Set("Authorization", "Bearer "+s.opts.Token)
	}
	resp, err := s.opts.HTTPClient.Do(req)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode != http.StatusOK {
		resp.Body.Close()
		return nil, fmt.Errorf("GET %s: unexpected status %s", url, resp.Status)
	}
	return resp, nil
}

// StartInstall validates that an install can run and performs it in the background
func (s *UpdateService) StartInstall() error {
	release, err := s.claimInstall()
	if err != nil {
		return err
	}
	go func() {
		if err := s.runInstall(context.Background(), release); err != nil {
			log.Printf("Updater: install failed: %v", err)
		}
	}()
	return nil
}

// Install downloads, verifies and swaps in the latest release binary, then restarts
func (s *UpdateService) Install(ctx context.Context) error {
	release, err := s.claimInstall()
	if err != nil {
		return err
	}
	return s.runInstall(ctx, release)
}

// claimInstall checks preconditions and moves the state to downloading atomically
func (s *UpdateService) claimInstall() (*githubRelease, error) {
	if s.opts.Disabled {
		return nil, ErrUpdaterDisabled
	}
	if s.unsupportedReason() != "" {
		return nil, ErrUpdateUnsupported
	}
	if s.opts.IsBusy() {
		return nil, ErrOrderInProgress
	}
	s.mu.Lock()
	if s.isActiveLocked() {
		s.mu.Unlock()
		return nil, ErrUpdateInProgress
	}
	if s.latest == nil || !isNewerVersion(s.latest.TagName, s.opts.CurrentVersion) {
		s.mu.Unlock()
		return nil, ErrNoUpdateAvailable
	}
	release := *s.latest
	s.state, s.progress, s.lastErr = UpdateStateDownloading, 0, ""
	s.mu.Unlock()
	s.broadcast()
	return &release, nil
}

func (s *UpdateService) runInstall(ctx context.Context, release *githubRelease) error {
	if err := s.install(ctx, release); err != nil {
		s.setState(UpdateStateError, 0, err.Error())
		return err
	}

	s.setState(UpdateStateRestarting, 100, "")
	log.Printf("Updater: installed %s, restarting", release.TagName)
	go func() {
		// Give the HTTP response and websocket broadcast a moment to flush
		time.Sleep(500 * time.Millisecond)
		s.opts.Restart()
	}()
	return nil
}

func (s *UpdateService) install(ctx context.Context, release *githubRelease) error {
	assetName := s.AssetName()
	var binAsset, sumAsset *githubAsset
	for i := range release.Assets {
		switch release.Assets[i].Name {
		case assetName:
			binAsset = &release.Assets[i]
		case checksumAssetName:
			sumAsset = &release.Assets[i]
		}
	}
	if binAsset == nil {
		return fmt.Errorf("%w: %s", ErrAssetNotFound, assetName)
	}
	if sumAsset == nil {
		return ErrChecksumMissing
	}

	expected, err := s.fetchChecksum(ctx, sumAsset.URL, assetName)
	if err != nil {
		return err
	}

	exe, err := s.opts.ExecutablePath()
	if err != nil {
		return fmt.Errorf("locate executable: %w", err)
	}
	tmpPath := filepath.Join(filepath.Dir(exe), updateTempFileName)

	actual, err := s.download(ctx, binAsset, tmpPath)
	if err != nil {
		_ = os.Remove(tmpPath)
		return err
	}
	if !strings.EqualFold(actual, expected) {
		_ = os.Remove(tmpPath)
		return ErrChecksumMismatch
	}

	s.setState(UpdateStateInstalling, 100, "")
	if err := swapBinary(exe, tmpPath); err != nil {
		_ = os.Remove(tmpPath)
		return err
	}
	return nil
}

func (s *UpdateService) fetchChecksum(ctx context.Context, url, assetName string) (string, error) {
	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()
	resp, err := s.doGet(ctx, url, "application/octet-stream")
	if err != nil {
		return "", fmt.Errorf("download checksums: %w", err)
	}
	defer resp.Body.Close()
	sum, ok := parseChecksums(resp.Body)[assetName]
	if !ok {
		return "", fmt.Errorf("%w (no entry for %s)", ErrChecksumMissing, assetName)
	}
	return sum, nil
}

// parseChecksums parses `sha256sum` output into a name -> hex digest map
func parseChecksums(r io.Reader) map[string]string {
	out := map[string]string{}
	scanner := bufio.NewScanner(r)
	for scanner.Scan() {
		fields := strings.Fields(scanner.Text())
		if len(fields) != 2 {
			continue
		}
		out[strings.TrimPrefix(fields[1], "*")] = strings.ToLower(fields[0])
	}
	return out
}

func (s *UpdateService) download(ctx context.Context, asset *githubAsset, dest string) (string, error) {
	resp, err := s.doGet(ctx, asset.URL, "application/octet-stream")
	if err != nil {
		return "", fmt.Errorf("download binary: %w", err)
	}
	defer resp.Body.Close()

	f, err := os.OpenFile(dest, os.O_CREATE|os.O_TRUNC|os.O_WRONLY, 0o755)
	if err != nil {
		return "", fmt.Errorf("create temp file: %w", err)
	}
	defer f.Close()

	total := resp.ContentLength
	if total <= 0 {
		total = asset.Size
	}
	hasher := sha256.New()
	pw := &progressWriter{total: total, onProgress: func(pct int) {
		s.setState(UpdateStateDownloading, pct, "")
	}}
	if _, err := io.Copy(io.MultiWriter(f, hasher, pw), resp.Body); err != nil {
		return "", fmt.Errorf("download binary: %w", err)
	}
	if err := f.Sync(); err != nil {
		return "", err
	}
	return hex.EncodeToString(hasher.Sum(nil)), nil
}

type progressWriter struct {
	total      int64
	written    int64
	lastPct    int
	onProgress func(int)
}

func (p *progressWriter) Write(b []byte) (int, error) {
	p.written += int64(len(b))
	if p.total > 0 {
		pct := int(p.written * 100 / p.total)
		if pct > 100 {
			pct = 100
		}
		if pct >= p.lastPct+5 || (pct == 100 && p.lastPct != 100) {
			p.lastPct = pct
			p.onProgress(pct)
		}
	}
	return len(b), nil
}

// swapBinary atomically replaces exe with newPath, keeping exe+".bak"
func swapBinary(exe, newPath string) error {
	if err := os.Chmod(newPath, 0o755); err != nil {
		return fmt.Errorf("chmod new binary: %w", err)
	}
	backup := exe + backupSuffix
	_ = os.Remove(backup)
	if err := os.Rename(exe, backup); err != nil {
		return fmt.Errorf("backup current binary: %w", err)
	}
	if err := os.Rename(newPath, exe); err != nil {
		_ = os.Rename(backup, exe)
		return fmt.Errorf("install new binary: %w", err)
	}
	return nil
}

// Start runs the periodic check / auto-install loop until ctx is cancelled
func (s *UpdateService) Start(ctx context.Context) {
	if s.opts.Disabled {
		return
	}
	go s.cleanupBackup(ctx)
	go func() {
		timer := time.NewTimer(s.initialDelay)
		defer timer.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-timer.C:
				s.tick(ctx)
				timer.Reset(s.pollInterval)
			}
		}
	}()
}

func (s *UpdateService) tick(ctx context.Context) {
	settings := s.opts.Settings()
	if !settings.AutoCheck {
		return
	}

	s.mu.Lock()
	due := s.lastChecked == nil || s.opts.Now().Sub(*s.lastChecked) >= s.checkInterval
	s.mu.Unlock()
	if due {
		if _, err := s.Check(ctx); err != nil {
			log.Printf("Updater: check failed: %v", err)
			return
		}
	}

	if !s.shouldAutoInstall(settings) {
		return
	}
	log.Printf("Updater: auto-installing %s", s.Status().LatestVersion)
	if err := s.Install(ctx); err != nil {
		log.Printf("Updater: auto-install failed: %v", err)
	}
}

func (s *UpdateService) shouldAutoInstall(settings models.UpdaterSettings) bool {
	if !settings.AutoInstall || s.unsupportedReason() != "" {
		return false
	}
	if settings.WindowEnabled && !inInstallWindow(s.opts.Now(), settings.WindowStartHour, settings.WindowEndHour) {
		return false
	}
	if s.opts.IsBusy() {
		return false
	}
	st := s.Status()
	// Don't retry a failed install every poll; the next scheduled check clears the error
	return st.HasUpdate && st.State == UpdateStateIdle
}

func (s *UpdateService) cleanupBackup(ctx context.Context) {
	exe, err := s.opts.ExecutablePath()
	if err != nil {
		return
	}
	backup := exe + backupSuffix
	if _, err := os.Stat(backup); err != nil {
		return
	}
	select {
	case <-ctx.Done():
		return
	case <-time.After(backupCleanupDelay):
	}
	if err := os.Remove(backup); err == nil {
		log.Printf("Updater: removed previous binary backup %s", backup)
	}
}

// inInstallWindow reports whether now's hour is within [start, end), wrapping past midnight
func inInstallWindow(now time.Time, start, end int) bool {
	h := now.Hour()
	switch {
	case start == end:
		return true
	case start < end:
		return h >= start && h < end
	default:
		return h >= start || h < end
	}
}

func canonicalVersion(v string) string {
	v = strings.TrimSpace(v)
	if v == "" {
		return ""
	}
	if !strings.HasPrefix(v, "v") {
		v = "v" + v
	}
	return v
}

// isNewerVersion reports whether candidate is a strictly newer semver than current
func isNewerVersion(candidate, current string) bool {
	c, cur := canonicalVersion(candidate), canonicalVersion(current)
	if !semver.IsValid(c) || !semver.IsValid(cur) {
		return false
	}
	return semver.Compare(c, cur) > 0
}
