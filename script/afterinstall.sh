#!/bin/bash

pkill -f node

chmod -R 777 /home/ubuntu/lol
cd /home/ubuntu/lol/
yarn install
yarn build:prod