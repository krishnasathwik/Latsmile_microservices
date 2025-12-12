FROM node:20-alpine

WORKDIR /app

# Install service dependencies
COPY Backend/services/location_service/package*.json ./
RUN npm install

# Copy COMMON folder (including utils + middleware)
COPY Backend/common ./common

# Copy protos
COPY Backend/services/protos /protos

# Copy location-service source
COPY Backend/services/location_service/src ./src

EXPOSE 4004

CMD ["node", "src/app.js"]
