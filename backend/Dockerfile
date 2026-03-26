# Use an official Node.js runtime as a parent image
FROM node:14

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install any needed packages
RUN npm install

# Bundle app source
COPY . .

# Make port 5000 available to the world outside this container
EXPOSE 5000

# Define environment variables
ENV DATABASE_URL=postgres://user:password@postgres:5432/todo_db
ENV JWT_SECRET=your_jwt_secret

# Run app when the container launches
CMD ["npm", "start"]
