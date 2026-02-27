# Installing Bar-Pi

This guide walks you through installing the Bar-Pi Go backend on your Raspberry Pi.

## What You'll Need

**Hardware:**
- Raspberry Pi (Pi 4 or newer recommended) Any other Linux device should work as well
- At least 500MB free storage
- 512MB RAM minimum (1GB or more is better)
- Internet connection for downloads

**Software:**
- Raspberry Pi OS or similar Debian-based Linux
- A regular user account with sudo privileges
- Active internet connection

If you're setting up a touchscreen interface, you'll also need a display and either touch capability or a keyboard and mouse.

## Quick Start

If you just want to get Bar-Pi running with sensible defaults:

```bash
curl -L https://raw.githubusercontent.com/ManfredRichthofen/Bar-Pi/main/scripts/install/install-go.sh -o install-go.sh
chmod +x install-go.sh
./install-go.sh
```

Don't run this with sudo. The script will ask for elevated privileges when it needs them.

### Build Type

**Standalone Backend** gives you just the API server. It's smaller (15-25MB) and useful if you're building your own frontend or only need API access.

**Complete Bundle** includes both backend and frontend in one binary (30-40MB). This is what most people want. The frontend is served automatically, and everything works out of the box.

### Touchscreen Setup

Only relevant if you chose the complete bundle:

**No Touchscreen** means you'll access Bar-Pi from another device's web browser. Lightest on system resources.

**Touchscreen without Keyboard** sets up Chromium in kiosk mode for a full-screen interface. Good if you have a physical keyboard available or don't need text input.

**Touchscreen with Keyboard** adds an on-screen keyboard extension. Choose this for a fully standalone touchscreen setup. You'll need the screen connected during installation.

### Installation Source

**Latest Release** downloads the newest version automatically. This is usually what you want.

**Specific Version** lets you pin to a particular release like `v0.3.1`.

**Local Binary** uses a file you've already downloaded. Helpful for offline installations or custom builds.

### Service Configuration

**Enable Systemd Service** makes Bar-Pi start automatically on boot and restart if it crashes.

**Start Service Now** launches Bar-Pi immediately after installation so you can verify everything works.

## Installation Walkthrough

### Download and Run

Get the installer:

```bash
curl -L https://raw.githubusercontent.com/ManfredRichthofen/Bar-Pi/main/scripts/install/install-go.sh -o install-go.sh
chmod +x install-go.sh
./install-go.sh
```

If you prefer, download it in a browser and transfer via SCP: `scp install-go.sh pi@raspberrypi.local:~/`

Don't use sudo to run the script. It will ask for privileges when needed.

### Answer the Prompts

The installer detects your system architecture automatically (ARM 32-bit, ARM64, or AMD64) and then asks a few questions:

**Build type:** Choose Complete Bundle unless you specifically need just the API.

**Touchscreen setup:** Pick option 1 if you're accessing from another device, option 2 if you have a physical keyboard, or option 3 for a fully standalone touchscreen.

**Installation source:** Option 1 (Latest release) is usually best.

**Service configuration:** Say yes to both enabling the service and starting it now.

### Verify It Worked

Check that the service is running:

```bash
sudo systemctl status bar-pi
```

You should see "active (running)" in the output.

## After Installation

### Accessing Bar-Pi

Open a browser and go to:
- `http://localhost:8080` (from the Pi itself)
- `http://<raspberry-pi-ip>:8080` (from another device)

The API is available at `http://localhost:8080/api/` and you can check health with `curl http://localhost:8080/health`.

### Security First

Log in with username `admin` and password `admin`, then immediately change the password.

You should also set a strong JWT secret. Edit `/opt/bar-pi/.env`:

```bash
sudo nano /opt/bar-pi/.env
```

Generate a random secret and replace the JWT_SECRET line:

```bash
openssl rand -base64 32
```

Then restart:

```bash
sudo systemctl restart bar-pi
```

### Managing the Service

Standard systemd commands control Bar-Pi:

```bash
sudo systemctl start bar-pi      # Start
sudo systemctl stop bar-pi       # Stop
sudo systemctl restart bar-pi    # Restart
sudo systemctl status bar-pi     # Check status
sudo journalctl -u bar-pi -f     # Watch logs
sudo journalctl -u bar-pi -n 100 # Last 100 log lines
```

To disable automatic startup: `sudo systemctl disable bar-pi`

