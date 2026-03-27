# Backend
FROM node:16

WORKDIR /usr/src/app

COPY backend/package*.json ./

RUN npm install

COPY backend/ .

# Make the entrypoint script executable
RUN chmod +x /usr/src/app/entrypoint.sh

# Set the entrypoint
ENTRYPOINT ["/usr/src/app/entrypoint.sh"]

# The default command to run
CMD [ "npm", "start" ]
