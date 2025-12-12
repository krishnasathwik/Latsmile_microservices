FROM node:20-alpine

WORKDIR /app

COPY Backend/services/rider_service/package*.json ./
RUN npm install

COPY Backend/common ./common

COPY Backend/services/protos /protos

COPY Backend/services/rider_service/src ./src

EXPOSE 4003 50054

CMD ["node", "src/app.js"]
