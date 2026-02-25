.PHONY: build run test clean dev install lint
.PHONY: build-all build-linux build-darwin build-arm

# Default build for current platform
build:
	go build -ldflags="-s -w" -o bin/server cmd/server/main.go

# Run the server
run: build
	./bin/server

# Development mode with hot reload
dev:
	go run cmd/server/main.go

# Run tests
test:
	go test -v ./...

# Clean build artifacts and database files
clean:
	rm -rf bin/
	rm -rf ../dist-backend/
	rm -f *.db *.db-shm *.db-wal

# Install and tidy dependencies
install:
	go mod download
	go mod tidy

# Run linter
lint:
	golangci-lint run

# Build for all platforms
build-all: build-linux

# Linux builds
build-linux:
	GOOS=linux GOARCH=arm64 CGO_ENABLED=1 go build -ldflags="-s -w" -o ../dist-backend/bar-pi-server-linux-arm64 cmd/server/main.go
	GOOS=linux GOARCH=arm GOARM=7 CGO_ENABLED=1 go build -ldflags="-s -w" -o ../dist-backend/bar-pi-server-linux-arm cmd/server/main.go

# Raspberry Pi optimized build
build-arm:
	GOOS=linux GOARCH=arm GOARM=7 CGO_ENABLED=1 go build -ldflags="-s -w" -o ../dist-backend/bar-pi-server-linux-arm cmd/server/main.go
	GOOS=linux GOARCH=arm64 CGO_ENABLED=1 go build -ldflags="-s -w" -o ../dist-backend/bar-pi-server-linux-arm64 cmd/server/main.go
