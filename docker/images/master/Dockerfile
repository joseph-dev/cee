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

# Create user, change permissions and use the new user
RUN groupadd -r appuser && useradd --no-log-init -r -g appuser appuser
RUN chown -R appuser:appuser /app
USER appuser

# Expose ports
EXPOSE 3000

CMD [ "node", "index.js" ]