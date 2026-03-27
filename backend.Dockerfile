# Backend
FROM node:16

WORKDIR /usr/src/app

COPY backend/package*.json ./

RUN npm install

COPY backend/ .

RUN chmod +x ./entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]

CMD [ "npm", "start" ]