### Touchscreen Notes

If you set up the touchscreen UI, the system auto-logs in, starts the Wayfire compositor, and launches Chromium in kiosk mode showing Bar-Pi full-screen.

To restart the UI: `pkill -f wayfire` (it will restart on next login or reboot)

To adjust zoom: edit `~/.config/wayfire.ini`

## When Things Go Wrong

### Service Won't Start

Check the logs first:

```bash
sudo journalctl -u bar-pi -n 50
```

Common culprits are port 8080 being occupied, permission issues, or a missing JWT_SECRET. Fix them:

```bash
sudo lsof -i :8080                    # See what's using port 8080
sudo chown -R $USER:$USER /opt/bar-pi # Fix ownership
ls -la /opt/bar-pi/.env               # Verify config exists
```

### Can't Access the Web Interface

Verify the service is running: `sudo systemctl status bar-pi`

Test locally: `curl http://localhost:8080/health`

If you're accessing from another device, find your Pi's IP with `hostname -I` and check your firewall:

```bash
sudo ufw status
sudo ufw allow 8080/tcp
```

### Touchscreen Issues

Make sure Wayfire is running: `ps aux | grep wayfire`

Restart it if needed: `pkill -f wayfire` then log out and back in.

Check the config at `~/.config/wayfire.ini` and the Chromium profile at `~/.config/chromium-profile/`.

### Database Problems

If the database is locked, ensure only one instance is running. Check for zombies with `ps aux | grep bar-pi` and kill them with `sudo pkill bar-pi`.

For a corrupted database, back it up and start fresh:

```bash
sudo cp /opt/bar-pi/cocktailpi-data.db /opt/bar-pi/cocktailpi-data.db.backup
sudo rm /opt/bar-pi/cocktailpi-data.db
sudo systemctl restart bar-pi
```

### Permission Errors

Fix ownership and permissions:

```bash
sudo chown -R $USER:$USER /opt/bar-pi
chmod +x /opt/bar-pi/bar-pi-server
chmod 644 /opt/bar-pi/.env
```

### Memory Issues

Check usage with `free -h`. If you need more swap:

```bash
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile  # Set CONF_SWAPSIZE to 1024 or 2048
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

## Removing Bar-Pi

To completely uninstall:

```bash
sudo systemctl stop bar-pi
sudo systemctl disable bar-pi
sudo rm /etc/systemd/system/bar-pi.service
sudo systemctl daemon-reload
sudo rm -rf /opt/bar-pi
```

If you installed the touchscreen UI, also remove:

```bash
rm -rf ~/.config/wayfire.ini
rm -rf ~/.config/chromium-profile
nano ~/.bashrc  # Delete the wayfire section
```

Optionally remove packages: `sudo apt remove chromium wayfire seatd xdg-user-dirs jq`

## Advanced Configuration

### Changing the Port

Edit `/opt/bar-pi/.env` and set `SERVER_PORT=3000`, then restart: `sudo systemctl restart bar-pi`

### Custom Database Location

Set `DB_PATH=/var/lib/bar-pi/data.db` in `/opt/bar-pi/.env`, create the directory, and set ownership:

```bash
sudo mkdir -p /var/lib/bar-pi
sudo chown $USER:$USER /var/lib/bar-pi
```

### CORS Settings

Edit `/opt/bar-pi/.env` and set: `CORS_ALLOWED_ORIGINS=http://example.com,http://localhost:3000`

### Network Access

Bar-Pi binds to all interfaces by default. Access from other devices using `http://<raspberry-pi-ip>:8080`.

For hostname access like `http://barpi.local:8080`, install and enable mDNS:

```bash
sudo apt install avahi-daemon
sudo systemctl enable avahi-daemon
sudo systemctl start avahi-daemon
```

## Security Checklist

Before exposing Bar-Pi to a network:

1. Change the default admin password
2. Set a strong JWT_SECRET (32+ random characters)
3. Keep your system updated: `sudo apt update && sudo apt upgrade`
4. Configure CORS appropriately for your environment
5. Use a reverse proxy with HTTPS for production deployments
6. Back up your database regularly
7. Monitor logs for unusual activity

## Getting Help

Report issues at https://github.com/ManfredRichthofen/Bar-Pi/issues

Check the main documentation at https://github.com/ManfredRichthofen/Bar-Pi

See the original CocktailPi project at https://github.com/alex9849/CocktailPi
