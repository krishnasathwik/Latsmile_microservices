FROM node:20-alpine

WORKDIR /app

COPY Backend/services/matching_service/package*.json ./
RUN npm install

COPY Backend/common ./common
COPY Backend/services/protos /protos

COPY Backend/services/matching_service/src ./src

EXPOSE 50053 3005

CMD ["node", "src/app.js"]
