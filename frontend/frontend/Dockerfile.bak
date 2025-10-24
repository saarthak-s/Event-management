FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

RUN apk add --no-cache openssl

COPY . .

RUN npm run build

RUN npm install -g serve

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]
