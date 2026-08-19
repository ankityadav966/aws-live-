FROM node:20-alpine AS builder

WORKDIR /app

# Install OpenSSL for Prisma compatibility
RUN apk add --no-cache openssl

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code and Prisma schema
COPY . .

# Generate Prisma Client & compile TypeScript
RUN npx prisma generate
RUN npm run build

# Production Runner Stage
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV PORT=5000

# Copy necessary production files from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist

EXPOSE 5000

# Start production server
CMD ["node", "dist/server.js"]
