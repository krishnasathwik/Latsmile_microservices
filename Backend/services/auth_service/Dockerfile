FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY Backend/services/auth_service/package*.json ./
RUN npm install

# Copy shared COMMON folder
COPY Backend/common ./common

# Copy PROTO files
COPY Backend/services/protos /protos


# Copy service source code
COPY Backend/services/auth_service/src ./src

EXPOSE 4000 50051

CMD ["node", "src/app.js"]
