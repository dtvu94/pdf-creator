# ─── Stage 1: Install dependencies ───────────────────────────────────────────
# All dependencies are needed here (including devDependencies for TypeScript
# compilation and Next.js build tooling).
FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

# ─── Stage 2: Build the application ──────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Disable Next.js telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ─── Stage 3: Production runner ───────────────────────────────────────────────
# Only the runtime artefacts are copied, keeping the image small.
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Create a non-root user for security.
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Copy build output and runtime dependencies.
COPY --from=builder --chown=nextjs:nodejs /app/.next     ./.next
COPY --from=builder                       /app/node_modules ./node_modules
COPY --from=builder                       /app/package.json ./package.json
COPY --from=builder                       /app/public    ./public

USER nextjs

EXPOSE 3000

# `next start` serves the pre-built production bundle.
CMD ["npm", "start"]
