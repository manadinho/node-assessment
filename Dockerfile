FROM node:14.21.3-alpine 

WORKDIR /app

EXPOSE 3000

COPY package*.json ./

RUN npm install

COPY . ./

ENTRYPOINT npx sequelize db:migrate && node index.js
