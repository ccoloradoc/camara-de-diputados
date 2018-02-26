# create a file named Dockerfile
FROM node:7-alpine

RUN apk add --no-cache nano bash && apk add imagemagick && apk add mysql && apk add --update mysql-client && apk add --update alpine-sdk && mkdir /camara
WORKDIR /camara

COPY . /camara
RUN npm install && chmod 755 -R /camara

EXPOSE 80
