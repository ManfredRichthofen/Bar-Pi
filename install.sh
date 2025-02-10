#!/bin/bash

# Bar-Pi Installation Script
echo "Starting Bar-Pi installation..."

# Update system packages
echo "Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js and npm
echo "Installing Node.js and npm..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install required system dependencies
echo "Installing system dependencies..."
sudo apt-get install -y \
    build-essential \
    git \
    python3 \
    python3-pip \
    libgpiod2

# Create service user (optional, uncomment if needed)
# sudo useradd -r -s /bin/false barpi

# Clone the repository (if not already done)
if [ ! -d "Bar-Pi" ]; then
    echo "Cloning Bar-Pi repository..."
    git clone https://github.com/yourusername/Bar-Pi.git
    cd Bar-Pi
else
    echo "Bar-Pi directory already exists, updating..."
    cd Bar-Pi
    git pull
fi

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
npm install

# Build the project
echo "Building the project..."
npm run build

# Create systemd service for auto-start (optional)
echo "Creating systemd service..."
sudo tee /etc/systemd/system/barpi.service > /dev/null << EOL
[Unit]
Description=Bar-Pi Drink Dispensing System
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/Bar-Pi
ExecStart=/usr/bin/npm run preview
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOL

# Enable and start the service
sudo systemctl enable barpi.service
sudo systemctl start barpi.service

# Set up GPIO permissions (if needed)
sudo usermod -a -G gpio pi

echo "Installation complete!"
echo "The Bar-Pi system should now be running and will start automatically on boot."
echo "You can access the web interface at http://localhost:4173"
echo ""
echo "To check the service status: sudo systemctl status barpi"
echo "To view logs: journalctl -u barpi" 