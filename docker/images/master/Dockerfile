# Building stage
FROM node:12-slim

# Set working directory
WORKDIR /app

# Copy dependency files
COPY master/package*.json /app/

RUN npm install -g nodemon

# Install dependencies
RUN npm install

# Copy existing application directory contents
COPY ./master /app

EXPOSE 3000

CMD [ "node", "index.js" ]