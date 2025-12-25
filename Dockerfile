FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN yarn install --production

COPY . .

EXPOSE 3001

CMD ["node", "index.js"]
