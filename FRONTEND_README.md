# Installing Bar-Pi Frontend

This guide covers installing the Bar-Pi web frontend on your Raspberry Pi. The frontend installer is designed to be run with the original CocktailPi backend and be lightweight and minimal - it only downloads the static web files and serves them using Python's built-in HTTP server.

## When to Use This

Use the frontend-only installer when:
- You're running the backend separately (standalone build or different machine)
- You're setting up a dedicated display device that connects to a remote backend
- You need a lightweight web server for the Bar-Pi UI

**Note:** If you want both frontend and backend rewrite together, use the **Complete Bundle** option in `install-go.sh` instead. It's simpler and more efficient.

## What You'll Need

**Hardware:**
- Raspberry Pi (any model with network connectivity)
- At least 50MB free storage
- 128MB RAM minimum
- Internet connection for downloads

**Software:**
- Raspberry Pi OS or similar Debian-based Linux
- Python 3 (pre-installed on Raspberry Pi OS)
- A regular user account with sudo privileges
- Active internet connection

## Quick Start

If you just want to get the frontend running with defaults:

```bash
curl -L https://raw.githubusercontent.com/ManfredRichthofen/Bar-Pi/main/scripts/install/install-frontend.sh -o install-frontend.sh
chmod +x install-frontend.sh
./install-frontend.sh
```

Don't run this with sudo. The script will ask for elevated privileges when it needs them.

### Landing Page Choice

**Choice Page** shows a selection screen where users can choose between the original CocktailPi UI and the new Bar-Pi UI. This is useful during a migration period or if you want to maintain both interfaces.

**Direct to Bar-Pi** (recommended) immediately connects to the Bar-Pi UI without showing a choice screen. This is cleaner for new installations.

### Installation Directory

The frontend files are installed to `/home/pi/barpi` by default. The wait-for-app HTML files go to `/home/pi/wait-for-app-html`.

### Server Port

The frontend web server runs on port `5000` by default. You can change this if needed.

## Installation Walkthrough

### Download and Run

Get the installer:

```bash
curl -L https://raw.githubusercontent.com/ManfredRichthofen/Bar-Pi/main/scripts/install/install-frontend.sh -o install-frontend.sh
chmod +x install-frontend.sh
./install-frontend.sh
```

If you prefer, download it in a browser and transfer via SCP: `scp install-frontend.sh pi@raspberrypi.local:~/`

Don't use sudo to run the script. It will ask for privileges when needed.

### Answer the Prompts

The installer will ask:

**Landing page:** Choose option 2 (Direct to Bar-Pi) for new installations, or option 1 if you want the choice screen.

The installer will automatically:
- Detect the latest frontend version
- Download and extract the files
- Configure the landing page
- Set up a systemd service using Python's HTTP server
- Start the service automatically

### Verify It Worked

Check that the service is running:

```bash
sudo systemctl status barpi
```

You should see "active (running)" in the output.

## After Installation

### Accessing the Frontend

Open a browser and go to:
- `http://localhost:5000` (from the Pi itself)
- `http://<raspberry-pi-ip>:5000` (from another device)

**Important:** The frontend needs to connect to a backend server. Make sure you have the Bar-Pi backend running (either on the same Pi or a different machine).

### Configuring Backend Connection

The frontend will attempt to connect to the backend. If your backend is running on a different machine or port, you may need to configure the connection in the frontend settings.

### Managing the Service

Standard systemd commands control the frontend service:

```bash
sudo systemctl start barpi      # Start
sudo systemctl stop barpi       # Stop
sudo systemctl restart barpi    # Restart
sudo systemctl status barpi     # Check status
sudo journalctl -u barpi -f     # Watch logs
```

To disable automatic startup: `sudo systemctl disable barpi`

### Manual Start (No Service)

If you installed without the systemd service, you can start the frontend manually:

```bash
cd /home/pi/barpi
python3 -m http.server 5000
```

Or use the generated start script:

```bash
/home/pi/barpi/start-barpi.sh
```

## Command Line Options

For automated or customized installations:

```bash
# Install with custom port
./install-frontend.sh -p 8000

# Install specific version
./install-frontend.sh -v 0.3.1

# Skip prompts (use defaults)
./install-frontend.sh -y

# Custom directories
./install-frontend.sh -d /var/www/barpi -w /var/www/wait

# Direct to Bar-Pi landing page
./install-frontend.sh --html-choice only-new

# Choice landing page
./install-frontend.sh --html-choice choice

# Don't create systemd service
./install-frontend.sh --no-service

# Show all options
./install-frontend.sh --help
```

## When Things Go Wrong

### Service Won't Start

Check the logs first:

```bash
sudo journalctl -u barpi -n 50
```

Common issues are port 5000 being occupied or permission problems. Fix them:

```bash
sudo lsof -i :5000                      # See what's using port 5000
sudo chown -R $USER:$USER /home/pi/barpi # Fix ownership
```

