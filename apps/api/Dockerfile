FROM oven/bun:1.1-slim AS base
WORKDIR /app

# Tahap Install
FROM base AS install
RUN mkdir -p /temp/dev
# COPY secara eksplisit dari direktori saat ini
COPY package.json /temp/dev/
COPY bun.lock* /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# Tahap Prerelease
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

# Tahap Akhir (Release)
FROM base AS release
WORKDIR /app
COPY --from=prerelease /app/src ./src
COPY --from=prerelease /app/package.json .
COPY --from=prerelease /app/node_modules ./node_modules

EXPOSE 3000
CMD ["bun", "run", "src/index.ts"]
