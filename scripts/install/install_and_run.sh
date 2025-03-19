#!/bin/bash

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Bar-Pi web installation...${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root (use sudo) to install system service${NC}"
    exit 1
fi

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo -e "${RED}Git is not installed. Please install Git first.${NC}"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

# Create application directory
APP_DIR="/opt/bar-pi"
echo -e "${GREEN}Creating application directory at ${APP_DIR}...${NC}"
mkdir -p $APP_DIR

# Clone the repository if not already in it
if [ ! -d "$APP_DIR/.git" ]; then
    echo -e "${GREEN}Cloning Bar-Pi repository...${NC}"
    git clone https://github.com/ManfredRichthofen/Bar-Pi.git $APP_DIR
fi

# Change to application directory
cd $APP_DIR

# Install Node.js dependencies
echo -e "${GREEN}Installing Node.js dependencies...${NC}"
npm install

# Create systemd service file
echo -e "${GREEN}Creating systemd service file...${NC}"
cat > /etc/systemd/system/bar-pi.service << EOL
[Unit]
Description=Bar-Pi Web Application
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/npm run dev
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOL

# Reload systemd daemon
echo -e "${GREEN}Reloading systemd daemon...${NC}"
systemctl daemon-reload

# Enable and start the service
echo -e "${GREEN}Enabling and starting Bar-Pi service...${NC}"
systemctl enable bar-pi
systemctl start bar-pi

echo -e "${GREEN}Installation complete! Bar-Pi will now start automatically on system boot.${NC}"
echo -e "${GREEN}You can check the service status with: systemctl status bar-pi${NC}"
echo -e "${GREEN}The web interface will be available at http://localhost:5173${NC}" 