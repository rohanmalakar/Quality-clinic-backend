FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json ./

# Install all dependencies (including dev dependencies needed for build)
RUN npm install

# Copy source code
COPY . .

# Build TypeScript to JavaScript
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

EXPOSE 3001

# Run the compiled JavaScript
CMD ["node", "dist/app.js"]
