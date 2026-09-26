# ---- Base ----
FROM node:24-alpine AS base

WORKDIR /app

# ---- Dependencies ----
FROM base AS dependencies

COPY package*.json ./

# Install dependencies from the lockfile
RUN npm ci

# ---- Build ----
FROM dependencies AS build

COPY . .

# Build React/Vue/Angular bundle if needed
# RUN npm run build

# ---- Release ----
FROM node:24-alpine AS release

WORKDIR /app

# Copy package metadata and installed dependencies
COPY --from=dependencies /app/package*.json ./
COPY --from=dependencies /app/node_modules ./node_modules

# Copy application source
COPY --from=build /app ./

EXPOSE 4000

CMD ["node", "server.js"]