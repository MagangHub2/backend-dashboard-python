FROM node:20-alpine

WORKDIR /app

# Install dependencies for QR code display
RUN apk add --no-cache python3 make g++

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Create auth_info directory
RUN mkdir -p auth_info

# Set environment
ENV NODE_ENV=development

EXPOSE 3000

# Use node directly for better signal handling
CMD ["node", "src/server.js"]
