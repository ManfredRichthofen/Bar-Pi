#!/bin/bash

# Bar-Pi Go Backend Installer
# Installs the Bar-Pi backend and sets up autostart on Linux
#
# Environment Variables:
#   BAR_PI_INSTALL_DIR    - Installation directory (default: /opt/bar-pi)
#   BAR_PI_SERVICE_NAME   - Systemd service name (default: bar-pi)
#   BAR_PI_PORT           - Server port (default: 8080)
#   BAR_PI_BUILD_TYPE     - Build type: standalone or bundle (default: interactive)
#   BAR_PI_VERSION        - Specific version to install (default: latest)
#   BAR_PI_AUTO_START     - Auto-enable service: yes or no (default: interactive)
#   BAR_PI_TOUCHSCREEN    - Touchscreen mode: none, basic, keyboard (default: interactive)
#   BAR_PI_SKIP_PROMPTS   - Skip all prompts and use defaults (default: false)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
GRAY='\033[0;37m'
BOLD='\033[1m'
DIM='\033[2m'
UNDERLINE='\033[4m'
BLINK='\033[5m'
REVERSE='\033[7m'
NC='\033[0m' # No Color

# Animation characters
SPINNER="⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏"
PROGRESS_CHARS="▏▎▍▌▋▊▉█"

# Configuration - can be overridden with environment variables
GITHUB_REPO="ManfredRichthofen/Bar-Pi"
INSTALL_DIR="${BAR_PI_INSTALL_DIR:-/opt/bar-pi}"
SERVICE_NAME="${BAR_PI_SERVICE_NAME:-bar-pi}"
SERVER_PORT="${BAR_PI_PORT:-8080}"
USER=$(whoami)
SKIP_PROMPTS="${BAR_PI_SKIP_PROMPTS:-false}"

# Functions
show_help() {
    cat << EOF
${CYAN}Bar-Pi Go Backend Installer${NC}

Usage: $0 [OPTIONS]

Options:
  -h, --help              Show this help message
  -u, --uninstall         Uninstall Bar-Pi
  -d, --dir DIR           Installation directory (default: /opt/bar-pi)
  -p, --port PORT         Server port (default: 8080)
  -b, --build TYPE        Build type: standalone or bundle
  -v, --version VERSION   Specific version to install
  -y, --yes               Skip prompts and use defaults
  --no-service            Don't create systemd service
  --touchscreen MODE      Touchscreen mode: none, basic, keyboard

Environment Variables:
  BAR_PI_INSTALL_DIR      Installation directory
  BAR_PI_SERVICE_NAME     Systemd service name
  BAR_PI_PORT             Server port
  BAR_PI_BUILD_TYPE       Build type (standalone/bundle)
  BAR_PI_VERSION          Version to install
  BAR_PI_AUTO_START       Auto-enable service (yes/no)
  BAR_PI_TOUCHSCREEN      Touchscreen mode (none/basic/keyboard)
  BAR_PI_SKIP_PROMPTS     Skip all prompts (true/false)

Examples:
  # Interactive install
  $0

  # Automated install with custom settings
  BAR_PI_PORT=3000 BAR_PI_BUILD_TYPE=bundle $0 -y

  # Install to custom directory
  $0 --dir /home/pi/bar-pi --port 3000

  # Uninstall
  $0 --uninstall

EOF
    exit 0
}

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

log_step() {
    echo -e "\n${CYAN}┌─────────────────────────────────────────┐${NC}"
    echo -e "${CYAN}│${BOLD} $1${NC}${CYAN}│${NC}"
    echo -e "${CYAN}└─────────────────────────────────────────┘${NC}"
}

log_section() {
    echo -e "\n${MAGENTA}╔════════════════════════════════════════╗${NC}"
    echo -e "${MAGENTA}║${NC}${BOLD}${WHITE} $1${NC}                           ${MAGENTA}║${NC}"
    echo -e "${MAGENTA}╚════════════════════════════════════════╝${NC}"
}

