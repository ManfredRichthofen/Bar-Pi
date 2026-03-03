#!/bin/bash

set -e

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
GRAY='\033[0;90m'
DIM='\033[2m'
BOLD='\033[1m'
UNDERLINE='\033[4m'
BLINK='\033[5m'
REVERSE='\033[7m'
NC='\033[0m'

# Animation characters
SPINNER=('⠋' '⠙' '⠹' '⠸' '⠼' '⠴' '⠦' '⠧' '⠇' '⠏')
PROGRESS_CHARS=('█' '▓' '▒' '░')

# Default values
GITHUB_REPO="ManfredRichthofen/Bar-Pi"
INSTALL_DIR="/home/pi/barpi"
WAIT_DIR="/home/pi/wait-for-app-html"
SERVICE_NAME="barpi"
SERVER_PORT="5000"
SKIP_PROMPTS=false
HTML_CHOICE="only-new"

log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

log_section() {
    echo -e "\n${MAGENTA}╔════════════════════════════════════════╗${NC}"
    printf "${MAGENTA}║${NC}${BOLD}${WHITE}%-40s${NC}${MAGENTA}║${NC}\n" " $1"
    echo -e "${MAGENTA}╚════════════════════════════════════════╝${NC}"
}

show_progress() {
    local current=$1
    local total=$2
    local width=50
    local percentage=$((current * 100 / total))
    local filled=$((current * width / total))
    local empty=$((width - filled))
    
    printf "\r${BLUE}Progress:${NC} ["
    printf "${GREEN}%*s${NC}" $filled | tr ' ' '█'
    printf "%*s" $empty | tr ' ' '░'
    printf "] ${GRAY}%d%%${NC}" $percentage
}

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

has_systemd() {
    command_exists systemctl
}

get_latest_release() {
    curl -s https://api.github.com/repos/$GITHUB_REPO/releases/latest | grep -o '"tag_name": "v[^"]*"' | cut -d'"' -f4 | sed 's/^v//'
}

show_help() {
    cat << EOF
${CYAN}Bar-Pi Frontend Installer${NC}

Usage: $0 [OPTIONS]

Options:
  -h, --help              Show this help message
  -u, --uninstall         Uninstall Bar-Pi frontend
  -d, --dir DIR           Installation directory (default: /home/pi/barpi)
  -w, --wait-dir DIR      Wait-for-app directory (default: /home/pi/wait-for-app-html)
  -p, --port PORT         Server port (default: 5000)
  -v, --version VERSION   Specific version to install
  -y, --yes               Skip prompts and use defaults
  --html-choice CHOICE    HTML choice: choice or only-new (default: only-new)
  --no-service            Don't create systemd service

Environment Variables:
  BAR_PI_INSTALL_DIR      Installation directory
  BAR_PI_WAIT_DIR         Wait-for-app directory
  BAR_PI_SERVICE_NAME     Systemd service name
  BAR_PI_PORT             Server port
  BAR_PI_VERSION          Version to install
  BAR_PI_HTML_CHOICE      HTML choice (choice/only-new)
EOF
    exit 0
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            ;;
        -u|--uninstall)
            UNINSTALL=true
            shift
            ;;
        -d|--dir)
            INSTALL_DIR="$2"
            shift 2
            ;;
        -w|--wait-dir)
            WAIT_DIR="$2"
            shift 2
            ;;
        -p|--port)
            SERVER_PORT="$2"
            shift 2
            ;;
        -v|--version)
            VERSION_TAG="$2"
            shift 2
            ;;
        -y|--yes)
            SKIP_PROMPTS=true
            shift
            ;;
        --html-choice)
            HTML_CHOICE="$2"
            shift 2
            ;;
        --no-service)
            NO_SERVICE=true
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            ;;
    esac
done

# Override with environment variables
INSTALL_DIR="${BAR_PI_INSTALL_DIR:-$INSTALL_DIR}"
WAIT_DIR="${BAR_PI_WAIT_DIR:-$WAIT_DIR}"
SERVICE_NAME="${BAR_PI_SERVICE_NAME:-$SERVICE_NAME}"
SERVER_PORT="${BAR_PI_PORT:-$SERVER_PORT}"
VERSION_TAG="${BAR_PI_VERSION:-$VERSION_TAG}"
HTML_CHOICE="${BAR_PI_HTML_CHOICE:-$HTML_CHOICE}"

