FROM node:20

WORKDIR /app

# Install build tools needed for sqlite3 native compilation
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Install all deps and rebuild sqlite3 from source for this environment
COPY package*.json ./
RUN npm install
RUN npm rebuild sqlite3 --build-from-source

# Copy source and build frontend
COPY . .
RUN npm run build

# Create db directory and initialize the database
RUN mkdir -p db && node db/setup.js

# Remove devDeps after build to slim the image
RUN npm prune --omit=dev

EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production

CMD ["node", "aegis-server.js"]
