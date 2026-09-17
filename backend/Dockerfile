FROM node:20-alpine AS build
# OpenSSL requis pour que Prisma détecte la bonne version et télécharge le bon moteur natif
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY prisma ./prisma
RUN npx prisma generate
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine AS runtime
# libssl requis par le moteur natif Prisma (libquery_engine-linux-musl)
RUN apk add --no-cache libssl3
WORKDIR /app
ENV NODE_ENV=production
# node_modules complet depuis le build (inclut le CLI Prisma nécessaire aux migrations)
COPY --from=build /app/node_modules ./node_modules
COPY package*.json ./
COPY prisma ./prisma
COPY --from=build /app/dist ./dist
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh
EXPOSE 3000
CMD ["./docker-entrypoint.sh"]