# Handle uninstall
if [ "$UNINSTALL" = "true" ]; then
    log_section "Uninstalling Bar-Pi Frontend"
    
    if has_systemd && [ -f "/etc/systemd/system/$SERVICE_NAME.service" ]; then
        log_info "Stopping and disabling service..."
        sudo systemctl stop $SERVICE_NAME 2>/dev/null || true
        sudo systemctl disable $SERVICE_NAME 2>/dev/null || true
        sudo rm -f /etc/systemd/system/$SERVICE_NAME.service
        sudo systemctl daemon-reload
    fi
    
    log_info "Removing installation directories..."
    sudo rm -rf "$INSTALL_DIR"
    sudo rm -rf "$WAIT_DIR"
    
    log_success "Bar-Pi frontend has been uninstalled"
    exit 0
fi

echo -e "${CYAN}╔════════════════════════════════════════╗${NC}"
printf "${CYAN}║${NC}${BOLD}${WHITE}%-40s${NC}${CYAN}║${NC}\n" "     Bar-Pi Frontend Installer"
echo -e "${CYAN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${WHITE}╭─────────────────────────────────────────╮${NC}"
printf "${WHITE}│${NC}${BOLD}%-41s${NC}${WHITE}│${NC}\n" " Installation Configuration:"
echo -e "${WHITE}├─────────────────────────────────────────┤${NC}"
printf "${WHITE}│${NC} ${WHITE}%-18s${NC} ${MAGENTA}%-20s${NC} ${WHITE}│${NC}\n" "📁 App Directory:" "$INSTALL_DIR"
printf "${WHITE}│${NC} ${WHITE}%-18s${NC} ${MAGENTA}%-20s${NC} ${WHITE}│${NC}\n" "📁 Wait Directory:" "$WAIT_DIR"
printf "${WHITE}│${NC} ${WHITE}%-18s${NC} ${MAGENTA}%-20s${NC} ${WHITE}│${NC}\n" "🌐 Server Port:" "$SERVER_PORT"
printf "${WHITE}│${NC} ${WHITE}%-18s${NC} ${MAGENTA}%-20s${NC} ${WHITE}│${NC}\n" "⚙️  Service Name:" "$SERVICE_NAME"
echo -e "${WHITE}╰─────────────────────────────────────────╯${NC}"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    echo -e "${RED}Please do not run this script as root.${NC}"
    echo -e "${YELLOW}The script will prompt for sudo when needed.${NC}"
    exit 1
fi

# Check for Python (comes pre-installed on Raspberry Pi OS)
if ! command_exists python3; then
    log_error "Python 3 is required but not found. Please install Python 3."
    exit 1
fi

log_info "Using Python $(python3 --version | cut -d' ' -f2) for web server (no additional dependencies needed)"

# Get version
if [ -z "$VERSION_TAG" ]; then
    log_section "Fetching Latest Release"
    log_info "Fetching latest release version..."
    VERSION_TAG=$(get_latest_release)
    log_success "Latest version: ${VERSION_TAG}"
else
    log_info "Using specified version: $VERSION_TAG"
fi

# Select HTML choice
if [ "$SKIP_PROMPTS" != "true" ]; then
    log_section "Select Landing Page"
    echo ""
    echo -e "${WHITE}┌─────────────────────────────────────────┐${NC}"
    printf "${WHITE}│${NC}${BOLD}%-41s${NC}${WHITE}│${NC}\n" " 🎨 Choose your landing page:"
    echo -e "${WHITE}├─────────────────────────────────────────┤${NC}"
    printf "${WHITE}│${NC} ${CYAN}%-39s${NC}${WHITE}│${NC}\n" "1) Choice Page"
    printf "${WHITE}│${NC}   ${DIM}%-37s${NC}${WHITE}│${NC}\n" "• Shows choice between Original & Bar-Pi"
    printf "${WHITE}│${NC}   ${DIM}%-37s${NC}${WHITE}│${NC}\n" "• Good for migration period"
    echo -e "${WHITE}├─────────────────────────────────────────┤${NC}"
    printf "${WHITE}│${NC} ${CYAN}%-39s${NC}${WHITE}│${NC}\n" "2) Direct to Bar-Pi"
    printf "${WHITE}│${NC}   ${DIM}%-37s${NC}${WHITE}│${NC}\n" "• Directly connects to Bar-Pi UI"
    printf "${WHITE}│${NC}   ${DIM}%-37s${NC}${WHITE}│${NC}\n" "• Recommended for new installations"
    echo -e "${WHITE}└─────────────────────────────────────────┘${NC}"
    echo ""
    
    while true; do
        echo -ne "${WHITE}Enter your choice${NC} ${CYAN}[1-2]${NC} ${GRAY}[2]:${NC} "
        read -r choice
        choice=${choice:-2}
        case $choice in
            1)
                HTML_CHOICE="choice"
                break
                ;;
            2)
                HTML_CHOICE="only-new"
                break
                ;;
            *)
                echo -e "${RED}✗${NC} Invalid choice. Please enter ${CYAN}1${NC} or ${CYAN}2${NC}."
                ;;
        esac
    done
