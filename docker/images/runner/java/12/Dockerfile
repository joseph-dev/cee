FROM yosypmykhailiv/cee-runner:latest

# Install container specific packages
RUN apt update \
    && apt install -y software-properties-common \
    && add-apt-repository -y ppa:openjdk-r/ppa \
    && apt update \
    && apt -y install openjdk-12-jdk