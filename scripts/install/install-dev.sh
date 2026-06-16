#!/bin/bash

set -e

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

echo "Setting up Bar-Pi development environment..."

if ! command_exists bun; then
    echo "Bun not found. Installing Bun..."
    curl -fsSL https://bun.sh/install | bash

    export BUN_INSTALL="${BUN_INSTALL:-$HOME/.bun}"
    export PATH="$BUN_INSTALL/bin:$PATH"
fi

echo "Bun version: $(bun --version)"

cd "$REPO_ROOT"

echo "Installing dependencies..."
bun install

echo ""
echo "Development setup complete."
echo "Run 'bun run dev' to start the development server."
