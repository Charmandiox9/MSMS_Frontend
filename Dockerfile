FROM node:20-alpine AS base

# Dependencias necesarias para Node en Alpine
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 1. Dependencias (Install)
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# 2. Compilación (Build)
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Deshabilitamos la telemetría de Next.js
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# 3. Producción (Runner)
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Solo copiamos los archivos de la build standalone (necesita output: 'standalone' en next.config.ts)
COPY --from=builder /app/public ./public
# Otorga permisos al usuario nextjs
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3001

ENV PORT 3001
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
