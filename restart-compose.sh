#!/bin/bash
# restart compose
docker-compose down
docker-compose up -d
docker logs aperium-node -f
