# Bar Pi

Bar Pi is a bar management system built on top of the [CocktailPi project](https://github.com/alex9849/CocktailPi/). THe backend (Beta) is written in Go and the frontend is written in React. If you find this useful, consider supporting the original CocktailPi project that made it possible.

## What It Does

Bar Pi helps you run an automated cocktail bar. Track your ingredients, manage recipes, and process drink orders through a clean web interface. Whether you're building a home bar setup or something more ambitious, Bar Pi gives you the tools to make it happen.

The system includes inventory tracking, recipe management, and a simplified ordering interface. You can adjust drink proportions, select appropriate glassware, and keep everything organized in one place.

## Current Status

## Getting Started

### For Developers

You'll need Node.js (v16+) and Git installed. Then:

```bash
git clone https://github.com/ManfredRichthofen/Bar-Pi.git
cd bar-pi
npm install
npm run dev
```

The development server will start, and you can begin making changes immediately.

### For Raspberry Pi Users

We've built an automated installer that handles everything. Download and run it:

```bash
curl -L https://raw.githubusercontent.com/ManfredRichthofen/Bar-Pi/main/scripts/install/install.sh -o install.sh
chmod +x install.sh
./install.sh
```

The installer will set up Node.js, download the latest release, and configure a systemd service that starts on boot. Once finished, access the interface at `http://localhost:5000`.

Manage the service with standard systemd commands:

```bash
sudo systemctl start barpi    # Start
sudo systemctl stop barpi     # Stop
sudo systemctl restart barpi  # Restart
sudo systemctl status barpi   # Check status
```

For detailed installation options and troubleshooting, see `INSTALL_GUIDE.md`.

## Building for Production

Create production builds with:

```bash
npm run build              # Web version
npm run cap:build          # Android APK
```

## Project Structure

The codebase is organized for clarity:

- `src/` contains all source code
  - `pages/AdvancedMode/` holds page components with their specific logic
  - `components/` contains shared UI components
  - `services/` manages API communication
  - `store/` handles state with Zustand
  - `translations/` provides i18next language files
- `backend-go/` contains the Go backend server
- `android/` and `ios/` hold mobile app configurations
- `public/` stores static assets

## Technology Stack

- React for the UI
- Tailwind CSS and Shadcn for styling and components
- Vite for building
- Zustand for state management
- Capacitor for mobile deployment
- React-i18next for internationalization
- Go for the backend API

## Contributing

Contributions are welcome. Fork the repository, create a feature branch, make your changes, and submit a pull request. Please run `npm run format` and `npm run lint` before submitting to maintain code consistency.

## Acknowledgments

This project builds directly on [CocktailPi](https://github.com/alex9849/CocktailPi/) by alex9849. Without that foundation, Bar Pi wouldn't exist.
