#!/bin/bash
# restart compose
docker-compose down
cd ./client/public
docker image build -t trader-web .
cd ../../
docker-compose up -d
