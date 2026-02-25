@echo off
setlocal enabledelayedexpansion

echo [Build Backend] Starting backend-only build (no frontend embedding)...

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
set DIST_DIR=%ROOT_DIR%\dist-backend

REM Create dist directory
if not exist "%DIST_DIR%" mkdir "%DIST_DIR%"

REM Change to backend directory
cd /d "%BACKEND_DIR%"

echo [Build Backend Embedded] Installing Go dependencies...
go mod download
go mod tidy

REM Initialize success counter
set SUCCESS_COUNT=0

REM Build for Linux AMD64 (Standard Linux)
echo [Build Backend] Building for linux/amd64...
set GOOS=linux
set GOARCH=amd64
set CGO_ENABLED=0
go build -ldflags="-s -w" -o "%DIST_DIR%\bar-pi-server-linux-amd64" ./cmd/server/main.go
if %ERRORLEVEL% EQU 0 (
    echo [Build Backend] ✓ Built bar-pi-server-linux-amd64
    set /a SUCCESS_COUNT+=1
) else (
    echo [Build Backend ERROR] Failed to build bar-pi-server-linux-amd64
)

REM Build for Linux ARM64 (Raspberry Pi 3/4/5 - 64-bit OS)
echo [Build Backend] Building for linux/arm64...
set GOOS=linux
set GOARCH=arm64
set CGO_ENABLED=0
go build -ldflags="-s -w" -o "%DIST_DIR%\bar-pi-server-linux-arm64" ./cmd/server/main.go
if %ERRORLEVEL% EQU 0 (
    echo [Build Backend] ✓ Built bar-pi-server-linux-arm64
    set /a SUCCESS_COUNT+=1
) else (
    echo [Build Backend ERROR] Failed to build bar-pi-server-linux-arm64
)

REM Build for Linux ARM (Raspberry Pi 2/3/4 - 32-bit OS)
echo [Build Backend] Building for linux/arm...
set GOOS=linux
set GOARCH=arm
set GOARM=7
set CGO_ENABLED=0
go build -ldflags="-s -w" -o "%DIST_DIR%\bar-pi-server-linux-arm" ./cmd/server/main.go
if %ERRORLEVEL% EQU 0 (
    echo [Build Backend] ✓ Built bar-pi-server-linux-arm
    set /a SUCCESS_COUNT+=1
) else (
    echo [Build Backend ERROR] Failed to build bar-pi-server-linux-arm
)

echo.
echo [Build Backend] Build complete: %SUCCESS_COUNT%/3 successful
echo [Build Backend] Backend binaries built without embedded frontend

if %SUCCESS_COUNT% EQU 0 (
    exit /b 1
)

endlocal