show_spinner() {
    local pid=$1
    local message="$2"
    local delay=0.1
    local spin_count=0
    
    while kill -0 $pid 2>/dev/null; do
        local char=${SPINNER:$spin_count:1}
        echo -ne "\r${BLUE}⏳${NC} $message ${CYAN}$char${NC}"
        sleep $delay
        spin_count=$(( (spin_count + 1) % ${#SPINNER} ))
    done
    echo -ne "\r${GREEN}✓${NC} $message\n"
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

print_box_line() {
    local label="$1"
    local value="$2"
    local color="${3:-$MAGENTA}"
    # Box width is 41 chars (excluding borders)
    # Format: "│ label: value │"
    printf "${WHITE}│${NC} %-41s ${WHITE}│${NC}\n" "$(printf "${WHITE}%s${NC} ${color}%s${NC}" "$label" "$value")"
}

prompt_yes_no() {
    local prompt="$1"
    local default="${2:-n}"
    
    if [ "$SKIP_PROMPTS" = "true" ]; then
        echo "$default"
        return
    fi
    
    local yn
    read -p "$prompt (y/n): " yn
    echo "$yn"
}

# Parse command line arguments
CREATE_SERVICE="yes"
UNINSTALL=false

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
        -p|--port)
            SERVER_PORT="$2"
            shift 2
            ;;
        -b|--build)
            BAR_PI_BUILD_TYPE="$2"
            shift 2
            ;;
        -v|--version)
            BAR_PI_VERSION="$2"
            shift 2
            ;;
        -y|--yes)
            SKIP_PROMPTS="true"
            shift
            ;;
        --no-service)
            CREATE_SERVICE="no"
            shift
            ;;
        --touchscreen)
            BAR_PI_TOUCHSCREEN="$2"
            shift 2
            ;;
        *)
            log_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Handle uninstall
if [ "$UNINSTALL" = true ]; then
    UNINSTALL_SCRIPT="$(dirname "$0")/uninstall.sh"
    if [ -f "$UNINSTALL_SCRIPT" ]; then
        exec bash "$UNINSTALL_SCRIPT"
    else
        log_error "Uninstall script not found at: $UNINSTALL_SCRIPT"
        exit 1
    fi
fi

echo -e "${CYAN}╔════════════════════════════════════════╗${NC}"
printf "${CYAN}║${NC}${BOLD}${WHITE}%-40s${NC}${CYAN}║${NC}\n" "     Bar-Pi Go Backend Installer"
echo -e "${CYAN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${WHITE}╭─────────────────────────────────────────╮${NC}"
printf "${WHITE}│${NC}${BOLD}%-41s${NC}${WHITE}│${NC}\n" " Installation Configuration:"
echo -e "${WHITE}├─────────────────────────────────────────┤${NC}"
printf "${WHITE}│${NC} ${WHITE}%-18s${NC} ${MAGENTA}%-20s${NC} ${WHITE}│${NC}\n" "📁 Installation:" "$INSTALL_DIR"
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

log_success "Detected architecture: $ARCH_NAME"
echo ""

# Select build type
if [ -n "$BAR_PI_BUILD_TYPE" ]; then
    BUILD_TYPE="$BAR_PI_BUILD_TYPE"
    log_info "Using build type from environment: $BUILD_TYPE"
