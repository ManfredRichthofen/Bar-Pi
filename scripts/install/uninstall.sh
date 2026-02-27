#!/bin/bash

# Bar-Pi Uninstaller
# Removes Bar-Pi backend and all associated files

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration - can be overridden with environment variables
INSTALL_DIR="${BAR_PI_INSTALL_DIR:-/opt/bar-pi}"
SERVICE_NAME="${BAR_PI_SERVICE_NAME:-bar-pi}"

echo -e "${RED}╔════════════════════════════════════════╗${NC}"
echo -e "${RED}║     Bar-Pi Uninstaller                 ║${NC}"
echo -e "${RED}╔════════════════════════════════════════╗${NC}"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    echo -e "${RED}Please do not run this script as root.${NC}"
    echo -e "${YELLOW}The script will prompt for sudo when needed.${NC}"
    exit 1
fi

# Show what will be removed
echo -e "${YELLOW}This will remove:${NC}"
echo "  • Service: /etc/systemd/system/$SERVICE_NAME.service"
echo "  • Installation directory: $INSTALL_DIR"
echo "  • All data, configurations, and databases in $INSTALL_DIR"
echo ""

# Confirm uninstall
read -p "Are you sure you want to uninstall Bar-Pi? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo -e "${BLUE}Uninstall cancelled.${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}Starting uninstall...${NC}"
echo ""

# Stop and disable service if it exists
if systemctl list-unit-files | grep -q "^$SERVICE_NAME.service"; then
    echo -e "${YELLOW}Stopping and disabling service...${NC}"
    
    if sudo systemctl is-active --quiet $SERVICE_NAME.service; then
        sudo systemctl stop $SERVICE_NAME.service
        echo -e "${GREEN}✓ Service stopped${NC}"
    fi
    
    if sudo systemctl is-enabled --quiet $SERVICE_NAME.service 2>/dev/null; then
        sudo systemctl disable $SERVICE_NAME.service
        echo -e "${GREEN}✓ Service disabled${NC}"
    fi
    
    sudo rm -f /etc/systemd/system/$SERVICE_NAME.service
    sudo systemctl daemon-reload
    echo -e "${GREEN}✓ Service removed${NC}"
else
    echo -e "${BLUE}ℹ Service not found, skipping...${NC}"
fi

# Remove installation directory
if [ -d "$INSTALL_DIR" ]; then
    echo -e "${YELLOW}Removing installation directory...${NC}"
    
    # Ask about data backup
    if [ -f "$INSTALL_DIR/cocktailpi-data.db" ] || [ -d "$INSTALL_DIR/images" ]; then
        echo -e "${YELLOW}⚠ Database and images found!${NC}"
        read -p "Create backup before removing? (y/n): " BACKUP
        
        if [[ "$BACKUP" =~ ^[Yy]$ ]]; then
            BACKUP_DIR="$HOME/bar-pi-backup-$(date +%Y%m%d-%H%M%S)"
            mkdir -p "$BACKUP_DIR"
            
            if [ -f "$INSTALL_DIR/cocktailpi-data.db" ]; then
                cp "$INSTALL_DIR/cocktailpi-data.db" "$BACKUP_DIR/"
            fi
            
            if [ -d "$INSTALL_DIR/images" ]; then
                cp -r "$INSTALL_DIR/images" "$BACKUP_DIR/"
            fi
            
            echo -e "${GREEN}✓ Backup created at: $BACKUP_DIR${NC}"
        fi
    fi
    
    sudo rm -rf "$INSTALL_DIR"
    echo -e "${GREEN}✓ Installation directory removed${NC}"
else
    echo -e "${BLUE}ℹ Installation directory not found, skipping...${NC}"
fi

# Remove wayfire config if it was set up for Bar-Pi
if [ -f "$HOME/.config/wayfire.ini" ]; then
    if grep -q "bar-pi" "$HOME/.config/wayfire.ini" 2>/dev/null || grep -q "localhost:8080" "$HOME/.config/wayfire.ini" 2>/dev/null; then
        read -p "Remove wayfire touchscreen configuration? (y/n): " REMOVE_WAYFIRE
        if [[ "$REMOVE_WAYFIRE" =~ ^[Yy]$ ]]; then
            rm -f "$HOME/.config/wayfire.ini"
            echo -e "${GREEN}✓ Wayfire configuration removed${NC}"
        fi
    fi
fi

# Remove wayfire autostart from .bashrc
if [ -f "$HOME/.bashrc" ]; then
    if grep -q "wayfire -c ~/.config/wayfire.ini" "$HOME/.bashrc" 2>/dev/null; then
        read -p "Remove wayfire autostart from .bashrc? (y/n): " REMOVE_BASHRC
        if [[ "$REMOVE_BASHRC" =~ ^[Yy]$ ]]; then
            sed -i '/# Start wayfire on tty1/,/fi/d' "$HOME/.bashrc"
            echo -e "${GREEN}✓ Wayfire autostart removed from .bashrc${NC}"
        fi
    fi
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     Uninstall Complete! ✓              ║${NC}"
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo ""
echo -e "${BLUE}Bar-Pi has been removed from your system.${NC}"
echo ""
