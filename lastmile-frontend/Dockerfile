# Stage 1 — Build
FROM node:20-alpine AS build

WORKDIR /app

# Copy package.json from correct folder
COPY lastmile-frontend/package*.json ./

RUN npm install

# Copy all frontend source code
COPY lastmile-frontend/ .

RUN npm run build

# Stage 2 — Serve static files
FROM nginx:stable-alpine

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
