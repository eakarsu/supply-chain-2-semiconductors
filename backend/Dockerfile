FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup -S semichain && adduser -S semichain -G semichain
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json db.js server.js ./
COPY middleware ./middleware
COPY routes/auth.js routes/traceability.js ./routes/
COPY src ./src
COPY migrations ./migrations
COPY scripts ./scripts
USER semichain
EXPOSE 3015
CMD ["node", "server.js"]
