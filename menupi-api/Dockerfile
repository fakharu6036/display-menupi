# MENUPI API - Dockerfile for Fly.io
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy application files
COPY . .

# Create uploads directory
RUN mkdir -p uploads && chmod 755 uploads

# Expose port (Fly.io will set PORT env var)
EXPOSE 3001

# Start the server
CMD ["node", "server.js"]

