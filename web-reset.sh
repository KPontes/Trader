#!/bin/bash
# restart webserver image
cd ./client/public
docker image build -t trader-web .
cd ../../
docker container rm webserver -f
docker container run --publish 80:80 --name webserver -d trader-web
