# syntax=docker/dockerfile:1.4

ARG NODE_VERSION=18.18.2

FROM node:${NODE_VERSION}-alpine AS base
WORKDIR /app
ENV PATH="/app/node_modules/.bin:${PATH}"

COPY package.json package-lock.json ./
RUN npm ci

FROM base AS development
CMD ["npm", "start"]

FROM base AS build
COPY . .
ARG REACT_APP_SUPABASE_URL
ARG REACT_APP_SUPABASE_ANON_KEY
ENV REACT_APP_SUPABASE_URL=${REACT_APP_SUPABASE_URL}
ENV REACT_APP_SUPABASE_ANON_KEY=${REACT_APP_SUPABASE_ANON_KEY}
RUN npm run build

FROM nginx:1.25-alpine AS production
WORKDIR /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build ./
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
