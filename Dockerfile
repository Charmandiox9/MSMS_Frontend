ARG NODE_IMAGE=node:22-alpine@sha256:0a7108bf6c7bf5de370ffb1a3ed6be93d405b43ff159f681a8d18c0e2bc2e402
FROM ${NODE_IMAGE} AS base

# Dependencias necesarias para Node en Alpine
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 1. Dependencias (Install)
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

# 2. Compilación (Build)
FROM deps AS test
COPY . .
CMD ["npm", "test"]

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_API_URL=/api/graphql
ARG NEXT_PUBLIC_BASE_PATH=
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_BASE_PATH=$NEXT_PUBLIC_BASE_PATH
# Deshabilitamos la telemetría de Next.js
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# 3. Producción (Runner)
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_BASE_PATH=
ENV NEXT_PUBLIC_BASE_PATH=$NEXT_PUBLIC_BASE_PATH

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Solo copiamos los archivos de la build standalone (necesita output: 'standalone' en next.config.ts)
COPY --from=builder /app/public ./public
# Otorga permisos al usuario nextjs
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3001

ENV PORT=3001
ENV HOSTNAME=0.0.0.0

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 CMD node -e "fetch('http://127.0.0.1:3001'+process.env.NEXT_PUBLIC_BASE_PATH+'/api/runtime-config').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
