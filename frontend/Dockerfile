# Dockerfile para Frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY vitest.config.ts ./

# Instalar dependencias
RUN npm ci && npm cache clean --force

# Copiar código fuente
COPY src ./src
COPY public ./public
COPY index.html ./

# Build para producción
RUN npm run build

# Etapa de producción con nginx
FROM nginx:alpine AS runner

# Crear usuario no-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copiar archivos construidos
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuración personalizada de nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Cambiar propiedad de archivos
RUN chown -R nodejs:nodejs /usr/share/nginx/html
RUN chown -R nodejs:nodejs /var/cache/nginx
RUN chown -R nodejs:nodejs /var/log/nginx
RUN chown -R nodejs:nodejs /etc/nginx/conf.d
RUN touch /var/run/nginx.pid
RUN chown -R nodejs:nodejs /var/run/nginx.pid

# Exponer puerto
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Cambiar a usuario no-root
USER nodejs

# Comando de inicio
CMD ["nginx", "-g", "daemon off;"]