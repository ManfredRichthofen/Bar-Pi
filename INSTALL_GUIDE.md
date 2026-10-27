# Installing Bar-Pi

This guide walks you through installing and managing Bar-Pi on your Raspberry Pi or Linux system, as well as connecting optional companion apps.

## What You'll Need

**Hardware:**
- Raspberry Pi (Pi 4 or newer recommended) or any other Linux device (`ARM64`, `ARMv7`, or `x86_64`)
- At least 500MB free storage
- 512MB RAM minimum (1GB or more is recommended, especially if using the local touchscreen UI)
- Active internet connection for downloading releases and packages

**Software:**
- Raspberry Pi OS (Bookworm or newer recommended) or a similar Debian-based Linux distribution
- A regular user account with `sudo` privileges
- Membership in the `gpio` user group if controlling physical pumps (standard on Raspberry Pi OS)

> **Touchscreen Note:** The automated touchscreen setup uses `raspi-config` and `wayfire`, which requires **Raspberry Pi OS**. If you are installing on a non-Raspberry Pi Linux system, select **No touchscreen** during installation and configure your preferred browser/kiosk mode separately.

---

## Quick Start

To install Bar-Pi interactively:

```bash
curl -L https://raw.githubusercontent.com/ManfredRichthofen/Bar-Pi/main/scripts/install/install-go.sh -o install-go.sh
chmod +x install-go.sh
./install-go.sh
```

To install automatically with sensible defaults (Complete Bundle, port `8080`, no touchscreen, systemd service enabled and started):

```bash
./install-go.sh -y
```

> **Important:** Do **not** run the script with `sudo`. The script checks against running as `root` and will prompt for `sudo` privileges only when needed.

---

## Installation Walkthrough

### 1. Download the Installer

Download the installer directly on your Pi (as shown in Quick Start), or download it on another machine and copy it via SCP:

```bash
scp install-go.sh pi@raspberrypi.local:~/
```

### 2. Answer the Prompts

The installer automatically detects your CPU architecture (`arm64`, `arm`, or `amd64`) and walks you through four choices:

#### Build Type

1. **Standalone Backend (`bar-pi-server`)** — Installs only the Go API server (~15–25MB). Choose this if you exclusively use the Android/Windows companion apps or host the frontend separately.
2. **Complete Bundle (`bar-pi-bundle`)** _(Default)_ — Includes both the Go backend and embedded React web frontend in a single binary (~30–40MB). The web UI is served automatically on the same port as the API.

#### Touchscreen UI Setup _(Complete Bundle only)_

1. **No touchscreen** _(Default)_ — Standard web server only. Best when accessing Bar-Pi from another device (phone, tablet, PC) or when using the Android/Windows app. Lightest on system resources.
2. **Touchscreen - Basic** — Configures auto-login, the Wayfire Wayland compositor, and Chromium in full-screen kiosk mode. Good if you have a physical keyboard attached or don't need text entry on the device.
3. **Touchscreen - Full** — Same as Basic, plus installs a Chrome on-screen keyboard extension for a standalone kiosk. **Requires a display connected during installation** so you can confirm the Chrome Web Store extension prompt within 100 seconds.

#### Installation Source

1. **Latest Release** _(Default)_ — Automatically fetches the newest release from GitHub.
2. **Specific Version** — Lets you pin to a specific release tag (e.g., `v0.5.0`).
3. **Local Binary File** — Installs from a binary file already on disk (useful for offline installs or custom builds).

#### System Service Setup

- **Enable systemd service** _(Default: Yes)_ — Configures Bar-Pi to start automatically on boot and restart on failure.
- **Start Bar-Pi service now** _(Default: Yes)_ — Launches Bar-Pi immediately and runs a `/health` check.

### 3. Command-Line Options & Unattended Installs

You can pass flags or environment variables to customize or automate installation:

```bash
./install-go.sh --help
```

| Flag                 | Environment Variable   | Default         | Description                                  |
| -------------------- | ---------------------- | --------------- | -------------------------------------------- |
| `-d, --dir DIR`      | `BAR_PI_INSTALL_DIR`   | `/opt/bar-pi`   | Installation directory                       |
| `-p, --port PORT`    | `BAR_PI_PORT`          | `8080`          | HTTP server port                             |
| `-b, --build TYPE`   | `BAR_PI_BUILD_TYPE`    | _(interactive)_ | `bundle` or `standalone`                     |
| `-v, --version TAG`  | `BAR_PI_VERSION`       | _(latest)_      | Specific GitHub release tag (e.g., `v0.5.0`) |
| `--touchscreen MODE` | `BAR_PI_TOUCHSCREEN`   | _(interactive)_ | `none`, `basic`, or `keyboard`               |
| `-y, --yes`          | `BAR_PI_SKIP_PROMPTS`  | `false`         | Skip all prompts and use defaults            |
| `--no-service`       | `BAR_PI_AUTO_START=no` | `yes`           | Skip systemd service creation                |
| `-u, --uninstall`    | —                      | —               | Run the uninstaller                          |

