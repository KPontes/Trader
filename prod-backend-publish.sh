#!/bin/bash
if [ "$1" = "loader" ]; then
 echo "Publishing Loader"
 # restart react-client image
 cd ~/Projects/chart-trader/loader
 docker image build -t trader-loader .
 docker tag trader-loader 067552444376.dkr.ecr.us-east-1.amazonaws.com/aperium/trader-loader
 docker push 067552444376.dkr.ecr.us-east-1.amazonaws.com/aperium/trader-loader
 aws ecs update-service --cluster aperium-trader --force-new-deployment --service loader --task-definition AperiumTraderLoader
fi
if [ "$1" = "planner" ]; then
 echo "Publishing Planner"
 # restart react-client image
 cd ~/Projects/chart-trader/planner
 docker image build -t trader-planner .
 docker tag trader-planner 067552444376.dkr.ecr.us-east-1.amazonaws.com/aperium/trader-planner
 docker push 067552444376.dkr.ecr.us-east-1.amazonaws.com/aperium/trader-planner
 aws ecs update-service --cluster aperium-trader --force-new-deployment --service planner --task-definition AperiumTraderPlanner
fi
if [ "$1" = "executer" ]; then
 echo "Publishing Executer"
 # restart react-client image
 cd ~/Projects/chart-trader/executer
 docker image build -t trader-executer .
 docker tag trader-executer 067552444376.dkr.ecr.us-east-1.amazonaws.com/aperium/trader-executer
 docker push 067552444376.dkr.ecr.us-east-1.amazonaws.com/aperium/trader-executer
 aws ecs update-service --cluster aperium-trader --force-new-deployment --service executer --task-definition AperiumTraderExecuter
fi