else
    log_section "Select Build Type"
    echo ""
    echo -e "${WHITE}┌─────────────────────────────────────────┐${NC}"
    printf "${WHITE}│${NC}${BOLD}%-41s${NC}${WHITE}│${NC}\n" " 🚀 Choose your deployment style:"
    echo -e "${WHITE}├─────────────────────────────────────────┤${NC}"
    printf "${WHITE}│${NC} ${CYAN}%-39s${NC}${WHITE}│${NC}\n" "1) Standalone Backend"
    printf "${WHITE}│${NC}   ${DIM}%-37s${NC}${WHITE}│${NC}\n" "• API-only, no embedded frontend"
    printf "${WHITE}│${NC}   ${DIM}%-37s${NC}${WHITE}│${NC}\n" "• Smaller binary size"
    printf "${WHITE}│${NC}   ${DIM}%-37s${NC}${WHITE}│${NC}\n" "• Deploy frontend separately"
    printf "${WHITE}│${NC}   ${DIM}%-37s${NC}${WHITE}│${NC}\n" "• Ideal for custom deployments"
    echo -e "${WHITE}├─────────────────────────────────────────┤${NC}"
    printf "${WHITE}│${NC} ${CYAN}%-39s${NC}${WHITE}│${NC}\n" "2) Complete Bundle"
    printf "${WHITE}│${NC}   ${DIM}%-37s${NC}${WHITE}│${NC}\n" "• Backend + Embedded Frontend"
    printf "${WHITE}│${NC}   ${DIM}%-37s${NC}${WHITE}│${NC}\n" "• Single binary deployment"
    printf "${WHITE}│${NC}   ${DIM}%-37s${NC}${WHITE}│${NC}\n" "• Frontend served automatically"
    printf "${WHITE}│${NC}   ${DIM}%-37s${NC}${WHITE}│${NC}\n" "• Easiest deployment option"
    echo -e "${WHITE}└─────────────────────────────────────────┘${NC}"
    echo ""

    if [ "$SKIP_PROMPTS" = "true" ]; then
        BUILD_CHOICE=2
        echo -e "${BLUE}ℹ${NC} Auto-selecting: ${GREEN}Complete Bundle${NC} (default)"
    else
        while true; do
            echo -ne "${WHITE}Enter your choice${NC} ${CYAN}[1-2]${NC} ${GRAY}[2]:${NC} "
            read -r BUILD_CHOICE
            BUILD_CHOICE=${BUILD_CHOICE:-2}
            case $BUILD_CHOICE in
                1|2)
                    break
                    ;;
                *)
                    echo -e "${RED}✗${NC} Invalid choice. Please enter ${CYAN}1${NC} or ${CYAN}2${NC}."
                    ;;
            esac
        done
    fi
    
    case $BUILD_CHOICE in
        1)
            BUILD_TYPE="standalone"
            ;;
        2)
            BUILD_TYPE="bundle"
            ;;
    esac
fi

case $BUILD_TYPE in
    standalone)
        BINARY_PREFIX="bar-pi-server"
        log_success "Selected: Standalone Backend"
        ;;
    bundle)
        BINARY_PREFIX="bar-pi-bundle"
        log_success "Selected: Complete Bundle"
        ;;
    *)
        log_error "Invalid build type: $BUILD_TYPE (must be 'standalone' or 'bundle')"
        exit 1
        ;;
esac

BINARY_NAME="${BINARY_PREFIX}-linux-${ARCH_SUFFIX}"
echo ""

# Check if touchscreen UI should be installed (only for bundle)
INSTALL_TOUCHSCREEN=false
INSTALL_KEYBOARD=false

