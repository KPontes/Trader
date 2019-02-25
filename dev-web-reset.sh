#!/bin/bash
# restart webserver image
cd ~/Projects/chart-trader/aperiumwww
cp nginx-nocache-dev.conf nginx-nocache.conf
cp reactapp.dev.html reactapp.html
docker image build -t aperium-web .
docker container rm webserver -f
docker container run --publish 80:80 --name webserver -d aperium-web
# restart client react image
# cd ~/Projects/chart-trader/client
# docker image build -t trader-client .
# docker container rm client -f
# docker container run --publish 3000:3000 --name client -d trader-client
