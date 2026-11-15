FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# আপনার সার্ভার যে পোর্টে চলে (সাধারণত 5000)
EXPOSE 5000

CMD ["npm", "start"]