# pull official base image
FROM node:lts-buster

WORKDIR /usr/src
COPY . /usr/src

RUN set -ex; \
    yarn install --frozen-lockfile --production; \
    yarn cache clean; \
    yarn run build

