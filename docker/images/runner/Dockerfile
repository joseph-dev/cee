# Building stage
FROM node:10-alpine

# Set working directory
WORKDIR /app

# Copy dependency files
COPY runner/package*.json /app/

RUN npm install -g nodemon

# Install dependencies
RUN npm install

# Copy existing application directory contents
COPY ./runner /app

EXPOSE 4000

CMD [ "node", "index.js" ]