**Example unattended install on port 3000 with basic touchscreen:**

```bash
./install-go.sh -y --build bundle --port 3000 --touchscreen basic
```

---

## After Installation

### Verify It Worked

Check that the service is running:

```bash
sudo systemctl status bar-pi
```

You should see `active (running)` in the output. You can also test the health endpoint directly:

```bash
curl http://localhost:8080/health
```

### Accessing Bar-Pi

- **From the Pi itself:** `http://localhost:8080`
- **From another device on your network:** `http://<raspberry-pi-ip>:8080` (find your IP with `hostname -I`)
- **API Base URL:** `http://<raspberry-pi-ip>:8080/api/`

### Companion Apps (Windows & Android)

Each [GitHub Release](https://github.com/ManfredRichthofen/Bar-Pi/releases) also includes native Tauri thin clients:
- **Android:** `app-release.apk`
- **Windows:** `Bar-Pi-Setup.exe`

These apps include the UI locally and connect to your Raspberry Pi backend over the network. On the login screen, set the server URL to `http://<raspberry-pi-ip>:8080`.

### First-Time Security Setup

1. **Change the default admin password:**
   Log in with username `admin` and password `admin`, then immediately update the password in User Management.

2. **JWT Secret:**
   The installer automatically generates a cryptographically random 64-byte `JWT_SECRET` in `/opt/bar-pi/.env`. If you ever want to rotate it manually (which will log out all active sessions):

   ```bash
   sudo nano /opt/bar-pi/.env
   ```

   Replace `JWT_SECRET=` with the output of `openssl rand -base64 64 | tr -d '\n'`, then restart the service:

   ```bash
   sudo systemctl restart bar-pi
   ```

### Managing the Service

Use standard `systemd` commands to control Bar-Pi:

```bash
sudo systemctl start bar-pi       # Start service
sudo systemctl stop bar-pi        # Stop service
sudo systemctl restart bar-pi     # Restart service
sudo systemctl status bar-pi      # Check service status
sudo journalctl -u bar-pi -f      # Follow live logs
sudo journalctl -u bar-pi -n 100  # View last 100 log lines
```

To disable automatic startup on boot:

```bash
sudo systemctl disable bar-pi
```

### Touchscreen Kiosk Notes

When touchscreen mode is enabled, the Pi auto-logs in on `tty1`, starts the Wayfire compositor via `~/.bashrc`, and launches Chromium in kiosk mode using `~/.config/wayfire.ini`.

- **Restart the UI:** `pkill -f wayfire` (or reboot)
- **Adjust display/autostart settings:** Edit `~/.config/wayfire.ini`
- **Chromium profile directory:** `~/.config/chromium-profile/`

---

## Updating & Backing Up

### Backing Up Your Data

All application data is stored in `/opt/bar-pi` by default:
- `/opt/bar-pi/cocktailpi-data.db` — SQLite database (recipes, ingredients, pumps, users, settings)
- `/opt/bar-pi/images/` — Uploaded recipe and ingredient images
- `/opt/bar-pi/.env` — Environment configuration

To create a clean backup:

```bash
sudo systemctl stop bar-pi
mkdir -p ~/bar-pi-backup
cp /opt/bar-pi/cocktailpi-data.db ~/bar-pi-backup/
cp -r /opt/bar-pi/images ~/bar-pi-backup/ 2>/dev/null || true
cp /opt/bar-pi/.env ~/bar-pi-backup/
sudo systemctl start bar-pi
```

### Automatic Updates

The backend can update itself from [GitHub Releases](https://github.com/ManfredRichthofen/Bar-Pi/releases). Admins manage this under **Settings → Updates**:

- **Automatic checks** — look for a new release every 6 hours (on by default).
- **Install automatically** — download and install new releases without asking (off by default).
- **Install window** — only auto-install between the chosen hours (default 03:00–05:00, local time).
- **Include pre-releases** — also offer beta / release-candidate versions.

You can also press **Update Now** at any time. The updater downloads the binary matching your build (`bundle` or `server`) and CPU architecture, verifies it against the release's `SHA256SUMS`, swaps it in place (keeping the previous binary as `bar-pi-server.bak` until the new one has run for a minute), and restarts. Updates are never installed while a cocktail is being prepared, and your `.env`, database and images are left untouched.

Requirements and notes:
- Only release builds on Linux can self-update; development builds show the latest version but cannot install it.
- The service user must be able to write to the install directory. The default systemd unit from `install-go.sh` already allows this (`ReadWritePaths=/opt/bar-pi`).
- Set `APP_DISABLE_UPDATER=true` to turn the updater off entirely. Set `GITHUB_TOKEN` if you hit GitHub API rate limits, and `APP_UPDATER_REPO` to update from a fork.

### Updating Bar-Pi Manually

To update to the latest release, simply re-run `install-go.sh`:

```bash
sudo systemctl stop bar-pi
./install-go.sh
```

The installer will replace `/opt/bar-pi/bar-pi-server` with the new binary while preserving your existing `/opt/bar-pi/.env`, `cocktailpi-data.db`, and `images/` directory. Database migrations run automatically on startup.

---

## Advanced Configuration

Configuration lives in `/opt/bar-pi/.env`:

| Variable                  | Default                    | Description                                                                        |
| ------------------------- | -------------------------- | ---------------------------------------------------------------------------------- |
| `SERVER_PORT`             | `8080`                     | HTTP server port                                                                   |
| `DATABASE_PATH`           | `cocktailpi-data.db`       | Path to SQLite database file                                                       |
| `JWT_SECRET`              | _(auto-generated)_         | Secret key used to sign JWT tokens                                                 |
| `JWT_EXPIRATION`          | `24h`                      | JWT token validity duration                                                        |
| `SERVER_READ_TIMEOUT`     | `15s`                      | HTTP read timeout                                                                  |
| `SERVER_WRITE_TIMEOUT`    | `15s`                      | HTTP write timeout                                                                 |
| `SERVER_IDLE_TIMEOUT`     | `60s`                      | HTTP idle timeout                                                                  |
| `DATABASE_MAX_OPEN_CONNS` | `1`                        | Max open SQLite connections                                                        |
| `DATABASE_MAX_IDLE_CONNS` | `1`                        | Max idle SQLite connections                                                        |
| `APP_NAME`                | `CocktailPi`               | Application name reported by API                                                   |
| `APP_VERSION`             | _(build version)_          | Application version reported by API (the updater always uses the built-in version) |
| `APP_DISABLE_DONATION`    | `false`                    | Hide donation prompts                                                              |
| `APP_HIDE_PROJECT_LINKS`  | `false`                    | Hide external project links                                                        |
| `APP_DISABLE_UPDATER`     | `false`                    | Disable update checks and self-update entirely                                     |
| `APP_UPDATER_REPO`        | `ManfredRichthofen/Bar-Pi` | GitHub `owner/repo` the updater pulls releases from                                |
| `GITHUB_TOKEN`            | _(empty)_                  | Optional token to raise GitHub API rate limits for update checks                   |

### Changing the Port

1. Edit `/opt/bar-pi/.env` and update `SERVER_PORT=3000`.
2. Restart the service: `sudo systemctl restart bar-pi`.
3. If using the **Touchscreen UI**, also update the URL (`http://localhost:3000`) in `~/.config/wayfire.ini` and restart Wayfire.

### Custom Database Location

1. Create the directory and set ownership:

   ```bash
   sudo mkdir -p /var/lib/bar-pi
   sudo chown $USER:$USER /var/lib/bar-pi
   ```
2. Edit `/opt/bar-pi/.env` and set:

   ```env
   DATABASE_PATH=/var/lib/bar-pi/cocktailpi-data.db
   ```
3. Because the systemd service runs with `ProtectSystem=strict`, grant write access to the new path in `/etc/systemd/system/bar-pi.service`:

   ```ini
   ReadWritePaths=/opt/bar-pi /var/lib/bar-pi
   ```
4. Reload and restart:

   ```bash
   sudo systemctl daemon-reload
   sudo systemctl restart bar-pi
   ```

### Network & Hostname Access (mDNS)

Bar-Pi binds to all network interfaces (`0.0.0.0`) by default. To access your Pi via hostname (e.g., `http://raspberrypi.local:8080` or `http://barpi.local:8080`), ensure `avahi-daemon` is installed and running:

```bash
sudo apt install avahi-daemon
sudo systemctl enable --now avahi-daemon
```

---

## Troubleshooting

### Service Won't Start

Check the service logs first:

```bash
sudo journalctl -u bar-pi -n 50 --no-pager
```

Common causes and fixes:

```bash
sudo lsof -i :8080                     # Check if another process is using port 8080
sudo chown -R $USER:$USER /opt/bar-pi  # Fix directory ownership
chmod +x /opt/bar-pi/bar-pi-server     # Ensure binary is executable
chmod 600 /opt/bar-pi/.env             # Ensure config is readable by service user
```

### Can't Access the Web Interface

1. Verify the service is running: `sudo systemctl status bar-pi`
2. Test locally on the Pi: `curl http://localhost:8080/health`
3. Verify you installed the **Complete Bundle** (the **Standalone Backend** only serves `/api/` and `/health`, not the web UI).
4. If connecting from another device, check your Pi's IP (`hostname -I`) and firewall rules:

   ```bash
   sudo ufw status
   sudo ufw allow 8080/tcp
   ```

### GPIO / Pumps Not Responding

Bar-Pi accesses `/dev/gpiochip0` on Linux. Ensure the user running the service belongs to the `gpio` group:

```bash
groups $USER
sudo usermod -aG gpio $USER
sudo systemctl restart bar-pi
```

### Database Locked or Corrupted

SQLite runs in WAL (`Write-Ahead Logging`) mode. If you see database lock errors, ensure only one `bar-pi-server` process is running:

```bash
ps aux | grep bar-pi-server
```

To reset a corrupted database, **stop the service first** and remove the `.db`, `.db-wal`, and `.db-shm` files:

```bash
sudo systemctl stop bar-pi
cp /opt/bar-pi/cocktailpi-data.db ~/cocktailpi-data.db.backup
rm -f /opt/bar-pi/cocktailpi-data.db /opt/bar-pi/cocktailpi-data.db-wal /opt/bar-pi/cocktailpi-data.db-shm
sudo systemctl start bar-pi
```

### Memory Issues on Low-RAM Pis

Check memory usage with `free -h`. On 512MB/1GB Pis running Chromium kiosk mode, increasing swap can prevent out-of-memory crashes:

```bash
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile  # Set CONF_SWAPSIZE=1024 or 2048
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

---

## Uninstalling Bar-Pi

### Automated Uninstall (Recommended)

You can uninstall using the installer flag or the standalone uninstall script. It will stop and remove the systemd service, offer to back up your database and images, delete `/opt/bar-pi`, and clean up any Wayfire/touchscreen configuration:

```bash
./install-go.sh --uninstall
```

Or download and run `uninstall.sh` directly:

```bash
curl -L https://raw.githubusercontent.com/ManfredRichthofen/Bar-Pi/main/scripts/install/uninstall.sh -o uninstall.sh
chmod +x uninstall.sh
./uninstall.sh
```

### Manual Uninstall

If you prefer to remove everything manually:

```bash
sudo systemctl stop bar-pi
sudo systemctl disable bar-pi
sudo rm -f /etc/systemd/system/bar-pi.service
sudo systemctl daemon-reload
sudo rm -rf /opt/bar-pi
```

If you configured the touchscreen UI, also clean up:

```bash
rm -rf ~/.config/wayfire.ini ~/.config/chromium-profile
sed -i '/# Start wayfire on tty1/,/fi/d' ~/.bashrc
```

Optionally remove touchscreen packages:

```bash
sudo apt remove chromium rpi-chromium-mods wayfire seatd xdg-user-dirs jq
```

---

## Security Checklist

Before exposing Bar-Pi outside a trusted home network:

1. Change the default `admin` / `admin` password immediately.
2. Verify `/opt/bar-pi/.env` has a strong `JWT_SECRET` and restricted file permissions (`chmod 600 /opt/bar-pi/.env`).
3. Place Bar-Pi behind a reverse proxy (e.g., Caddy or Nginx) with HTTPS/TLS enabled.
4. Keep Raspberry Pi OS updated (`sudo apt update && sudo apt upgrade`).
5. Back up `/opt/bar-pi/cocktailpi-data.db` and `/opt/bar-pi/images/` regularly.

## Getting Help

- **Report issues:** [GitHub Issues](https://github.com/ManfredRichthofen/Bar-Pi/issues)
- **Main repository:** [ManfredRichthofen/Bar-Pi](https://github.com/ManfredRichthofen/Bar-Pi)
- **Original CocktailPi project:** [alex9849/CocktailPi](https://github.com/alex9849/CocktailPi)
