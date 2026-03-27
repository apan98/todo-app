# Frontend
FROM node:16

WORKDIR /usr/src/app

COPY frontend/package*.json ./

RUN npm install

COPY frontend/ .

CMD [ "npm", "start" ]
