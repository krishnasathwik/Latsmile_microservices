FROM node:20-alpine

WORKDIR /app

COPY Backend/services/station_service/package*.json ./
RUN npm install

COPY Backend/common ./common

COPY Backend/services/protos /protos

COPY Backend/services/station_service/src ./src

EXPOSE 5002 3006

CMD ["node", "src/app.js"]
