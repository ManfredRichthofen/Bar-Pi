# Bar Pi

Bar Pi is a bar management system built on top of the [CocktailPi project](https://github.com/alex9849/CocktailPi/). The backend (Beta) is written in Go and the frontend is written in React. If you find this useful, consider supporting the original CocktailPi project that made it possible.

## What It Does

Bar Pi helps you run an automated cocktail bar. Track your ingredients, manage recipes, and process drink orders through a clean web interface. Whether you're building a home bar setup or something more ambitious, Bar Pi gives you the tools to make it happen.

The system includes inventory tracking, recipe management, and a simplified ordering interface. You can adjust drink proportions, select appropriate glassware, and keep everything organized in one place.

## Current Status

## Getting Started

### For Developers

You'll need [Bun](https://bun.sh), [Rust](https://www.rust-lang.org/tools/install), and Git installed. Then:

```bash
git clone https://github.com/ManfredRichthofen/Bar-Pi.git
cd bar-pi
bun install
bun run dev
```

Or use the setup script:

```bash
curl -L https://raw.githubusercontent.com/ManfredRichthofen/Bar-Pi/main/scripts/install/install-dev.sh -o install-dev.sh
chmod +x install-dev.sh
./install-dev.sh
```

The development server will start, and you can begin making changes immediately.

For the Windows desktop thin client:

```bash
bun run tauri:dev
```

### For Raspberry Pi Users

We've built an automated installer that handles everything. Download and run it:

```bash
curl -L https://raw.githubusercontent.com/ManfredRichthofen/Bar-Pi/main/scripts/install/install-go.sh -o install-go.sh
chmod +x install-go.sh
./install-go.sh
```

The installer downloads the latest release and configures a systemd service that starts on boot. Once finished, access the interface at `http://localhost:8080`.

Manage the service with standard systemd commands:

```bash
sudo systemctl start bar-pi    # Start
sudo systemctl stop bar-pi     # Stop
sudo systemctl restart bar-pi  # Restart
sudo systemctl status bar-pi   # Check status
```

For detailed installation options and troubleshooting, see `INSTALL_GUIDE.md`.

Pi kiosk / Python frontend installs are unchanged and do not use Tauri.

## Building for Production

Create production builds with:

```bash
bun run build                 # Web version (dist/)
bun run tauri:build           # Windows desktop installer (NSIS)
bun run tauri:android:build   # Android APK
```

The Tauri Windows and Android apps are thin clients: they ship the UI and connect to a reachable Bar-Pi / CocktailPi backend via the API URL configured on the login screen.

## Project Structure

The codebase is organized for clarity:

- `src/` contains all source code
  - `pages/AdvancedMode/` holds page components with their specific logic
  - `components/` contains shared UI components
  - `services/` manages API communication
  - `store/` handles state with Zustand
  - `translations/` provides i18next language files
- `backend-go/` contains the Go backend server
- `src-tauri/` contains the Tauri 2 shell (Windows desktop + Android)
- `public/` stores static assets

## Technology Stack

- React for the UI
- Tailwind CSS and Shadcn for styling and components
- Vite and Bun for building
- Zustand for state management
- Tauri 2 for Windows desktop and Android APK
- React-i18next for internationalization
- Go for the backend API

## Contributing

Contributions are welcome. Fork the repository, create a feature branch, make your changes, and submit a pull request. Please run `bun run format` and `bun run lint` before submitting to maintain code consistency.

## Acknowledgments

This project builds directly on [CocktailPi](https://github.com/alex9849/CocktailPi/) by alex9849. Without that foundation, Bar Pi wouldn't exist.
