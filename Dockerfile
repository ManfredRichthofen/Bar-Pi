# Use Node.js as base image
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all other source code
COPY . .

# Build the app
RUN npm run build

# Install serve globally to serve the built files
RUN npm install -g serve

# Expose the default Vite port
EXPOSE 5173

# Serve the built application
CMD ["serve", "-s", "dist", "-l", "5173"] 