### Can't Access the Web Interface

Verify the service is running: `sudo systemctl status barpi`

Test locally: `curl http://localhost:5000`

If you're accessing from another device, find your Pi's IP with `hostname -I` and check your firewall:

```bash
sudo ufw status
sudo ufw allow 5000/tcp
```

### Frontend Can't Connect to Backend

Make sure:
1. The backend is running and accessible
2. The backend API is reachable from the frontend
3. CORS is configured properly on the backend
4. Network connectivity between frontend and backend is working

Test backend connectivity:

```bash
curl http://localhost:8080/health  # If backend is on same machine
curl http://<backend-ip>:8080/health  # If backend is remote
```

### Permission Errors

Fix ownership and permissions:

```bash
sudo chown -R $USER:$USER /home/pi/barpi
sudo chown -R $USER:$USER /home/pi/wait-for-app-html
chmod 644 /home/pi/barpi/*
chmod 644 /home/pi/wait-for-app-html/*
```

### Python Not Found

Python 3 should be pre-installed on Raspberry Pi OS. If it's missing:

```bash
sudo apt update
sudo apt install python3
```

## Removing the Frontend

To completely uninstall:

```bash
./install-frontend.sh --uninstall
```

Or manually:

```bash
sudo systemctl stop barpi
sudo systemctl disable barpi
sudo rm /etc/systemd/system/barpi.service
sudo systemctl daemon-reload
sudo rm -rf /home/pi/barpi
sudo rm -rf /home/pi/wait-for-app-html
```

## Advanced Configuration

### Changing the Port

Edit the systemd service file:

```bash
sudo nano /etc/systemd/system/barpi.service
```

Change the port in the `ExecStart` line:

```
ExecStart=/usr/bin/python3 -m http.server 3000
```

Then reload and restart:

```bash
sudo systemctl daemon-reload
sudo systemctl restart barpi
```

### Custom Installation Directory

Use the `-d` flag during installation:

```bash
./install-frontend.sh -d /var/www/barpi
```

Or move the files manually and update the service:

```bash
sudo systemctl stop barpi
sudo mv /home/pi/barpi /var/www/barpi
sudo nano /etc/systemd/system/barpi.service  # Update WorkingDirectory
sudo systemctl daemon-reload
sudo systemctl start barpi
```

### Network Access

The Python HTTP server binds to all interfaces by default. Access from other devices using `http://<raspberry-pi-ip>:5000`.

For hostname access like `http://barpi.local:5000`, install and enable mDNS:

```bash
sudo apt install avahi-daemon
sudo systemctl enable avahi-daemon
sudo systemctl start avahi-daemon
```

### Using a Different Web Server

If you prefer a different web server, you can install the frontend files and serve them with:

**Nginx:**
```bash
sudo apt install nginx
sudo ln -s /home/pi/barpi /var/www/html/barpi
```

**Apache:**
```bash
sudo apt install apache2
sudo ln -s /home/pi/barpi /var/www/html/barpi
```

Then disable the Python service:
```bash
sudo systemctl stop barpi
sudo systemctl disable barpi
```

## Environment Variables

You can set these before running the installer:

```bash
export BAR_PI_INSTALL_DIR="/custom/path"
export BAR_PI_WAIT_DIR="/custom/wait/path"
export BAR_PI_PORT="8000"
export BAR_PI_SERVICE_NAME="barpi-frontend"
export BAR_PI_VERSION="0.3.1"
export BAR_PI_HTML_CHOICE="only-new"

./install-frontend.sh
```

## Updating the Frontend

To update to a new version:

```bash
# Download the latest installer
curl -L https://raw.githubusercontent.com/ManfredRichthofen/Bar-Pi/main/scripts/install/install-frontend.sh -o install-frontend.sh
chmod +x install-frontend.sh

# Run it (it will overwrite existing files)
./install-frontend.sh -y
```

Or specify a specific version:

```bash
./install-frontend.sh -v 0.4.0 -y
```

## Comparison with Bundle Install

| Feature | Frontend Only | Complete Bundle |
|---------|--------------|-----------------|
| Installation | Separate script | Part of install-go.sh |
| Dependencies | Python 3 only | None (embedded) |
| Ports | 5000 (frontend) + 8080 (backend) | 8080 (both) |
| Services | 2 (frontend + backend) | 1 (combined) |
| Memory Usage | ~30-40MB total | ~20-30MB total |
| Updates | Update separately | Update together |
| Use Case | Separate machines, dev work | Production, simplicity |

**Recommendation:** Use the Complete Bundle unless you specifically need separate frontend/backend installations.

## Getting Help

Report issues at https://github.com/ManfredRichthofen/Bar-Pi/issues

Check the main documentation at https://github.com/ManfredRichthofen/Bar-Pi

See the backend installation guide at `INSTALL_GUIDE.md`

See the original CocktailPi project at https://github.com/alex9849/CocktailPi
