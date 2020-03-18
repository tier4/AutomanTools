FROM python:3.8.1-slim

SHELL ["/bin/bash", "-c"]
ENV DEBIAN_FRONTEND=noninteractive
ENV LC_ALL "C.UTF-8"
ENV LANG "C.UTF-8"
ENV APP_PATH /opt/automan

# install python
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
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
    default-mysql-client \
    tk-dev \
    wget \
    xz-utils \
    zlib1g-dev && \
    pip install --no-cache-dir pipenv && \
    curl -sL https://deb.nodesource.com/setup_10.x | bash - && \
    apt-get install -y nodejs && \
    curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - && \
    echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list && \
    apt-get update && \
    apt-get install -y yarn && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# setup pipenv
COPY automan/Pipfile* /tmp/automan/
WORKDIR /tmp/automan
RUN pipenv install --system --deploy

# setup yarn packages
COPY front/package.json $APP_PATH/front/
WORKDIR $APP_PATH/front
RUN yarn install

# setup frontend environment
COPY front/ $APP_PATH/front/
RUN yarn build

COPY automan/ $APP_PATH/automan/
COPY bin/ $APP_PATH/bin/
WORKDIR $APP_PATH/
ENTRYPOINT ["./bin/docker-entrypoint.sh"]
CMD ["uwsgi", "--ini", "conf/app.ini"]