else
    log_info "Auto-selecting: ${GREEN}Direct to Bar-Pi${NC} (default)"
fi

# Download and extract
log_section "Downloading Frontend"

TEMP_DIR=$(mktemp -d)
cd "$TEMP_DIR"

log_info "Downloading frontend version ${VERSION_TAG}..."
MAIN_URL="https://github.com/$GITHUB_REPO/releases/download/v${VERSION_TAG}/${VERSION_TAG}.zip"
WAIT_URL="https://github.com/$GITHUB_REPO/releases/download/v${VERSION_TAG}/wait-for-app-html.zip"

curl -L -o "${VERSION_TAG}.zip" "$MAIN_URL" 2>&1 | grep -o '[0-9]*%' | while read percent; do
    echo -ne "\r${BLUE}Downloading main app:${NC} ${GREEN}$percent${NC}"
done
echo ""
log_success "Main app downloaded"

curl -L -o "wait-for-app-html.zip" "$WAIT_URL" 2>&1 | grep -o '[0-9]*%' | while read percent; do
    echo -ne "\r${BLUE}Downloading wait page:${NC} ${GREEN}$percent${NC}"
done
echo ""
log_success "Wait page downloaded"

# Extract files
log_section "Installing Frontend"

log_info "Creating directories..."
sudo mkdir -p "$INSTALL_DIR"
sudo mkdir -p "$WAIT_DIR"

log_info "Extracting main app..."
cd "$INSTALL_DIR"
sudo unzip -o "${TEMP_DIR}/${VERSION_TAG}.zip" >/dev/null
log_success "Main app extracted"

log_info "Extracting wait page..."
cd "$WAIT_DIR"
sudo unzip -o "${TEMP_DIR}/wait-for-app-html.zip" >/dev/null
log_success "Wait page extracted"

# Configure HTML choice
log_info "Configuring landing page..."
case $HTML_CHOICE in
    choice)
        sudo cp choice.html index.html
        log_success "Using choice page (Original vs Bar-Pi)"
        ;;
    only-new)
        sudo cp only-new.html index.html
        log_success "Using direct Bar-Pi page"
        ;;
esac

# Clean up
cd /
rm -rf "$TEMP_DIR"

log_info "Using Python's built-in HTTP server (no additional packages needed)"

# Setup service
if [ "$NO_SERVICE" != "true" ] && has_systemd; then
    log_section "Configuring Service"
    
    PYTHON_PATH=$(which python3)
    
    cat > /tmp/$SERVICE_NAME.service << EOL
[Unit]
Description=Bar-Pi Web Application
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$INSTALL_DIR
ExecStart=$PYTHON_PATH -m http.server $SERVER_PORT
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOL

    log_info "Installing systemd service..."
    sudo mv /tmp/$SERVICE_NAME.service /etc/systemd/system/
    sudo systemctl daemon-reload
    sudo systemctl enable $SERVICE_NAME.service
    sudo systemctl start $SERVICE_NAME.service
    log_success "Service installed and started"
    
    ENABLE_SERVICE="Y"
else
    # Create start script for non-systemd systems
    log_section "Creating Start Script"
    
    cat > "$INSTALL_DIR/start-barpi.sh" << EOL
#!/bin/bash
cd $INSTALL_DIR
python3 -m http.server $SERVER_PORT
EOL
    chmod +x "$INSTALL_DIR/start-barpi.sh"
    log_success "Start script created at $INSTALL_DIR/start-barpi.sh"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
