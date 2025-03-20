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

# Install sirv-cli globally if not present
if ! command_exists sirv; then
    echo "📦 Installing sirv-cli package globally..."
    sudo npm install -g sirv-cli
fi

# Create wait-for-app-html directory if it doesn't exist
echo "📁 Creating wait-for-app-html directory..."
sudo mkdir -p /home/pi/wait-for-app-html

# Copy animation.gif if it exists
if [ -f "scripts/wait-for-app-html/animation.gif" ]; then
    echo "📄 Copying animation.gif..."
    sudo cp scripts/wait-for-app-html/animation.gif /home/pi/wait-for-app-html/
fi

# Ask user which HTML file to use
echo "🔍 Please choose which HTML file to use as index.html:"
echo "1) choice.html (Shows a choice between Original UI and Bar-Pi UI)"
echo "2) only-new.html (Directly connects to Bar-Pi UI)"
read -p "Enter your choice (1 or 2): " html_choice

case $html_choice in
    1)
        echo "📄 Copying choice.html as index.html..."
        sudo cp scripts/wait-for-app-html/choice.html /home/pi/wait-for-app-html/index.html
        ;;
    2)
        echo "📄 Copying only-new.html as index.html..."
        sudo cp scripts/wait-for-app-html/only-new.html /home/pi/wait-for-app-html/index.html
        ;;
    *)
        echo "❌ Invalid choice. Using only-new.html as default."
        sudo cp scripts/wait-for-app-html/only-new.html /home/pi/wait-for-app-html/index.html
        ;;
esac

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
ExecStart=$(which sirv) dist -p 5000
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