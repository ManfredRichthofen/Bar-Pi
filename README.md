# Bar Pi

Bar Pi is a bar management system that allows you to manage your bar's inventory, craft orders, and more. It is a rewritten frontend for the [CocktailPi project](https://github.com/alex9849/CocktailPi/). If you like this project, please consider donating to the original project.

## Features

- **Inventory Management**: Track and manage your bar's ingredients and supplies
- **Order Management**: Process and track drink orders efficiently
- **Recipe Management**: Create, edit, and manage drink recipes
- **Simple Mode**: Easy-to-use interface for quick drink ordering
- **Glass Selection**: Choose appropriate glassware for each drink
- **Customization**: Adjust drink ingredients and proportions

## RoadMap

- [ ] Shadcn UI Migration
  - [ ] Category Page
  - [X] Ingredient Page
  - [X] Recipe Page
  - [ ] Order Page
  - [X] Glasses Page
  - [X] Pumps Page
  - [X] Settings Page
- [ ] Add Mobile Support
- [ ] Add Dark Mode

## File Structure:

- `src/` - Source code
   - `pages/`
      - `AdvancedMode/`
         - `Page Name` - Page Folder
            - `index.jsx` - Page
            - `components/` - Page Specific Components
   - `components/` - Shared Components
   - `services/` - API services
   - `store/` - Zustand store
   - `translations/` - i18next translations
- `public/` - Static files
- `dist/` - Production build
- `android/` - Android app
- `ios/` - iOS app

## Tech Stack

Bar Pi is built with:

- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vite](https://vitejs.dev/)
- [Zustand](https://github.com/pmndrs/zustand)
- [Capacitor](https://capacitorjs.com/)
- [React-i18next](https://react.i18next.com/)
- [Shadcn](https://ui.shadcn.com/)

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [Git](https://git-scm.com/)

### Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/ManfredRichthofen/Bar-Pi.git
   cd bar-pi
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

### Quick Installation (Raspberry Pi)

For Raspberry Pi users, we provide a simple installation script that automates the setup process:

1. Download the install script:

   ```bash
   curl -L https://raw.githubusercontent.com/ManfredRichthofen/Bar-Pi/main/scripts/install/install.sh -o install.sh
   ```

2. Make the install script executable:

   ```bash
   chmod +x install.sh
   ```

3. Run the installation script:
   ```bash
   ./install.sh
   ```

The script will:

- Install Node.js if not present
- Download the latest release from GitHub
- Set up a systemd service for automatic startup
- Configure the web server to run on port 5000

After installation, the app will be available at `http://localhost:5000` and will start automatically on boot.

You can manage the service using these commands:

```bash
# Start the service
sudo systemctl start barpi

# Stop the service
sudo systemctl stop barpi

# Restart the service
sudo systemctl restart barpi

# Check service status
sudo systemctl status barpi
```

### Building for Production

To create a production build:

```bash
npm run build
npm run cap:build (Android Apk)
```

### Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository

2. Create a new branch:

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. Make your changes and commit them:

   ```bash
   git commit -m "Add your commit message"
   ```

4. Format and lint your code:

   ```bash
   npm run pretty
   npm run lint
   ```

5. Push to your fork:

   ```bash
   git push origin feature/your-feature-name
   ```

6. Create a pull request from your fork to our main repository

## License

[Add later]

## Acknowledgments

- [CocktailPi](https://github.com/alex9849/CocktailPi/) - The original project that inspired Bar Pi
