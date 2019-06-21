# LOL EXPLORER REST API SERVER

## Building Development
The typical workflow to get up running is as follows:

* Run `yarn` to get all required dependencies on your machine.
* Run `yarn build:dev` to create a development build of the app.
* Run `yarn start` to launch the application. Changes will be compiled in the
  background.

## Mongo DB
Because LOL's api has the request rate limitings, we have to use the strategy to avoid being rate limited.
The server uses mongo db to store the response of LOL's api.

You can modify mongo connection options (user, pasword, etc...) in `.env` file.
First, you should rename `.example.env` to `.env` to use monbo db.

For the development test, we sometimes need to truncate mongo db collection.
```shell
$ yarn init:mongo
```

## PRODUCTION
```shell
$ yarn build:prod
```