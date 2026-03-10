FROM oven/bun:1.1-slim AS base
WORKDIR /app

# Install dependencies
FROM base AS install
RUN mkdir -p /temp/dev
# Gunakan wildcard agar mendukung bun.lock maupun bun.lockb
COPY package.json bun.lock* /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# Copy node_modules and source code
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

# Final stage
FROM base AS release
COPY --from=prerelease /app/src /app/src
COPY --from=prerelease /app/package.json .
COPY --from=prerelease /app/node_modules node_modules

# Expose port
EXPOSE 3000

# Run the app
CMD ["bun", "run", "src/index.ts"]
