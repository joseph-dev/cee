# Building stage
FROM ubuntu:18.04

ENV DEBIAN_FRONTEND=noninteractive

# Set working directory
WORKDIR /app

# Copy dependency files
COPY runner/package*.json /app/

# Install container specific packages
RUN apt update \
    && apt install -y software-properties-common \
    && add-apt-repository -y ppa:openjdk-r/ppa \
    && apt update \
    && apt -y install openjdk-8-jdk

# Install NodeJS
RUN apt update \
    && apt install -y curl \
    && curl -sL https://deb.nodesource.com/setup_10.x | bash \
    && apt -y install nodejs

RUN npm install -g nodemon

# Install dependencies
RUN npm install

# Copy existing application directory contents
COPY ./runner /app

EXPOSE 4000

CMD [ "node", "index.js" ]