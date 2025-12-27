# syntax=docker/dockerfile:1
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat git
WORKDIR /app
COPY . .
RUN npm i -g mintlify

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /usr/local /usr/local
COPY --from=builder /app /app
EXPOSE 3000
CMD ["sh", "-lc", "mintlify dev --host 0.0.0.0 --port 3000"]
