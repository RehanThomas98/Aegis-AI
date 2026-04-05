FROM node:20

WORKDIR /app

# Install build tools needed for sqlite3 native compilation
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Install all deps and rebuild sqlite3 from source for this environment
COPY package*.json ./
RUN npm install
RUN npm rebuild sqlite3 --build-from-source

# Copy source
COPY . .

# Bake Firebase config into the build (Vite needs these at build time)
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID

RUN echo "VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY" >> .env && \
    echo "VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN" >> .env && \
    echo "VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID" >> .env && \
    echo "VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET" >> .env && \
    echo "VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID" >> .env && \
    echo "VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID" >> .env

RUN npm run build

# Create db directory and initialize the database
RUN mkdir -p db && node db/setup.js

# Remove devDeps after build to slim the image
RUN npm prune --omit=dev

EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production

CMD ["node", "aegis-server.js"]