if [ "$BUILD_TYPE" = "bundle" ]; then
    if [ -n "$BAR_PI_TOUCHSCREEN" ]; then
        case "$BAR_PI_TOUCHSCREEN" in
            none)
                INSTALL_TOUCHSCREEN=false
                ;;
            basic)
                INSTALL_TOUCHSCREEN=true
                INSTALL_KEYBOARD=false
                ;;
            keyboard)
                INSTALL_TOUCHSCREEN=true
                INSTALL_KEYBOARD=true
                ;;
            *)
                log_error "Invalid touchscreen mode: $BAR_PI_TOUCHSCREEN (must be 'none', 'basic', or 'keyboard')"
                exit 1
                ;;
        esac
        log_info "Using touchscreen mode from environment: $BAR_PI_TOUCHSCREEN"
    else
        log_section "Touchscreen UI Setup"
        echo ""
        echo -e "${WHITE}┌─────────────────────────────────────────┐${NC}"
        printf "${WHITE}│${NC}${BOLD}%-41s${NC}${WHITE}│${NC}\n" " 📱 Configure touchscreen interface:"
        echo -e "${WHITE}├─────────────────────────────────────────┤${NC}"
        printf "${WHITE}│${NC} ${CYAN}%-39s${NC}${WHITE}│${NC}\n" "1) No touchscreen"
        printf "${WHITE}│${NC}   ${DIM}%-37s${NC}${WHITE}│${NC}\n" "• Standard web interface only"
        printf "${WHITE}│${NC}   ${DIM}%-37s${NC}${WHITE}│${NC}\n" "• Use with mouse/keyboard"
        echo -e "${WHITE}├─────────────────────────────────────────┤${NC}"
        printf "${WHITE}│${NC} ${CYAN}%-39s${NC}${WHITE}│${NC}\n" "2) Touchscreen - Basic"
        printf "${WHITE}│${NC}   ${DIM}%-37s${NC}${WHITE}│${NC}\n" "• Touch-optimized interface"
        printf "${WHITE}│${NC}   ${DIM}%-37s${NC}${WHITE}│${NC}\n" "• No on-screen keyboard"
        printf "${WHITE}│${NC}   ${DIM}%-37s${NC}${WHITE}│${NC}\n" "• For simple touch operations"
        echo -e "${WHITE}├─────────────────────────────────────────┤${NC}"
        printf "${WHITE}│${NC} ${CYAN}%-39s${NC}${WHITE}│${NC}\n" "3) Touchscreen - Full"
        printf "${WHITE}│${NC}   ${DIM}%-37s${NC}${WHITE}│${NC}\n" "• Touch-optimized interface"
        printf "${WHITE}│${NC}   ${DIM}%-37s${NC}${WHITE}│${NC}\n" "• Includes on-screen keyboard"
        printf "${WHITE}│${NC}   ${DIM}%-37s${NC}${WHITE}│${NC}\n" "• Complete standalone experience"
        echo -e "${WHITE}└─────────────────────────────────────────┘${NC}"
        echo ""

        if [ "$SKIP_PROMPTS" = "true" ]; then
            UI_CHOICE=1
            echo -e "${BLUE}ℹ${NC} Auto-selecting: ${GREEN}No touchscreen${NC} (default)"
        else
            while true; do
                echo -ne "${WHITE}Enter your choice${NC} ${CYAN}[1-3]${NC} ${GRAY}[1]:${NC} "
                read -r UI_CHOICE
                UI_CHOICE=${UI_CHOICE:-1}
                case $UI_CHOICE in
                    1|2|3)
                        break
                        ;;
                    *)
                        echo -e "${RED}✗${NC} Invalid choice. Please enter ${CYAN}1${NC}, ${CYAN}2${NC}, or ${CYAN}3${NC}."
                        ;;
                esac
            done
        fi

        if [ "$UI_CHOICE" = "2" ] || [ "$UI_CHOICE" = "3" ]; then
            INSTALL_TOUCHSCREEN=true
            
            if [ "$UI_CHOICE" = "3" ]; then
                INSTALL_KEYBOARD=true
                echo ""
                log_warning "A screen must be connected to the device during installation!"
                if [ "$SKIP_PROMPTS" != "true" ]; then
                    read -p "Press Enter to confirm a screen is connected and continue..."
                fi
            fi
        fi
    fi
fi
echo ""

# Get latest release or specific version
if [ -n "$BAR_PI_VERSION" ]; then
    VERSION_TAG="$BAR_PI_VERSION"
    DOWNLOAD_URL="https://github.com/$GITHUB_REPO/releases/download/$VERSION_TAG/$BINARY_NAME"
    SOURCE_CHOICE=2
    log_info "Using version from environment: $VERSION_TAG"
