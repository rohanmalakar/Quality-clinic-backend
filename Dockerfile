FROM node:23

WORKDIR /app

COPY package*.json ./

RUN yarn install

# Install nodemon globally for automatic reloads
RUN yarn add nodemon

COPY . .

EXPOSE 3001
