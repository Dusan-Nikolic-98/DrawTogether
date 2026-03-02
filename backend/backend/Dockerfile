# Koristi se Node.js slika
FROM node:16

# radni direktorijum se postavi unutar kontejnera
WORKDIR /app

# kopiranje package fajlova i instaliranje zavisnosti
COPY package*.json ./
RUN npm install

# kopiranje celog projekta u radni direktorijum
COPY . .

# kreiranje build za TypeScript
RUN npm run build

# otvaranje porta na kojem backend server slusa
EXPOSE 3001

# pokretanje backend aplikaciju
CMD ["npm", "start"]

