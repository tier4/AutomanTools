FROM python:3.7-slim

SHELL ["/bin/bash", "-c"]
ENV DEBIAN_FRONTEND=noninteractive
ENV LC_ALL "C.UTF-8"
ENV LANG "C.UTF-8"
ENV APP_PATH /opt/automan

# install python
RUN apt update && \
    apt install -y --no-install-recommends \
    apt-transport-https \
    default-libmysqlclient-dev \
    ca-certificates \
    curl \
    build-essential \
    iputils-ping \
    gnupg2 \
    libbz2-dev \
    libffi-dev \
    liblzma-dev \
    libncurses5-dev \
    libncursesw5-dev \
    libreadline-dev \
    libsqlite3-dev \
    libssl-dev \
    llvm \
    mysql-client \
    tk-dev \
    wget \
    xz-utils \
    zlib1g-dev && \
    apt clean && \
    rm -rf /var/lib/apt/lists/* && \
    pip install --no-cache-dir pipenv && \
    curl -sL https://deb.nodesource.com/setup_10.x | bash - && \
    apt install -y nodejs && \
    curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - && \
    echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list && \
    apt update && apt install -y yarn

# FIXME COPY -> RUN git clone
# cd automan
# docker build -t automan-labeling-app -f Dockerfile .
COPY automan/Pipfile* /tmp/automan/
WORKDIR /tmp/automan
RUN pipenv install --system --deploy

COPY . $APP_PATH/
# setup frontend environment
WORKDIR $APP_PATH/front
RUN yarn install && yarn build

WORKDIR $APP_PATH/
ENTRYPOINT ["./bin/docker-entrypoint.sh"]
CMD ["uwsgi", "--ini", "conf/app.ini"]
