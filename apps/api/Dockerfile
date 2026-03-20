FROM oven/bun:1.3.9-slim
WORKDIR /app

# Install only runtime dependencies based on lockfile
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# Copy application source
COPY . .

ENV NODE_ENV=production
ENV PORT=3010
EXPOSE 3010

CMD ["bun", "run", "src/index.ts"]
