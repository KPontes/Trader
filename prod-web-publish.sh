#!/bin/bash
# remove stopped containers and untagged images
docker rm $(docker ps -a -q)
docker rmi $(docker images -q --filter "dangling=true")
# tag and upload images to ECR
cd ~/Projects/chart-trader
docker tag trader-client 067552444376.dkr.ecr.us-east-1.amazonaws.com/aperium/trader-client
docker tag aperium-web 067552444376.dkr.ecr.us-east-1.amazonaws.com/aperium/aperium-web
docker push 067552444376.dkr.ecr.us-east-1.amazonaws.com/aperium/trader-client
docker push 067552444376.dkr.ecr.us-east-1.amazonaws.com/aperium/aperium-web
aws ecs update-service --cluster aperium-trader --force-new-deployment --service web --task-definition AperiumWebClient
