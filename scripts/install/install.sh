#!/bin/bash

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if systemd is available
has_systemd() {
    command_exists systemctl
}

# Function to get the latest release version
get_latest_release() {
    curl -s https://api.github.com/repos/ManfredRichthofen/Bar-Pi/releases/latest | grep -o '"tag_name": "v[^"]*"' | cut -d'"' -f4 | sed 's/^v//'
}

# Function to download a file from GitHub releases
download_release_file() {
    local version=$1
    local filename=$2
    local url="https://github.com/ManfredRichthofen/Bar-Pi/releases/download/v${version}/${filename}"
    echo "📥 Downloading ${filename}..."
    curl -L -o "${filename}" "${url}"
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

# Get the latest release version
echo "🔍 Fetching latest release version..."
LATEST_VERSION=$(get_latest_release)
echo "✨ Latest version: ${LATEST_VERSION}"

# Create a temporary directory for downloads
TEMP_DIR=$(mktemp -d)
cd "${TEMP_DIR}"

# Download the latest release files
download_release_file "${LATEST_VERSION}" "${LATEST_VERSION}.zip"
download_release_file "${LATEST_VERSION}" "wait-for-app-html.zip"

# Create the app directory
echo "📁 Creating app directory..."
sudo mkdir -p /home/pi/barpi
cd /home/pi/barpi

# Extract the main app files
echo "📦 Extracting app files..."
sudo unzip -o "${TEMP_DIR}/${LATEST_VERSION}.zip"

# Create wait-for-app-html directory
echo "📁 Creating wait-for-app-html directory..."
sudo mkdir -p /home/pi/wait-for-app-html
cd /home/pi/wait-for-app-html

# Extract the wait-for-app-html files
echo "📦 Extracting wait-for-app-html files..."
sudo unzip -o "${TEMP_DIR}/wait-for-app-html.zip"

# Clean up temporary directory
cd "${INSTALL_DIR}"
rm -rf "${TEMP_DIR}"

# Install sirv-cli globally if not present
if ! command_exists sirv; then
    echo "📦 Installing sirv-cli package globally..."
    sudo npm install -g sirv-cli
fi

# Ask user which HTML file to use
echo "🔍 Please choose which HTML file to use as index.html:"
echo "1) choice.html (Shows a choice between Original UI and Bar-Pi UI)"
echo "2) only-new.html (Directly connects to Bar-Pi UI)"
read -p "Enter your choice (1 or 2): " html_choice

case $html_choice in
    1)
        echo "📄 Copying choice.html as index.html..."
        sudo cp choice.html index.html
        ;;
    2)
        echo "📄 Copying only-new.html as index.html..."
        sudo cp only-new.html index.html
        ;;
    *)
        echo "❌ Invalid choice. Using only-new.html as default."
        sudo cp only-new.html index.html
        ;;
esac

if has_systemd; then
    echo "📝 Creating systemd service..."
    cat > barpi.service << EOL
[Unit]
Description=Bar-Pi Web Application
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=/home/pi/barpi
ExecStart=$(which sirv) . -p 5000
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
else
    # Create a start script for non-systemd systems
    echo "📝 Creating start script..."
    cat > start-barpi.sh << EOL
#!/bin/bash
cd /home/pi/barpi
sirv . -p 5000
EOL
    chmod +x start-barpi.sh

    echo "🎉 Installation complete!"
    echo "✅ The Bar-Pi web app has been installed"
    echo "💡 To start the app, run:"
    echo "   ./start-barpi.sh"
    echo "🌍 The app will be available at http://localhost:5000"
fi

echo "🌍 The app is available at http://localhost:5000" 