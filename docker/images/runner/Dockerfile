FROM ubuntu:18.04

ENV DEBIAN_FRONTEND=noninteractive

# Set working directory
WORKDIR /app

# Copy dependency files
COPY runner/package*.json /app/

# Install NodeJS
RUN apt update \
    && apt install -y curl \
    && curl -sL https://deb.nodesource.com/setup_10.x | bash \
    && apt -y install nodejs

RUN apt update \
    && apt install -y locales \
    && locale-gen "en_US.UTF-8"
ENV LANG=en_US.UTF-8 \
    LANGUAGE=en_US:en \
    LC_ALL=en_US.UTF-8

# Install dependencies
RUN npm install

# Copy existing application directory contents
COPY ./runner /app