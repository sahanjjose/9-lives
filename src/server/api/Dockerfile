# Use Node.js LTS image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package files first (for caching)
COPY package.json package-lock.json ./

RUN apt-get update && apt-get install -y \
    build-essential \
    python3

# Install dependencies
RUN npm ci  # Faster, consistent installs
RUN  npm install argon2 --verbose

# Copy files into working directory
COPY . .

# Expose port 5000
EXPOSE 5000

# Run the server
CMD ["node", "index.js"]