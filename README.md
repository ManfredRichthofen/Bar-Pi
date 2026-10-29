# Bar Pi

Bar Pi is a bar management system built on top of the [CocktailPi project](https://github.com/alex9849/CocktailPi/). The backend (Beta) is written in Go and the frontend is written in React. If you find this useful, consider supporting the original CocktailPi project that made it possible.

## What It Does

Bar Pi helps you run an automated cocktail bar. Track your ingredients, manage recipes, and process drink orders through a clean web interface. Whether you're building a home bar setup or something more ambitious, Bar Pi gives you the tools to make it happen.

The system includes inventory tracking, recipe management, and a simplified ordering interface. You can adjust drink proportions, select appropriate glassware, and keep everything organized in one place.

## Getting Started

### For Developers

You'll need [Bun](https://bun.sh), [Rust](https://www.rust-lang.org/tools/install), and Git installed. Then:

```bash
git clone https://github.com/ManfredRichthofen/Bar-Pi.git
cd Bar-Pi
bun install
bun run dev
```

Or use the setup script:

```bash
curl -L https://raw.githubusercontent.com/ManfredRichthofen/Bar-Pi/main/scripts/install/install-dev.sh -o install-dev.sh
chmod +x install-dev.sh
./install-dev.sh
```

The development server starts at `http://localhost:5173` (it listens on all interfaces, so other devices on your network can reach it too). Point the login screen at a running Bar-Pi or CocktailPi backend, for example `http://localhost:8080`.

Before opening a pull request, run:

```bash
bun run check            # format + lint with Biome
bunx tsc --noEmit        # type-check
bun run build            # confirm the production build succeeds
```

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
- Tailwind CSS and Base UI for styling and components
- Vite and Bun for building
- Zustand for state management
- Tauri 2 for Windows desktop and Android APK
- React-i18next for internationalization
- Go for the backend API

## Frontend Conventions

**Fetching and caching.** Server data is cached with TanStack Query (default `staleTime` is 5 minutes). Any successful `POST`, `PATCH` or `DELETE` made through the shared axios client (`src/lib/apiClient.ts`) automatically marks all cached queries stale, so lists refresh after you add, edit or delete something. `PUT` requests do not trigger this. If a `PUT` changes data a list shows, call `queryClient.invalidateQueries({ queryKey: [...] })` yourself. Do not copy query results into Zustand stores unless you need them outside React (WebSocket updates are the existing exception).

**Authentication on load.** The saved token is restored in `src/main.tsx` before the router starts, because route guards (`beforeLoad`) run before React mounts. Read auth state in guards with `useAuthStore.getState()`.

**Performance guidelines.**

- Routes are code-split automatically. Keep heavy libraries (charts, editors) inside the page that uses them, and import them lazily if they are large.
- Use `@tanstack/react-virtual` for long lists (recipes, ingredients) instead of rendering every row.
- Select only what you need from a Zustand store (`useStore((s) => s.field)`) so components do not re-render on unrelated changes.
- Dev-only tools such as the router devtools must stay behind `import.meta.env.DEV`.
- Serve images at the size they are shown, and lazy-load them (`useLazyImage`). The login backgrounds are the largest files in `dist/`.
- The Raspberry Pi kiosk browser is the slowest target. Check changes there, and prefer opacity/transform animations over animating layout.
- To inspect bundle size after a build, check the sizes Vite prints at the end of `bun run build`.

## Contributing

Contributions are welcome. Fork the repository, create a feature branch, make your changes, and submit a pull request. Please run `bun run check` and `bunx tsc --noEmit` before submitting to maintain code consistency.

## Acknowledgments

This project builds directly on [CocktailPi](https://github.com/alex9849/CocktailPi/) by alex9849. Without that foundation, Bar Pi wouldn't exist.
