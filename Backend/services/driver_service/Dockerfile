FROM node:20-alpine

WORKDIR /app

# Copy package files FIRST (to allow caching)
COPY Backend/services/driver_service/package*.json ./

# Install dependencies (dotenv will be installed here)
RUN npm install

# Copy COMMON folder INSIDE app (so Node can resolve modules properly)
COPY Backend/common ./common

# Copy protos
COPY Backend/services/protos /protos

# Copy service source code
COPY Backend/services/driver_service/src ./src

EXPOSE 3002 50052

CMD ["node", "src/app.js"]
