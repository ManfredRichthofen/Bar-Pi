#!/bin/bash

# Bar-Pi Installation Script
echo "Starting Bar-Pi installation..."

# Update system packages
echo "Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install required dependencies
echo "Installing system dependencies..."
sudo apt-get install -y \
    curl \
    jq \
    wget \
    libwebkit2gtk-4.1-0 \
    libgtk-3-0 \
    libayatana-appindicator3-1 \
    xdotool

# Create installation directory
mkdir -p ~/bar-pi
cd ~/bar-pi

# Download latest release
echo "Downloading latest Bar-Pi release..."
LATEST_DEB=$(curl -s https://api.github.com/repos/ManfredRichthofen/Bar-Pi/releases/latest | \
    jq -r '.assets[] | select(.name | endswith("arm64.deb")) | .browser_download_url')

if [ -z "$LATEST_DEB" ]; then
    echo "Error: Could not find the latest arm64 .deb release"
    exit 1
fi

wget "$LATEST_DEB" -O bar-pi.deb

# Install the package
echo "Installing Bar-Pi..."
sudo dpkg -i bar-pi.deb
sudo apt-get install -f -y

# Configure autostart with fullscreen
mkdir -p ~/.config/autostart
cat > ~/.config/autostart/bar-pi.desktop << EOL
[Desktop Entry]
Type=Application
Name=Bar-Pi
Exec=bash -c 'sleep 5 && bar-pi & sleep 2 && xdotool search --sync --onlyvisible --class "bar-pi" windowsize 100% 100%'
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
EOL

# Enable desktop environment auto-login
echo "Configuring auto-login..."
sudo raspi-config nonint do_boot_behaviour B4

# Create systemd service for auto-start
echo "Creating systemd service..."
sudo tee /etc/systemd/system/bar-pi.service > /dev/null << EOL
[Unit]
Description=Bar-Pi Drink Dispensing System
After=network.target

[Service]
Type=simple
User=pi
Environment=DISPLAY=:0
Environment=XAUTHORITY=/home/pi/.Xauthority
ExecStart=/usr/bin/bar-pi
Restart=always

[Install]
WantedBy=graphical.target
EOL

# Enable and start the service
sudo systemctl enable bar-pi.service
sudo systemctl start bar-pi.service

# Set up GPIO permissions (if needed)
sudo usermod -a -G gpio pi

echo "Installation complete!"
echo "Please reboot your Raspberry Pi for changes to take effect."
echo "The system will automatically start Bar-Pi in fullscreen mode after reboot."
echo ""
echo "To check the service status: sudo systemctl status bar-pi"
echo "To view logs: journalctl -u bar-pi" 