else
    log_section "Installation Source"
    echo ""
    echo -e "${WHITE}┌─────────────────────────────────────────┐${NC}"
    printf "${WHITE}│${NC}${BOLD}%-41s${NC}${WHITE}│${NC}\n" " 📦 Choose installation source:"
    echo -e "${WHITE}├─────────────────────────────────────────┤${NC}"
    printf "${WHITE}│${NC} ${CYAN}%-39s${NC}${WHITE}│${NC}\n" "1) Latest Release"
    printf "${WHITE}│${NC}   ${DIM}%-37s${NC}${WHITE}│${NC}\n" "• Most recent stable version"
    printf "${WHITE}│${NC}   ${DIM}%-37s${NC}${WHITE}│${NC}\n" "• Auto-detected from GitHub"
    echo -e "${WHITE}├─────────────────────────────────────────┤${NC}"
    printf "${WHITE}│${NC} ${CYAN}%-39s${NC}${WHITE}│${NC}\n" "2) Specific Version"
    printf "${WHITE}│${NC}   ${DIM}%-37s${NC}${WHITE}│${NC}\n" "• Choose exact version tag"
    printf "${WHITE}│${NC}   ${DIM}%-37s${NC}${WHITE}│${NC}\n" "• For testing or rollback"
    echo -e "${WHITE}├─────────────────────────────────────────┤${NC}"
    printf "${WHITE}│${NC} ${CYAN}%-39s${NC}${WHITE}│${NC}\n" "3) Local Binary File"
    printf "${WHITE}│${NC}   ${DIM}%-37s${NC}${WHITE}│${NC}\n" "• Use pre-built local file"
    printf "${WHITE}│${NC}   ${DIM}%-37s${NC}${WHITE}│${NC}\n" "• For development/testing"
    echo -e "${WHITE}└─────────────────────────────────────────┘${NC}"
    echo ""

    if [ "$SKIP_PROMPTS" = "true" ]; then
        SOURCE_CHOICE=1
        echo -e "${BLUE}ℹ${NC} Auto-selecting: ${GREEN}Latest Release${NC} (default)"
    else
        while true; do
            echo -ne "${WHITE}Enter your choice${NC} ${CYAN}[1-3]${NC} ${GRAY}[1]:${NC} "
            read -r SOURCE_CHOICE
            SOURCE_CHOICE=${SOURCE_CHOICE:-1}
            case $SOURCE_CHOICE in
                1|2|3)
                    break
                    ;;
                *)
                    echo -e "${RED}✗${NC} Invalid choice. Please enter ${CYAN}1${NC}, ${CYAN}2${NC}, or ${CYAN}3${NC}."
                    ;;
            esac
        done
    fi
    
    case $SOURCE_CHOICE in
        1)
            echo -ne "${BLUE}⏳${NC} Fetching latest release... "
            if [ "$BUILD_TYPE" = "standalone" ]; then
                LATEST_TAG=$(curl -s "https://api.github.com/repos/$GITHUB_REPO/releases" | grep -o '"tag_name": "backend-v[^"]*"' | head -1 | cut -d'"' -f4)
            else
                LATEST_TAG=$(curl -s "https://api.github.com/repos/$GITHUB_REPO/releases/latest" | grep -o '"tag_name": "[^"]*"' | cut -d'"' -f4)
            fi
            
            if [ -z "$LATEST_TAG" ]; then
                echo -e "\n${RED}✗${NC} Failed to fetch latest release. Please check your internet connection."
                exit 1
            fi
            
            echo -e "\r${GREEN}✓${NC} Latest version: ${MAGENTA}$LATEST_TAG${NC}"
            VERSION_TAG="$LATEST_TAG"
            DOWNLOAD_URL="https://github.com/$GITHUB_REPO/releases/download/$VERSION_TAG/$BINARY_NAME"
            ;;
        2)
            echo -ne "${WHITE}Enter version tag${NC} ${GRAY}(e.g., v0.3.1 or backend-v0.3.1)${NC}: "
            read -r VERSION_TAG
            DOWNLOAD_URL="https://github.com/$GITHUB_REPO/releases/download/$VERSION_TAG/$BINARY_NAME"
            ;;
        3)
            echo -ne "${WHITE}Enter path to local binary file${NC}: "
            read -r LOCAL_BINARY
            if [ ! -f "$LOCAL_BINARY" ]; then
                echo -e "${RED}✗${NC} File not found: $LOCAL_BINARY"
                exit 1
            fi
            ;;
    esac
fi
echo ""

# Create installation directory
log_section "Creating Installation Directory"
echo -e "${BLUE}📁${NC} Creating directory: ${MAGENTA}$INSTALL_DIR${NC}"
sudo mkdir -p "$INSTALL_DIR"
sudo chown $USER:$USER "$INSTALL_DIR"
echo -e "${GREEN}✓${NC} Installation directory created successfully"

# Download or copy binary
log_section "Installing Binary"
if [ "$SOURCE_CHOICE" = "3" ]; then
    echo -e "${BLUE}📋${NC} Copying binary from local file..."
    cp "$LOCAL_BINARY" "$INSTALL_DIR/bar-pi-server"
else
    echo -e "${BLUE}⬇️${NC} Downloading binary from GitHub..."
    echo -e "${DIM}   URL: $DOWNLOAD_URL${NC}"
    echo ""
    
    # Start download in background for progress tracking
    curl -L -o "$INSTALL_DIR/bar-pi-server" "$DOWNLOAD_URL" &
    CURL_PID=$!
    
    # Show spinner while downloading
    show_spinner $CURL_PID "Downloading binary"
    
    # Check if download succeeded
    wait $CURL_PID
    if [ $? -ne 0 ]; then
        echo -e "\n${RED}✗${NC} Failed to download binary. Please check the version tag and try again."
        exit 1
    fi
