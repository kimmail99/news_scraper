FROM node:20-slim

# chromium 설치
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libnspr4 \
    libnss3 \
    libxshmfence1 \
    libpango-1.0-0 \
    libcairo2 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 패키지 파일 먼저
COPY package.json ./
RUN npm install

# 코드 복사
COPY . .

# puppeteer chromium 경로
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# 🔥 핵심
CMD ["node"]