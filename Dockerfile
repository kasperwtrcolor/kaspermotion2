# Use Node.js 20 base image
FROM node:20-slim

# Install system dependencies for FFmpeg and Chrome (Puppeteer)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libnss3 \
    libatk1.0-0 \
    libcups2 \
    libdrm2 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpangocairo-1.0-0 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Install Google Chrome
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.chrome.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables for Puppeteer and FFmpeg
ENV CHROME_PATH=/usr/bin/google-chrome-stable
ENV FFMPEG_PATH=/usr/bin/ffmpeg
ENV NODE_ENV=production

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the frontend
RUN npm run build

# Expose the server port
EXPOSE 3000

# Start the server using tsx
CMD ["npm", "start"]
