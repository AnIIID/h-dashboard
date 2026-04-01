FROM node:22-alpine

RUN apk add --no-cache python3 make g++ vips-dev

ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

RUN mkdir -p data uploads

EXPOSE 3000

CMD ["node", "server.js"]
