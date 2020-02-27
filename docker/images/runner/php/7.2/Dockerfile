FROM yosypmykhailiv/cee-runner:latest

# Install container specific packages
RUN apt update \
    && apt-get install -y software-properties-common \
    && add-apt-repository -y ppa:ondrej/php \
    && apt-get update \
    && apt install -y php7.2