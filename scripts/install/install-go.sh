#!/bin/bash

# Bar-Pi Go Backend Installer
# Installs the Bar-Pi backend and sets up autostart on Linux

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
GITHUB_REPO="ManfredRichthofen/Bar-Pi"
INSTALL_DIR="/opt/bar-pi"
SERVICE_NAME="bar-pi"
USER=$(whoami)

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Bar-Pi Go Backend Installer       ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    echo -e "${RED}Please do not run this script as root.${NC}"
    echo -e "${YELLOW}The script will prompt for sudo when needed.${NC}"
    exit 1
fi

# Detect architecture
ARCH=$(uname -m)
case $ARCH in
    x86_64)
        ARCH_SUFFIX="amd64"
        ARCH_NAME="Linux x86_64"
        ;;
    aarch64|arm64)
        ARCH_SUFFIX="arm64"
        ARCH_NAME="Raspberry Pi 64-bit"
        ;;
    armv7l|armv6l)
        ARCH_SUFFIX="arm"
        ARCH_NAME="Raspberry Pi 32-bit"
        ;;
    *)
        echo -e "${RED}Unsupported architecture: $ARCH${NC}"
        exit 1
        ;;
esac

echo -e "${GREEN}Detected architecture: $ARCH_NAME${NC}"
echo ""

# Select build type
echo -e "${BLUE}Select the build type to install:${NC}"
echo ""
echo "  1) Standalone Backend (API-only, no embedded frontend)"
echo "     - Smaller binary size"
echo "     - Deploy frontend separately"
echo "     - Ideal for custom frontend deployments"
echo ""
echo "  2) Complete Bundle (Backend + Embedded Frontend)"
echo "     - Single binary deployment"
echo "     - Frontend included and served automatically"
echo "     - Easiest deployment option"
echo ""

while true; do
    read -p "Enter your choice (1 or 2): " BUILD_CHOICE
    case $BUILD_CHOICE in
        1)
            BUILD_TYPE="standalone"
            BINARY_PREFIX="bar-pi-server"
            echo -e "${GREEN}Selected: Standalone Backend${NC}"
            break
            ;;
        2)
            BUILD_TYPE="bundle"
            BINARY_PREFIX="bar-pi-bundle"
            echo -e "${GREEN}Selected: Complete Bundle${NC}"
            break
            ;;
        *)
            echo -e "${RED}Invalid choice. Please enter 1 or 2.${NC}"
            ;;
    esac
done

BINARY_NAME="${BINARY_PREFIX}-linux-${ARCH_SUFFIX}"
echo ""

# Check if touchscreen UI should be installed (only for bundle)
INSTALL_TOUCHSCREEN=false
INSTALL_KEYBOARD=false

if [ "$BUILD_TYPE" = "bundle" ]; then
    echo ""
    echo -e "${BLUE}Setup touchscreen UI?${NC}"
    echo "  1) No touchscreen (API only)"
    echo "  2) Touchscreen without on-screen keyboard"
    echo "  3) Touchscreen with on-screen keyboard"
    echo ""

    while true; do
        read -p "Enter your choice (1, 2, or 3): " UI_CHOICE
        case $UI_CHOICE in
            1|2|3)
                break
                ;;
            *)
                echo -e "${RED}Invalid choice. Please enter 1, 2, or 3.${NC}"
                ;;
        esac
    done

    if [ "$UI_CHOICE" = "2" ] || [ "$UI_CHOICE" = "3" ]; then
        INSTALL_TOUCHSCREEN=true
        
        if [ "$UI_CHOICE" = "3" ]; then
            INSTALL_KEYBOARD=true
            echo ""
            echo -e "${YELLOW}⚠ A screen must be connected to the device during installation!${NC}"
            read -p "Press Enter to confirm a screen is connected and continue..."
        fi
    fi
fi
echo ""

# Get latest release or specific version
echo -e "${BLUE}Select installation source:${NC}"
echo "  1) Latest release from GitHub"
echo "  2) Specify a version tag"
echo "  3) Use local binary file"
echo ""

while true; do
    read -p "Enter your choice (1, 2, or 3): " SOURCE_CHOICE
    case $SOURCE_CHOICE in
        1)
            echo -e "${YELLOW}Fetching latest release...${NC}"
            if [ "$BUILD_TYPE" = "standalone" ]; then
                LATEST_TAG=$(curl -s "https://api.github.com/repos/$GITHUB_REPO/releases" | grep -o '"tag_name": "backend-v[^"]*"' | head -1 | cut -d'"' -f4)
            else
                LATEST_TAG=$(curl -s "https://api.github.com/repos/$GITHUB_REPO/releases/latest" | grep -o '"tag_name": "[^"]*"' | cut -d'"' -f4)
            fi
            
            if [ -z "$LATEST_TAG" ]; then
                echo -e "${RED}Failed to fetch latest release. Please check your internet connection.${NC}"
                exit 1
            fi
            
            VERSION_TAG="$LATEST_TAG"
            echo -e "${GREEN}Latest version: $VERSION_TAG${NC}"
            DOWNLOAD_URL="https://github.com/$GITHUB_REPO/releases/download/$VERSION_TAG/$BINARY_NAME"
            break
            ;;
        2)
            read -p "Enter version tag (e.g., v0.3.1 or backend-v0.3.1): " VERSION_TAG
            DOWNLOAD_URL="https://github.com/$GITHUB_REPO/releases/download/$VERSION_TAG/$BINARY_NAME"
            break
            ;;
        3)
            read -p "Enter path to local binary file: " LOCAL_BINARY
            if [ ! -f "$LOCAL_BINARY" ]; then
                echo -e "${RED}File not found: $LOCAL_BINARY${NC}"
                exit 1
            fi
            break
            ;;
        *)
            echo -e "${RED}Invalid choice. Please enter 1, 2, or 3.${NC}"
            ;;
    esac
