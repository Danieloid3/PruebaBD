# Dockerfile
FROM node:20-alpine

WORKDIR /usr/src/app

# Copiamos solo package*.json primero para aprovechar cache
COPY package*.json ./

RUN npm install --production

# Copiar resto del código
COPY . .

# Exponer puerto interno
EXPOSE 3000

# Comando de arranque
CMD ["npm", "start"]
