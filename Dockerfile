FROM node:22-bookworm-slim

# Install Chromium, FFmpeg, and required system libraries for Puppeteer
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    ffmpeg \
    fonts-liberation \
    fonts-noto-color-emoji \
    fonts-noto-cjk \
    libasound2 \
    libatk-bridge2.0-0 \
    libgbm1 \
    libgtk-3-0 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Use system Chromium — skip Puppeteer's bundled download
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV CHROME_PATH=/usr/bin/chromium
ENV FFMPEG_PATH=/usr/bin/ffmpeg

WORKDIR /app

# Install ALL dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

ENV NODE_ENV=production

EXPOSE 3000

# Run the plain JS render worker — no tsx needed, instant startup
CMD ["node", "render-worker.mjs"]
