# Build widget
FROM node:latest AS widget-builder

WORKDIR /widget

COPY widget-svelte/package*.json ./
RUN npm ci

COPY widget-svelte .

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Build platform
FROM node:latest AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL
ARG VITE_APP_URL
ARG VITE_AUTH_URL

RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80