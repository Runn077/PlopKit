FROM node:latest

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

ARG DATABASE_URL=postgresql://user:password@localhost:5432/db
ENV DATABASE_URL=${DATABASE_URL}

RUN npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/index.js"]