# LOL EXPLORER REST API SERVER

## Environment variables
* First, you should rename `.example.env` to `.env` to use environment variables.
* You can modify environment variables in `.env`.

## League of Legends Development API Key
You should fill `LOL_API_KEY` get from https://developer.riotgames.com/ in `.env` file for using LOL API.

## Building Development
The typical workflow to get up running is as follows:

* Run `yarn` to get all required dependencies on your machine.
* Run `yarn build:dev` to create a development build of the app.
* Run `yarn start` to launch the application. Changes will be compiled in the
  background.

## Mongo DB
Because LOL's api has the request rate limitings, we have to use the strategy to avoid being rate limited.
The server uses mongo db to store the response of LOL's api.

You should fill mongo connection options (user, pasword, etc...) in `.env` file.

For the development test, we sometimes need to truncate mongo db collection.
```shell
$ yarn init:mongo
```

## Redis
You should fill redis connection options (host, port, pasword) in `.env` file.

## TEST
```shell
$ yarn test
```

## PRODUCTION
```shell
$ yarn build:prod
```