done
echo ""

# Create installation directory
echo -e "${YELLOW}Creating installation directory...${NC}"
sudo mkdir -p "$INSTALL_DIR"
sudo chown $USER:$USER "$INSTALL_DIR"

# Download or copy binary
if [ "$SOURCE_CHOICE" = "3" ]; then
    echo -e "${YELLOW}Copying binary from local file...${NC}"
    cp "$LOCAL_BINARY" "$INSTALL_DIR/bar-pi-server"
else
    echo -e "${YELLOW}Downloading binary...${NC}"
    if ! curl -L -o "$INSTALL_DIR/bar-pi-server" "$DOWNLOAD_URL"; then
        echo -e "${RED}Failed to download binary. Please check the version tag and try again.${NC}"
        exit 1
    fi
fi

# Make binary executable
chmod +x "$INSTALL_DIR/bar-pi-server"
echo -e "${GREEN}✓ Binary installed to $INSTALL_DIR/bar-pi-server${NC}"
echo ""

# Create .env file if it doesn't exist
if [ ! -f "$INSTALL_DIR/.env" ]; then
    echo -e "${YELLOW}Creating default configuration file...${NC}"
    cat > "$INSTALL_DIR/.env" << 'EOF'
# Bar-Pi Backend Configuration
SERVER_PORT=8080
DB_PATH=cocktailpi-data.db
IMAGE_STORAGE_DIR=./images
JWT_SECRET=change-this-secret-in-production
CORS_ALLOWED_ORIGINS=*
EOF
    echo -e "${GREEN}✓ Configuration file created at $INSTALL_DIR/.env${NC}"
    echo -e "${YELLOW}⚠ Please edit $INSTALL_DIR/.env and change the JWT_SECRET!${NC}"
else
    echo -e "${GREEN}✓ Using existing configuration file${NC}"
fi
echo ""

# Setup autostart
echo ""
echo -e "${BLUE}Setup autostart on boot?${NC}"
read -p "Enable systemd service? (y/n): " ENABLE_SERVICE

