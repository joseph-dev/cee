FROM yosypmykhailiv/cee-runner:latest

USER root

# Install container specific packages
RUN apt update \
    && apt-get install -y software-properties-common \
    && add-apt-repository -y ppa:ondrej/php \
    && apt-get update \
    && apt install -y php7.1

USER appuser