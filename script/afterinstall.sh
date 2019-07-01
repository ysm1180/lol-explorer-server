#!/bin/bash

pkill -f node

cd /home/ubuntu/lol/
yarn install
yarn build:prod
chmod -R 777 /home/ubuntu/lol