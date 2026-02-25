@echo off
setlocal enabledelayedexpansion

echo [Build All] Starting full build with embedded frontend...

REM Check if Go is installed
where go >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Go is not installed or not in PATH
    exit /b 1
)

REM Show Go version
for /f "tokens=*" %%i in ('go version') do set GO_VERSION=%%i
echo Go version: %GO_VERSION%

REM Set directories
set ROOT_DIR=%~dp0..
set BACKEND_DIR=%ROOT_DIR%\backend-go
set FRONTEND_DIST=%ROOT_DIR%\dist
set BACKEND_STATIC=%BACKEND_DIR%\internal\static\dist
set DIST_DIR=%ROOT_DIR%\dist-backend

REM Check if frontend is built
if not exist "%FRONTEND_DIST%" (
    echo [ERROR] Frontend dist not found. Please run 'npm run build' first.
    exit /b 1
)

REM Create dist directory
if not exist "%DIST_DIR%" mkdir "%DIST_DIR%"

REM Copy frontend dist to backend static folder
echo [Build All] Copying frontend files to backend...
if exist "%BACKEND_STATIC%" (
    rmdir /s /q "%BACKEND_STATIC%"
)
mkdir "%BACKEND_STATIC%"
xcopy /E /I /Y "%FRONTEND_DIST%" "%BACKEND_STATIC%" >nul

REM Change to backend directory
cd /d "%BACKEND_DIR%"

echo [Build All] Installing Go dependencies...
go mod download
go mod tidy

REM Initialize success counter
set SUCCESS_COUNT=0

REM Build for Linux AMD64 (Standard Linux)
echo [Build All] Building for linux/amd64 with embedded frontend...
set GOOS=linux
set GOARCH=amd64
set CGO_ENABLED=0
go build -tags=bundle -ldflags="-s -w" -o "%DIST_DIR%\bar-pi-bundle-linux-amd64" ./cmd/server/main.go
if %ERRORLEVEL% EQU 0 (
    echo [Build All] ✓ Built bar-pi-server-linux-amd64
    set /a SUCCESS_COUNT+=1
) else (
    echo [Build All ERROR] Failed to build bar-pi-server-linux-amd64
)

REM Build for Linux ARM64 (Raspberry Pi 3/4/5 - 64-bit OS)
echo [Build All] Building for linux/arm64 with embedded frontend...
set GOOS=linux
set GOARCH=arm64
set CGO_ENABLED=0
go build -tags=bundle -ldflags="-s -w" -o "%DIST_DIR%\bar-pi-bundle-linux-arm64" ./cmd/server/main.go
if %ERRORLEVEL% EQU 0 (
    echo [Build All] ✓ Built bar-pi-server-linux-arm64
    set /a SUCCESS_COUNT+=1
) else (
    echo [Build All ERROR] Failed to build bar-pi-server-linux-arm64
)

REM Build for Linux ARM (Raspberry Pi 2/3/4 - 32-bit OS)
echo [Build All] Building for linux/arm with embedded frontend...
set GOOS=linux
set GOARCH=arm
set GOARM=7
set CGO_ENABLED=0
go build -tags=bundle -ldflags="-s -w" -o "%DIST_DIR%\bar-pi-bundle-linux-arm" ./cmd/server/main.go
if %ERRORLEVEL% EQU 0 (
    echo [Build All] ✓ Built bar-pi-server-linux-arm
    set /a SUCCESS_COUNT+=1
) else (
    echo [Build All ERROR] Failed to build bar-pi-server-linux-arm
)

echo.
echo [Build All] Build complete: %SUCCESS_COUNT%/3 successful
echo [Build All] Frontend files are embedded in the binaries

REM Clean up copied frontend files
echo [Build All] Cleaning up temporary files...
rmdir /s /q "%BACKEND_STATIC%"

if %SUCCESS_COUNT% EQU 0 (
    exit /b 1
)

endlocal
