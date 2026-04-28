# Use Node.js LTS as the base image
FROM node:18

# Set working directory
WORKDIR /app

# Copy only package manifests to leverage Docker layer caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy the rest of your source
COPY . .

# Ensure the bundler listens on all interfaces
ENV HOST=0.0.0.0
ENV PORT=8081

# Expose Metro/Webpack port
EXPOSE 8081

# Start the web server
# Assumes you have a "web" script in package.json, e.g.:
#   "scripts": {
#     "web": "react-native start --web --port 8081 --host 0.0.0.0"
#   }
CMD ["npm", "run", "web"]