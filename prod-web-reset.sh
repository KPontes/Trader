#!/bin/bash
# restart webserver image
cd ~/Projects/chart-trader/aperiumwww
cp reactapp.prod.html reactapp.html
cp nginx-nocache-prod.conf nginx-nocache.conf
docker image build -t aperium-web .
docker container rm webserver -f
docker container run --publish 80:80 --name webserver -d aperium-web
rm nginx-nocache.conf

if [ "$1" = "all" ]; then
 echo "Preparing also ReactApp image."
 # restart react-client image
 cd ~/Projects/chart-trader/client
 docker image build -t trader-client .
fi