fi

# Make binary executable
echo -e "${BLUE}🔧${NC} Setting executable permissions..."
chmod +x "$INSTALL_DIR/bar-pi-server"
echo -e "${GREEN}✓${NC} Binary installed to ${MAGENTA}$INSTALL_DIR/bar-pi-server${NC}"

# Verify binary can execute
echo -ne "${BLUE}🔍${NC} Verifying binary... "
if ! "$INSTALL_DIR/bar-pi-server" --version > /dev/null 2>&1 && ! "$INSTALL_DIR/bar-pi-server" -h > /dev/null 2>&1; then
    echo -e "\n${YELLOW}⚠${NC} Binary verification skipped (no --version or -h flag)"
else
    echo -e "\r${GREEN}✓${NC} Binary verification passed"
fi
echo ""

# Generate secure JWT secret
log_section "Security Configuration"
echo -e "${BLUE}🔐${NC} Generating secure JWT secret..."
if command -v openssl &> /dev/null; then
    JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
    echo -e "${GREEN}✓${NC} JWT secret generated using OpenSSL"
else
    JWT_SECRET=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 64 | head -n 1)
    echo -e "${GREEN}✓${NC} JWT secret generated using /dev/urandom"
fi

# Create .env file if it doesn't exist
if [ ! -f "$INSTALL_DIR/.env" ]; then
    echo -e "${BLUE}⚙️${NC} Creating configuration file..."
    cat > "$INSTALL_DIR/.env" << EOF
# Bar-Pi Backend Configuration
# Only essential settings are included - all others use sensible defaults

# Server
SERVER_PORT=$SERVER_PORT

# Database
DATABASE_PATH=cocktailpi-data.db

# Security (auto-generated)
JWT_SECRET=$JWT_SECRET

# Optional: Uncomment to customize
# SERVER_READ_TIMEOUT=15s
# SERVER_WRITE_TIMEOUT=15s
# SERVER_IDLE_TIMEOUT=60s
# DATABASE_MAX_OPEN_CONNS=1
# DATABASE_MAX_IDLE_CONNS=1
# JWT_EXPIRATION=24h
# APP_NAME=CocktailPi
# APP_VERSION=2.0.0
# APP_DISABLE_DONATION=false
# APP_HIDE_PROJECT_LINKS=false
# APP_DISABLE_UPDATER=false
EOF
    echo -e "${GREEN}✓${NC} Configuration file created at ${MAGENTA}$INSTALL_DIR/.env${NC}"
    echo -e "${GREEN}✓${NC} Secure JWT secret automatically configured"
else
    echo -e "${BLUE}ℹ${NC} Using existing configuration file"
fi
echo ""

# Setup autostart
if [ "$CREATE_SERVICE" = "no" ]; then
    log_info "Skipping systemd service creation (--no-service flag)"
    ENABLE_SERVICE="n"
else
    if [ -n "$BAR_PI_AUTO_START" ]; then
        ENABLE_SERVICE="$BAR_PI_AUTO_START"
        log_info "Using auto-start setting from environment: $BAR_PI_AUTO_START"
    else
        echo ""
        log_section "System Service Setup"
        if [ "$SKIP_PROMPTS" = "true" ]; then
            ENABLE_SERVICE="y"
            echo -e "${BLUE}ℹ${NC} Auto-enabling systemd service (default)"
        else
            echo -ne "${WHITE}Enable systemd service?${NC} ${CYAN}(y/n)${NC} ${GRAY}[y]:${NC} "
            read -r ENABLE_SERVICE
            ENABLE_SERVICE=${ENABLE_SERVICE:-y}
        fi
    fi
fi

if [[ "$ENABLE_SERVICE" =~ ^[Yy]$ ]]; then
    log_section "Creating Systemd Service"
    echo -e "${BLUE}⚙️${NC} Creating service: ${MAGENTA}$SERVICE_NAME${NC}"
    
    sudo tee /etc/systemd/system/$SERVICE_NAME.service > /dev/null << EOF
