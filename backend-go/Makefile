.PHONY: build run test clean dev install

build:
	go build -o bin/server cmd/server/main.go

run: build
	./bin/server

dev:
	go run cmd/server/main.go

test:
	go test -v ./...

clean:
	rm -rf bin/
	rm -f *.db *.db-shm *.db-wal

install:
	go mod download
	go mod tidy

lint:
	golangci-lint run

docker-build:
	docker build -t cocktailpi-backend .

docker-run:
	docker run -p 8080:8080 cocktailpi-backend
