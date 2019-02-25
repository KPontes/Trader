#!/bin/bash
# restart compose
docker-compose down
# cd ./aperiumwww
# docker image build -t aperium-web .
# cd ..
docker-compose up -d
