#!/bin/bash
# restart webserver image
cd ~/Projects/chart-trader/aperiumwww
cp reactapp.prod.html reactapp.html
docker image build -t aperium-web .
docker container rm webserver -f
docker container run --publish 80:80 --name webserver -d aperium-web
# restart react-client image
cd ~/Projects/chart-trader/client
docker image build -t trader-client .