if [[ "$ENABLE_SERVICE" =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Creating systemd service...${NC}"
    
    sudo tee /etc/systemd/system/$SERVICE_NAME.service > /dev/null << EOF
[Unit]
Description=Bar-Pi Cocktail Machine Backend
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$INSTALL_DIR
ExecStart=$INSTALL_DIR/bar-pi-server
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=bar-pi

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$INSTALL_DIR

[Install]
WantedBy=multi-user.target
EOF

    # Reload systemd and enable service
    sudo systemctl daemon-reload
    sudo systemctl enable $SERVICE_NAME.service
    
    echo -e "${GREEN}✓ Systemd service created and enabled${NC}"
    echo ""
    
    # Start service now
    echo -e "${BLUE}Start the service now?${NC}"
    read -p "Start Bar-Pi service? (y/n): " START_NOW
    
    if [[ "$START_NOW" =~ ^[Yy]$ ]]; then
        sudo systemctl start $SERVICE_NAME.service
        sleep 2
        
        if sudo systemctl is-active --quiet $SERVICE_NAME.service; then
            echo -e "${GREEN}✓ Bar-Pi service started successfully!${NC}"
        else
            echo -e "${RED}✗ Failed to start service. Check logs with: sudo journalctl -u $SERVICE_NAME${NC}"
        fi
    fi
fi

# Install touchscreen UI if requested
if [ "$INSTALL_TOUCHSCREEN" = true ]; then
    echo ""
    echo -e "${YELLOW}Installing touchscreen dependencies...${NC}"
    
    # Determine the home directory
    if [ "$USER" = "root" ]; then
        HOME_DIR="/root"
    else
        HOME_DIR="/home/$USER"
    fi
    
    # Install required packages
    sudo apt-get update
    sudo apt-get install --no-install-recommends -y chromium rpi-chromium-mods wayfire seatd xdg-user-dirs jq
    
    # Configure auto-login
    sudo raspi-config nonint do_boot_behaviour B2
    
    # Enable Wayland
    sudo raspi-config nonint do_wayland W2
    
    # Create wayfire config directory
    mkdir -p "$HOME_DIR/.config"
    
    # Install on-screen keyboard if requested
    if [ "$INSTALL_KEYBOARD" = true ]; then
        echo -e "${YELLOW}Setting up on-screen keyboard...${NC}"
        echo -e "${BLUE}A browser will open to install the Chrome keyboard extension.${NC}"
        echo -e "${BLUE}You have 100 seconds to add the extension to Chrome.${NC}"
        echo ""
        read -p "Press Enter to continue..."
        
        # Create temporary wayfire config for keyboard installation
        cat > "$HOME_DIR/.config/wayfire.ini" << 'EOFWAY'
[core]
plugins = \
        autostart

[autostart]
chromium = chromium https://chromewebstore.google.com/detail/chrome-simple-keyboard-a/cjabmkimbcmhhepelfhjhbhonnapiipj --kiosk --noerrdialogs --enable-extensions --disable-component-update --check-for-update-interval=31536000 --disable-infobars --no-first-run --ozone-platform=wayland --enable-features=OverlayScrollbar --disable-features=OverscrollHistoryNavigation --start-maximized --user-data-dir=$HOME/.config/chromium-profile
screensaver = false
dpms = false
EOFWAY
        
        # Replace $HOME with actual home directory
        sed -i "s|\$HOME|$HOME_DIR|g" "$HOME_DIR/.config/wayfire.ini"
        
        # Start wayfire to install keyboard extension
        USER_ID=$(id -u $USER)
        sudo -u $USER XDG_RUNTIME_DIR=/run/user/$USER_ID \
            nohup wayfire -c "$HOME_DIR/.config/wayfire.ini" > /dev/null 2>&1 < /dev/null & disown
        
        sleep 100
        pkill -f wayfire
    fi
    
    # Determine the URL to display
    if [ "$BUILD_TYPE" = "bundle" ]; then
        APP_URL="http://localhost:8080"
    else
        # For standalone backend, show a waiting page or localhost
        APP_URL="http://localhost:8080"
    fi
    
    # Create final wayfire config
    echo -e "${YELLOW}Creating touchscreen autostart configuration...${NC}"
    cat > "$HOME_DIR/.config/wayfire.ini" << EOFWAY
[core]
plugins = \\
        autostart

[autostart]
chromium = chromium $APP_URL --kiosk --noerrdialogs --enable-extensions --disable-component-update --check-for-update-interval=31536000 --disable-infobars --no-first-run --ozone-platform=wayland --enable-features=OverlayScrollbar --disable-features=OverscrollHistoryNavigation --start-maximized --user-data-dir=$HOME_DIR/.config/chromium-profile
screensaver = false
dpms = false
EOFWAY
    
    # Add wayfire autostart to .bashrc if not already present
    if ! grep -q "wayfire -c ~/.config/wayfire.ini" "$HOME_DIR/.bashrc"; then
        cat >> "$HOME_DIR/.bashrc" << 'EOFBASH'

# Start wayfire on tty1
if [ "$(tty)" = "/dev/tty1" ]; then
    wayfire -c ~/.config/wayfire.ini
fi
EOFBASH
    fi
    
    # Start wayfire now if on a display
    if [ -n "$DISPLAY" ] || [[ $(tty) =~ ^/dev/tty[0-9]$ ]]; then
        echo -e "${YELLOW}Starting touchscreen UI...${NC}"
        USER_ID=$(id -u $USER)
        sudo -u $USER XDG_RUNTIME_DIR=/run/user/$USER_ID \
            nohup wayfire -c "$HOME_DIR/.config/wayfire.ini" > /dev/null 2>&1 < /dev/null & disown
    fi
    
    echo -e "${GREEN}✓ Touchscreen UI configured${NC}"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     Installation Complete! 🎉         ║${NC}"
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo ""
echo -e "${BLUE}Installation Details:${NC}"
echo "  • Binary: $INSTALL_DIR/bar-pi-server"
echo "  • Config: $INSTALL_DIR/.env"
echo "  • Build Type: $BUILD_TYPE"
echo "  • Architecture: $ARCH_NAME"
echo ""

if [[ "$ENABLE_SERVICE" =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}Service Management:${NC}"
    echo "  • Start:   sudo systemctl start $SERVICE_NAME"
    echo "  • Stop:    sudo systemctl stop $SERVICE_NAME"
    echo "  • Restart: sudo systemctl restart $SERVICE_NAME"
    echo "  • Status:  sudo systemctl status $SERVICE_NAME"
    echo "  • Logs:    sudo journalctl -u $SERVICE_NAME -f"
    echo ""
fi

echo -e "${BLUE}Access the application:${NC}"
if [ "$BUILD_TYPE" = "bundle" ]; then
    echo "  • Web UI: http://localhost:8080"
    echo "  • API:    http://localhost:8080/api/"
else
    echo "  • API:    http://localhost:8080/api/"
    echo "  • Note:   Deploy frontend separately for web UI"
fi
echo "  • Health: http://localhost:8080/health"
echo ""

echo -e "${YELLOW}⚠ Important Security Notes:${NC}"
echo "  1. Change the JWT_SECRET in $INSTALL_DIR/.env"
echo "  2. Change the default admin password (admin/admin)"
echo "  3. Configure CORS_ALLOWED_ORIGINS for production"
echo ""

echo -e "${GREEN}Happy cocktail making! 🍹${NC}"