printf "${GREEN}║${NC}${BOLD}${WHITE}%-40s${NC}${GREEN}║${NC}\n" "     🎉 Installation Complete! 🎉"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}╭─────────────────────────────────────────╮${NC}"
printf "${CYAN}│${NC}${BOLD}${WHITE}%-41s${NC}${CYAN}│${NC}\n" " 📋 Installation Summary"
echo -e "${CYAN}├─────────────────────────────────────────┤${NC}"
printf "${CYAN}│${NC} ${WHITE}%-15s${NC} ${MAGENTA}%-22s${NC} ${CYAN}│${NC}\n" "App Directory:" "$INSTALL_DIR"
printf "${CYAN}│${NC} ${WHITE}%-15s${NC} ${MAGENTA}%-22s${NC} ${CYAN}│${NC}\n" "Wait Directory:" "$WAIT_DIR"
printf "${CYAN}│${NC} ${WHITE}%-15s${NC} ${MAGENTA}%-22s${NC} ${CYAN}│${NC}\n" "Server Port:" "$SERVER_PORT"
printf "${CYAN}│${NC} ${WHITE}%-15s${NC} ${MAGENTA}%-22s${NC} ${CYAN}│${NC}\n" "Version:" "$VERSION_TAG"
printf "${CYAN}│${NC} ${WHITE}%-15s${NC} ${MAGENTA}%-22s${NC} ${CYAN}│${NC}\n" "Landing Page:" "$HTML_CHOICE"
echo -e "${CYAN}╰─────────────────────────────────────────╯${NC}"
echo ""

if [[ "$ENABLE_SERVICE" =~ ^[Yy]$ ]]; then
    echo -e "${CYAN}╭─────────────────────────────────────────╮${NC}"
    printf "${CYAN}│${NC}${BOLD}${WHITE}%-41s${NC}${CYAN}│${NC}\n" " ⚙️ Service Management"
    echo -e "${CYAN}├─────────────────────────────────────────┤${NC}"
    printf "${CYAN}│${NC} ${WHITE}%-8s${NC} ${MAGENTA}%-29s${NC} ${CYAN}│${NC}\n" "Start:" "sudo systemctl start $SERVICE_NAME"
    printf "${CYAN}│${NC} ${WHITE}%-8s${NC} ${MAGENTA}%-29s${NC} ${CYAN}│${NC}\n" "Stop:" "sudo systemctl stop $SERVICE_NAME"
    printf "${CYAN}│${NC} ${WHITE}%-8s${NC} ${MAGENTA}%-29s${NC} ${CYAN}│${NC}\n" "Restart:" "sudo systemctl restart $SERVICE_NAME"
    printf "${CYAN}│${NC} ${WHITE}%-8s${NC} ${MAGENTA}%-29s${NC} ${CYAN}│${NC}\n" "Status:" "sudo systemctl status $SERVICE_NAME"
    printf "${CYAN}│${NC} ${WHITE}%-8s${NC} ${MAGENTA}%-29s${NC} ${CYAN}│${NC}\n" "Logs:" "sudo journalctl -u $SERVICE_NAME -f"
    echo -e "${CYAN}╰─────────────────────────────────────────╯${NC}"
    echo ""
fi

echo -e "${CYAN}╭─────────────────────────────────────────╮${NC}"
printf "${CYAN}│${NC}${BOLD}${WHITE}%-41s${NC}${CYAN}│${NC}\n" " 🌐 Access the Application"
echo -e "${CYAN}├─────────────────────────────────────────┤${NC}"
printf "${CYAN}│${NC} ${WHITE}%-8s${NC} ${MAGENTA}%-29s${NC} ${CYAN}│${NC}\n" "Web UI:" "http://localhost:$SERVER_PORT"
printf "${CYAN}│${NC} ${WHITE}%-8s${NC} ${MAGENTA}%-29s${NC} ${CYAN}│${NC}\n" "Network:" "http://$(hostname -I | awk '{print $1}'):$SERVER_PORT"
echo -e "${CYAN}╰─────────────────────────────────────────╯${NC}"
echo ""

echo -e "${CYAN}╭─────────────────────────────────────────╮${NC}"
printf "${CYAN}│${NC}${BOLD}${WHITE}%-41s${NC}${CYAN}│${NC}\n" " 🗑️ Uninstall"
echo -e "${CYAN}├─────────────────────────────────────────┤${NC}"
printf "${CYAN}│${NC} ${WHITE}%-5s${NC} ${MAGENTA}%-32s${NC} ${CYAN}│${NC}\n" "Run:" "$0 --uninstall"
echo -e "${CYAN}╰─────────────────────────────────────────╯${NC}"
echo ""

echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
printf "${GREEN}║${NC}${BOLD}${WHITE}%-40s${NC}${GREEN}║${NC}\n" "     🍹 Happy cocktail making! 🍹"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""