[Unit]
Description=Bar-Pi Cocktail Machine Backend
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$INSTALL_DIR
EnvironmentFile=$INSTALL_DIR/.env
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

    echo -e "${BLUE}🔄${NC} Reloading systemd daemon..."
    sudo systemctl daemon-reload
    sudo systemctl enable $SERVICE_NAME.service
    
    echo -e "${GREEN}✓${NC} Systemd service created and enabled"
    echo ""
    
    # Start service now
    if [ "$SKIP_PROMPTS" = "true" ]; then
        START_NOW="y"
        echo -e "${BLUE}ℹ${NC} Auto-starting service (default)"
    else
        echo -ne "${WHITE}Start Bar-Pi service now?${NC} ${CYAN}(y/n)${NC} ${GRAY}[y]:${NC} "
        read -r START_NOW
        START_NOW=${START_NOW:-y}
    fi
    
    if [[ "$START_NOW" =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}🚀${NC} Starting service..."
        sudo systemctl start $SERVICE_NAME.service
        
        # Show progress while starting
        for i in {1..3}; do
            echo -ne "\r${BLUE}⏳${NC} Waiting for service to start${SPINNER:$((i%10)):1}"
            sleep 1
        done
        echo -e "\r${BLUE}🔍${NC} Checking service status..."
        
        if sudo systemctl is-active --quiet $SERVICE_NAME.service; then
            echo -e "\n${GREEN}✓${NC} Bar-Pi service started successfully!"
            
            # Test the health endpoint
            echo -ne "${BLUE}🏥${NC} Testing health endpoint... "
            sleep 1
            if curl -s http://localhost:$SERVER_PORT/health > /dev/null 2>&1; then
                echo -e "\r${GREEN}✓${NC} Health check passed"
            else
                echo -e "\r${YELLOW}⚠${NC} Health endpoint not responding yet (may take a moment)"
            fi
        else
            echo -e "\n${RED}✗${NC} Failed to start service"
            echo ""
            echo -e "${YELLOW}Last 20 log lines:${NC}"
            sudo journalctl -u $SERVICE_NAME -n 20 --no-pager
            echo ""
            echo -e "${YELLOW}Check full logs with:${NC} ${MAGENTA}sudo journalctl -u $SERVICE_NAME -f${NC}"
        fi
    fi
fi

# Install touchscreen UI if requested
if [ "$INSTALL_TOUCHSCREEN" = true ]; then
    echo ""
    log_step "Installing touchscreen dependencies"
    
    # Determine the home directory
    if [ "$USER" = "root" ]; then
        HOME_DIR="/root"
    else
        HOME_DIR="/home/$USER"
    fi
    
    # Install required packages
    log_info "Updating package lists..."
    sudo apt-get update
    log_info "Installing packages: chromium, wayfire, seatd..."
    sudo apt-get install --no-install-recommends -y chromium rpi-chromium-mods wayfire seatd xdg-user-dirs jq
    
    # Configure auto-login
    sudo raspi-config nonint do_boot_behaviour B2
    
    # Enable Wayland
    sudo raspi-config nonint do_wayland W2
    
    # Create wayfire config directory
    mkdir -p "$HOME_DIR/.config"
    
    # Install on-screen keyboard if requested
    if [ "$INSTALL_KEYBOARD" = true ]; then
        log_step "Setting up on-screen keyboard"
        log_info "A browser will open to install the Chrome keyboard extension."
        log_info "You have 100 seconds to add the extension to Chrome."
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
    APP_URL="http://localhost:$SERVER_PORT"
    
    # Create final wayfire config
    log_info "Creating touchscreen autostart configuration..."
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
    
    log_success "Touchscreen UI configured"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
printf "${GREEN}║${NC}${BOLD}${WHITE}%-40s${NC}${GREEN}║${NC}\n" "     🎉 Installation Complete! 🎉"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}╭─────────────────────────────────────────╮${NC}"
printf "${CYAN}│${NC}${BOLD}${WHITE}%-41s${NC}${CYAN}│${NC}\n" " 📋 Installation Summary"
echo -e "${CYAN}├─────────────────────────────────────────┤${NC}"
printf "${CYAN}│${NC} ${WHITE}%-15s${NC} ${MAGENTA}%-22s${NC} ${CYAN}│${NC}\n" "Binary:" "$INSTALL_DIR/bar-pi-server"
printf "${CYAN}│${NC} ${WHITE}%-15s${NC} ${MAGENTA}%-22s${NC} ${CYAN}│${NC}\n" "Config:" "$INSTALL_DIR/.env"
printf "${CYAN}│${NC} ${WHITE}%-15s${NC} ${MAGENTA}%-22s${NC} ${CYAN}│${NC}\n" "Build Type:" "$BUILD_TYPE"
printf "${CYAN}│${NC} ${WHITE}%-15s${NC} ${MAGENTA}%-22s${NC} ${CYAN}│${NC}\n" "Architecture:" "$ARCH_NAME"
if [ -n "$VERSION_TAG" ]; then
    printf "${CYAN}│${NC} ${WHITE}%-15s${NC} ${MAGENTA}%-22s${NC} ${CYAN}│${NC}\n" "Version:" "$VERSION_TAG"
