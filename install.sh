#!/bin/bash

# Function to show usage
show_usage() {
    echo "Usage: $0 [--frontend <barpi|cocktailpi>]"
    echo "Options:"
    echo "  --frontend    Select which frontend to use (barpi or cocktailpi)"
    echo "  --help        Show this help message"
    exit 1
}

# Parse command line arguments
FRONTEND="barpi"  # Default frontend
while [[ $# -gt 0 ]]; do
    case $1 in
        --frontend)
            FRONTEND="$2"
            if [[ "$FRONTEND" != "barpi" && "$FRONTEND" != "cocktailpi" ]]; then
                echo "Error: Frontend must be either 'barpi' or 'cocktailpi'"
                show_usage
            fi
            shift 2
            ;;
        --help)
            show_usage
            ;;
        *)
            echo "Unknown option: $1"
            show_usage
            ;;
    esac
done

# Bar-Pi Installation Script
echo "Starting Bar-Pi installation..."

# Update system packages
echo "Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install required dependencies for Tauri
echo "Installing system dependencies..."
sudo apt-get install -y \
    curl \
    jq \
    wget \
    libwebkit2gtk-4.1-0 \
    libgtk-3-0 \
    libayatana-appindicator3-1 \
    xdotool \
    build-essential \
    libssl-dev \
    libgtk-3-dev \
    libwebkit2gtk-4.1-dev \
    librsvg2-dev \
    patchelf

if [ "$FRONTEND" = "barpi" ]; then
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
fi

# Remove any existing autostart entries
rm -f ~/.config/autostart/bar-pi.desktop
rm -f ~/.config/autostart/cocktailpi-frontend.desktop

# Configure autostart with fullscreen based on selected frontend
mkdir -p ~/.config/autostart
if [ "$FRONTEND" = "barpi" ]; then
    cat > ~/.config/autostart/bar-pi.desktop << EOL
[Desktop Entry]
Type=Application
Name=Bar-Pi
Exec=bar-pi
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
EOL
else
    cat > ~/.config/autostart/cocktailpi-frontend.desktop << EOL
[Desktop Entry]
Type=Application
Name=CocktailPi Frontend
Exec=bash -c 'sleep 5 && chromium-browser http://localhost:8080 --kiosk --noerrdialogs --disable-component-update'
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
EOL
fi

# Update wayfire configuration if it exists
if [ -f ~/.config/wayfire.ini ]; then
    echo "Updating wayfire configuration..."
    # Backup original config
    cp ~/.config/wayfire.ini ~/.config/wayfire.ini.backup
    if [ "$FRONTEND" = "barpi" ]; then
        # Remove chromium line for Bar-Pi (since it's a Tauri app)
        sed -i '/chromium =/d' ~/.config/wayfire.ini
    else
        # Update chromium line to use CocktailPi frontend
        sed -i '/chromium =/c\chromium = chromium-browser http://localhost:8080 --kiosk --noerrdialogs --disable-component-update --check-for-update-interval=31536000 --disable-infobars --no-first-run --ozone-platform=wayland --enable-features=OverlayScrollbar --disable-features=OverscrollHistoryNavigation --start-maximized --force-device-scale-factor=1.0' ~/.config/wayfire.ini
    fi
fi

if [ "$FRONTEND" = "barpi" ]; then
    # Create systemd service for Bar-Pi
    echo "Creating Bar-Pi service..."
    sudo tee /etc/systemd/system/bar-pi.service > /dev/null << EOL
[Unit]
Description=Bar-Pi Drink Dispensing System Frontend
After=network.target cocktailpi.service
Requires=cocktailpi.service

[Service]
Type=simple
User=pi
Environment=DISPLAY=:0
Environment=XAUTHORITY=/home/pi/.Xauthority
Environment=WAYLAND_DISPLAY=wayland-1
ExecStart=/usr/bin/bar-pi
Restart=always

[Install]
WantedBy=graphical.target
EOL

    # Enable and start Bar-Pi service
    sudo systemctl enable bar-pi.service
    sudo systemctl start bar-pi.service
else
    # Disable Bar-Pi service if it exists
    if systemctl is-enabled bar-pi.service &>/dev/null; then
        sudo systemctl stop bar-pi.service
        sudo systemctl disable bar-pi.service
    fi
fi

# Set up GPIO permissions (if needed)
sudo usermod -a -G gpio pi

# Create frontend switching script
sudo tee /usr/local/bin/switch-frontend << EOL
#!/bin/bash
if [ "\$1" != "barpi" ] && [ "\$1" != "cocktailpi" ]; then
    echo "Usage: switch-frontend <barpi|cocktailpi>"
    exit 1
fi

# Run the installation script with the selected frontend
bash $(pwd)/install.sh --frontend \$1
echo "Frontend switched to \$1. Please reboot for changes to take effect."
EOL

sudo chmod +x /usr/local/bin/switch-frontend

echo "Installation complete!"
echo "Current frontend: $FRONTEND"
echo "Please reboot your Raspberry Pi for changes to take effect."
echo ""
echo "To switch frontends, use: switch-frontend <barpi|cocktailpi>"
echo ""
if [ "$FRONTEND" = "barpi" ]; then
    echo "To check the frontend service status: sudo systemctl status bar-pi"
fi
echo "To check the backend service status: sudo systemctl status cocktailpi"
if [ "$FRONTEND" = "barpi" ]; then
    echo "To view frontend logs: journalctl -u bar-pi"
fi
echo "To view backend logs: journalctl -u cocktailpi" 