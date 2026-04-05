FROM node:20-slim

WORKDIR /app

# Install all deps (including devDeps for vite build)
COPY package*.json ./
RUN npm install

# Copy source and build frontend
COPY . .
RUN npm run build

# Remove devDeps after build to slim the image
RUN npm prune --omit=dev

EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production

CMD ["node", "aegis-server.js"]
