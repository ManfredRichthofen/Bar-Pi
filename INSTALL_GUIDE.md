# Bar-Pi Go Backend Installation Guide

This guide provides detailed instructions for installing the Bar-Pi Go backend using the automated installation script.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Installation](#quick-installation)
- [Installation Options](#installation-options)
- [Step-by-Step Guide](#step-by-step-guide)
- [Post-Installation](#post-installation)
- [Troubleshooting](#troubleshooting)
- [Uninstallation](#uninstallation)

## Prerequisites

### Hardware Requirements

- **Raspberry Pi** (recommended: Pi 4 or newer)
  - Supported architectures: ARM (32-bit), ARM64 (64-bit), AMD64
- **Storage**: At least 500MB free space
- **RAM**: Minimum 512MB (1GB+ recommended)
- **Network**: Internet connection for downloading packages

### Software Requirements

- **Operating System**: Raspberry Pi OS (Debian-based Linux)
- **User**: Non-root user with sudo privileges
- **Internet**: Active connection for package downloads

### Optional (for Touchscreen UI)

- **Display**: HDMI monitor or touchscreen
- **Input**: Touch capability or mouse/keyboard

## Quick Installation

For a standard installation with all defaults:

```bash
# Download the installer
curl -L https://raw.githubusercontent.com/ManfredRichthofen/Bar-Pi/main/scripts/install/install-go.sh -o install-go.sh

# Make executable
chmod +x install-go.sh

# Run installer (do NOT use sudo)
./install-go.sh
```

**Note**: The script will prompt for sudo when needed. Do not run the entire script as root.

## Installation Options

The installer provides several configuration options:

### 1. Build Type Selection

**Option 1: Standalone Backend**
- API-only server
- Smaller binary size (~15-25MB)
- Requires separate frontend deployment
- Ideal for custom frontend or API-only usage

**Option 2: Complete Bundle** (Recommended)
- Backend + embedded frontend
- Single binary deployment (~30-40MB)
- Frontend served automatically
- Easiest setup for complete system

### 2. Touchscreen UI Setup (Bundle Only)

**Option 1: No Touchscreen**
- API access only
- Access via web browser from another device
- Minimal system resources

**Option 2: Touchscreen without Keyboard**
- Chromium in kiosk mode
- Full-screen web interface
- No on-screen keyboard
- Best for touch-only navigation

**Option 3: Touchscreen with Keyboard**
- Chromium in kiosk mode
- Full-screen web interface
- Chrome on-screen keyboard extension
- Requires screen connected during installation

### 3. Installation Source

**Option 1: Latest Release** (Recommended)
- Automatically downloads newest version
- Ensures latest features and fixes

**Option 2: Specific Version**
- Install a particular release
- Format: `v0.3.1` or `backend-v0.3.1`
- Useful for version pinning

**Option 3: Local Binary**
- Use a pre-downloaded binary
- Provide full path to binary file
- Useful for offline installations

### 4. Service Configuration

**Enable Systemd Service**: Recommended
- Auto-start on boot
- Automatic restart on failure
- Easy service management

**Start Service Now**: Recommended
- Immediately starts the application
- Verifies installation success

## Step-by-Step Guide

### Step 1: Download the Installer

```bash
curl -L https://raw.githubusercontent.com/ManfredRichthofen/Bar-Pi/main/scripts/install/install-go.sh -o install-go.sh
```

**Alternative**: Download via browser and transfer to Raspberry Pi using SCP:
```bash
scp install-go.sh pi@raspberrypi.local:~/
```

### Step 2: Make Executable

```bash
chmod +x install-go.sh
```

### Step 3: Run the Installer

```bash
./install-go.sh
```

**Important**: Do NOT use `sudo` to run the script. It will request sudo privileges when needed.

### Step 4: Follow the Prompts

#### Architecture Detection
The script automatically detects your system architecture:
- ARM (32-bit) - Raspberry Pi OS 32-bit
- ARM64 (64-bit) - Raspberry Pi OS 64-bit
- AMD64 - x86_64 systems

#### Build Type
```
Select the build type to install:

  1) Standalone Backend (API-only, no embedded frontend)
  2) Complete Bundle (Backend + Embedded Frontend)

Enter your choice (1 or 2):
```

**Recommendation**: Choose **2** for a complete system.

#### Touchscreen UI (if Bundle selected)
```
Setup touchscreen UI?
  1) No touchscreen (API only)
  2) Touchscreen without on-screen keyboard
  3) Touchscreen with on-screen keyboard

Enter your choice (1, 2, or 3):
```

**Recommendations**:
- Choose **1** if accessing via network from another device
- Choose **2** for basic touchscreen with external keyboard
- Choose **3** for full touchscreen-only operation

#### Installation Source
```
Select installation source:
  1) Latest release from GitHub
  2) Specify a version tag
  3) Use local binary file

Enter your choice (1, 2, or 3):
```

**Recommendation**: Choose **1** for latest version.

#### Service Setup
```
Enable systemd service? (y/n):
```

**Recommendation**: Enter **y** to enable auto-start.

```
Start Bar-Pi service? (y/n):
```

**Recommendation**: Enter **y** to start immediately.

### Step 5: Verify Installation

After installation completes, verify the service is running:

```bash
sudo systemctl status bar-pi
```

You should see:
```
● bar-pi.service - Bar-Pi Cocktail Machine Backend
   Loaded: loaded (/etc/systemd/system/bar-pi.service; enabled)
   Active: active (running) since ...
```

## Post-Installation

### Access the Application

**Web Interface** (Bundle only):
```
http://localhost:8080
http://<raspberry-pi-ip>:8080
```

**API Endpoint**:
```
http://localhost:8080/api/
```

**Health Check**:
```bash
curl http://localhost:8080/health
```

### Default Credentials

- **Username**: `admin`
- **Password**: `admin`

**⚠️ IMPORTANT**: Change the default password immediately after first login!

### Change JWT Secret

Edit the configuration file:
```bash
sudo nano /opt/bar-pi/.env
```

Change the `JWT_SECRET` line:
```
JWT_SECRET=your-secure-random-secret-here
```

Generate a secure secret:
```bash
openssl rand -base64 32
```

Restart the service:
```bash
sudo systemctl restart bar-pi
```

### Service Management

**Start the service**:
```bash
sudo systemctl start bar-pi
```

**Stop the service**:
```bash
sudo systemctl stop bar-pi
```

**Restart the service**:
```bash
sudo systemctl restart bar-pi
```

**Check status**:
```bash
sudo systemctl status bar-pi
```

**View logs**:
```bash
sudo journalctl -u bar-pi -f
```

**View last 100 lines**:
```bash
sudo journalctl -u bar-pi -n 100
```

**Disable auto-start**:
```bash
sudo systemctl disable bar-pi
```

**Enable auto-start**:
```bash
sudo systemctl enable bar-pi
```

### Touchscreen Configuration

If you installed the touchscreen UI, the system will:
- Auto-login on boot
- Start Wayfire compositor
- Launch Chromium in kiosk mode
- Display the Bar-Pi interface full-screen

**Restart touchscreen UI**:
```bash
pkill -f wayfire
# It will auto-restart on next login or reboot
```

**Modify Chromium zoom level**:
Edit the wayfire config:
```bash
nano ~/.config/wayfire.ini
```

## Troubleshooting

### Service Won't Start

**Check logs**:
```bash
sudo journalctl -u bar-pi -n 50
```

**Common issues**:
- Port 8080 already in use
- Database file permissions
- Missing JWT_SECRET

**Solution**:
```bash
# Check what's using port 8080
sudo lsof -i :8080

# Fix permissions
sudo chown -R $USER:$USER /opt/bar-pi

# Verify .env file exists
ls -la /opt/bar-pi/.env
```

### Cannot Access Web Interface

**Check service status**:
```bash
sudo systemctl status bar-pi
```

**Test locally**:
```bash
curl http://localhost:8080/health
```

**Check firewall** (if applicable):
```bash
sudo ufw status
sudo ufw allow 8080/tcp
```

**Find Raspberry Pi IP**:
```bash
hostname -I
```

### Touchscreen Not Working

**Verify Wayfire is running**:
```bash
ps aux | grep wayfire
```

**Check Wayfire config**:
```bash
cat ~/.config/wayfire.ini
```

**Restart Wayfire**:
```bash
pkill -f wayfire
# Log out and back in, or reboot
```

**Check Chromium profile**:
```bash
ls -la ~/.config/chromium-profile/
```

### Database Errors

**Database locked**:
- Ensure only one instance is running
- Check for zombie processes: `ps aux | grep bar-pi`
- Kill old processes: `sudo pkill bar-pi`

**Corrupted database**:
```bash
# Backup current database
sudo cp /opt/bar-pi/cocktailpi-data.db /opt/bar-pi/cocktailpi-data.db.backup

# Remove and restart (will create fresh database)
sudo rm /opt/bar-pi/cocktailpi-data.db
sudo systemctl restart bar-pi
```

### Permission Errors

**Fix ownership**:
```bash
sudo chown -R $USER:$USER /opt/bar-pi
```

**Fix permissions**:
```bash
chmod +x /opt/bar-pi/bar-pi-server
chmod 644 /opt/bar-pi/.env
```

### Out of Memory

**Check memory usage**:
```bash
free -h
```

**Increase swap** (if needed):
```bash
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile
# Change CONF_SWAPSIZE to 1024 or 2048
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

## Uninstallation

To completely remove Bar-Pi:

```bash
# Stop and disable service
sudo systemctl stop bar-pi
sudo systemctl disable bar-pi

# Remove service file
sudo rm /etc/systemd/system/bar-pi.service
sudo systemctl daemon-reload

# Remove installation directory
sudo rm -rf /opt/bar-pi

# Remove touchscreen config (if installed)
rm -rf ~/.config/wayfire.ini
rm -rf ~/.config/chromium-profile

# Remove wayfire from .bashrc
nano ~/.bashrc
# Delete the wayfire section manually

# Uninstall packages (optional)
sudo apt remove chromium wayfire seatd xdg-user-dirs jq
```

## Advanced Configuration

### Custom Port

Edit `/opt/bar-pi/.env`:
```bash
SERVER_PORT=3000
```

Restart service:
```bash
sudo systemctl restart bar-pi
```

### Custom Database Location

Edit `/opt/bar-pi/.env`:
```bash
DB_PATH=/var/lib/bar-pi/data.db
```

Create directory and set permissions:
```bash
sudo mkdir -p /var/lib/bar-pi
sudo chown $USER:$USER /var/lib/bar-pi
```

### CORS Configuration

Edit `/opt/bar-pi/.env`:
```bash
CORS_ALLOWED_ORIGINS=http://example.com,http://localhost:3000
```

### Network Access

The server binds to all interfaces by default. Access from other devices:
```
http://<raspberry-pi-ip>:8080
```

For hostname access (e.g., `http://barpi.local:8080`), configure mDNS:
```bash
sudo apt install avahi-daemon
sudo systemctl enable avahi-daemon
sudo systemctl start avahi-daemon
```

## Support

- **GitHub Issues**: https://github.com/ManfredRichthofen/Bar-Pi/issues
- **Documentation**: https://github.com/ManfredRichthofen/Bar-Pi
- **Original Project**: https://github.com/alex9849/CocktailPi

## Security Best Practices

1. **Change default password** immediately
2. **Set strong JWT_SECRET** (32+ random characters)
3. **Keep system updated**: `sudo apt update && sudo apt upgrade`
4. **Restrict CORS** in production environments
5. **Use HTTPS** with reverse proxy (nginx/caddy) for production
6. **Regular backups** of database file
7. **Monitor logs** for suspicious activity

## License

See the main project LICENSE file.
