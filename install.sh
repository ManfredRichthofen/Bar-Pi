#!/bin/bash

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

echo "🚀 Starting Bar-Pi Web App Installation..."

# Check and install Node.js if not present
if ! command_exists node; then
    echo "📦 Node.js not found. Installing Node.js and npm..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Verify Node.js and npm installation
echo "✨ Node.js version: $(node --version)"
echo "✨ npm version: $(npm --version)"

# Get the current directory
INSTALL_DIR=$(pwd)

# Install project dependencies
echo "📦 Installing project dependencies..."
npm install

# Build the project
echo "🔨 Building the project..."
npm run build

# Install serve globally if not present
if ! command_exists serve; then
    echo "📦 Installing serve package globally..."
    sudo npm install -g serve
fi

# Create systemd service file
echo "📝 Creating systemd service..."
cat > barpi.service << EOL
[Unit]
Description=Bar-Pi Web Application
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=${INSTALL_DIR}
ExecStart=$(which serve) -s dist -l 5000
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOL

# Install and enable the service
echo "🔧 Installing and enabling systemd service..."
sudo mv barpi.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable barpi.service
sudo systemctl start barpi.service

echo "🎉 Installation complete!"
echo "✅ The Bar-Pi web app has been installed and configured to start automatically on boot"
echo "💡 You can manually control the service with these commands:"
echo "   - Start: sudo systemctl start barpi"
echo "   - Stop: sudo systemctl stop barpi"
echo "   - Restart: sudo systemctl restart barpi"
echo "   - Check status: sudo systemctl status barpi"
echo "🌍 The app is available at http://localhost:5000" 