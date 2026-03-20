To install dependencies:

```sh
bun install
```

To run:

```sh
bun run dev --hostname 0.0.0.0 --port 3011
```

open http://localhost:3011

Environment setup:

```sh
cp .env.example .env.local
```

## Docker setup

### Using docker-compose (recommended)

Production-style (no local override):

```sh
docker compose -f docker-compose.yml up -d --build
```

Local development (uses docker-compose.override.yml + .env.local):

```sh
docker compose up -d --build
```

View logs:

```sh
docker compose logs -f web
```

Stop:

```sh
docker compose down
```

### Using docker build + run

Build image:

```sh
docker build -t fam-finance-web .
```

Run container:

```sh
docker run --rm -p 3011:3011 --env-file .env.local fam-finance-web
```

### Health check

```sh
curl http://localhost:3011
```
