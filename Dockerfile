# Adjust NODE_VERSION as desired
ARG NODE_VERSION=21.7.1
FROM node:${NODE_VERSION}-slim as base

# Configure default locale (important for chrome-headless-shell)
ENV LANG en_US.UTF-8

# Install latest chrome dev package and fonts to support major charsets (Chinese, Japanese, Arabic, Hebrew, Thai and a few others)
# Note: this installs the necessary libs to make the bundled version of Chrome that Puppeteer installs, work.
# you can remove this step to avoid installing puppeteer, thus reducing the final size.
RUN apt-get update && apt-get install gnupg wget -y && \
  wget --quiet --output-document=- https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor > /etc/apt/trusted.gpg.d/google-archive.gpg && \
  sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' && \
  apt-get update && \
  apt-get install google-chrome-stable -y --no-install-recommends && \
  apt-get install which -y && \
  rm -rf /var/lib/apt/lists/*

# Set the working directory to /app
WORKDIR /app

# Copy package files and install node modules and skip chrome from puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
COPY package-lock.json package.json ./
RUN npm ci

# Copy application code
COPY . .

# Set environment variables
ENV NODE_ENV="production"
ENV APP_HOST=0.0.0.0
ENV APP_PORT=8080
ENV TZ=Asia/Riyadh 

# Start the application
CMD [ "npm", "run", "start" ]