fi
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
if [ "$BUILD_TYPE" = "bundle" ]; then
    printf "${CYAN}│${NC} ${WHITE}%-8s${NC} ${MAGENTA}%-29s${NC} ${CYAN}│${NC}\n" "Web UI:" "http://localhost:$SERVER_PORT"
    printf "${CYAN}│${NC} ${WHITE}%-8s${NC} ${MAGENTA}%-29s${NC} ${CYAN}│${NC}\n" "API:" "http://localhost:$SERVER_PORT/api/"
else
    printf "${CYAN}│${NC} ${WHITE}%-8s${NC} ${MAGENTA}%-29s${NC} ${CYAN}│${NC}\n" "API:" "http://localhost:$SERVER_PORT/api/"
    printf "${CYAN}│${NC} ${WHITE}%-8s${NC} ${DIM}%-29s${NC} ${CYAN}│${NC}\n" "Note:" "Deploy frontend separately"
fi
printf "${CYAN}│${NC} ${WHITE}%-8s${NC} ${MAGENTA}%-29s${NC} ${CYAN}│${NC}\n" "Health:" "http://localhost:$SERVER_PORT/health"
echo -e "${CYAN}╰─────────────────────────────────────────╯${NC}"
echo ""

echo -e "${YELLOW}╭─────────────────────────────────────────╮${NC}"
printf "${YELLOW}│${NC}${BOLD}${WHITE}%-41s${NC}${YELLOW}│${NC}\n" " ⚠️ Important Security Notes"
echo -e "${YELLOW}├─────────────────────────────────────────┤${NC}"
printf "${YELLOW}│${NC} ${WHITE}%-39s${NC} ${YELLOW}│${NC}\n" "1. JWT secret has been auto-generated"
printf "${YELLOW}│${NC} ${WHITE}%-39s${NC} ${YELLOW}│${NC}\n" "2. Change the default admin password"
printf "${YELLOW}│${NC} ${WHITE}%-39s${NC} ${YELLOW}│${NC}\n" "3. Review config in $INSTALL_DIR/.env"
echo -e "${YELLOW}╰─────────────────────────────────────────╯${NC}"
echo ""

echo -e "${CYAN}╭─────────────────────────────────────────╮${NC}"
printf "${CYAN}│${NC}${BOLD}${WHITE}%-41s${NC}${CYAN}│${NC}\n" " 🗑️ Uninstall"
echo -e "${CYAN}├─────────────────────────────────────────┤${NC}"
printf "${CYAN}│${NC} ${WHITE}%-5s${NC} ${MAGENTA}%-32s${NC} ${CYAN}│${NC}\n" "Run:" "bash $(dirname "$0")/uninstall.sh"
printf "${CYAN}│${NC} ${WHITE}%-5s${NC} ${MAGENTA}%-32s${NC} ${CYAN}│${NC}\n" "Or:" "$0 --uninstall"
echo -e "${CYAN}╰─────────────────────────────────────────╯${NC}"
echo ""

echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
printf "${GREEN}║${NC}${BOLD}${WHITE}%-40s${NC}${GREEN}║${NC}\n" "     🍹 Happy cocktail making! 🍹"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
