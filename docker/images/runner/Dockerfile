#---------- STAGE 1 ----------#
FROM ubuntu:18.04 AS builder

ENV DEBIAN_FRONTEND=noninteractive

# Set working directory
WORKDIR /app

# Copy dependency files
COPY runner/package*.json /app/

# Install necessary packages
RUN apt update \
    && apt install make \
    && apt install python -y \
    && apt install build-essential -y

# Install NodeJS
RUN apt install -y curl \
    && curl -sL https://deb.nodesource.com/setup_12.x | bash \
    && apt -y install nodejs

# Install dependencies
RUN npm install

#---------- STAGE 2 ----------#
FROM ubuntu:18.04

ENV DEBIAN_FRONTEND=noninteractive

# Set working directory
WORKDIR /app

COPY --from=builder /app .

RUN apt update \
    && apt install -y locales \
    && locale-gen "en_US.UTF-8"
ENV LANG=en_US.UTF-8 \
    LANGUAGE=en_US:en \
    LC_ALL=en_US.UTF-8

# Install NodeJS
RUN apt install -y curl \
    && curl -sL https://deb.nodesource.com/setup_12.x | bash \
    && apt -y install nodejs

# Copy existing application directory contents
COPY ./runner /app

# Create user, change permissions and use the new user
RUN groupadd -r appuser && useradd --no-log-init -r -g appuser appuser
RUN chown -R appuser:appuser /app
USER appuser