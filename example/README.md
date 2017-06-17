# feathers-reduxify-services example

> Example showing feathers-redux being used.
Read feathers-redux/README.md for details.

## About

This project uses [Feathers](http://feathersjs.com).
An open source web framework for building modern real-time applications.

## Running the example

1. Make sure you have [NodeJS](https://nodejs.org/) installed.
2. Install your dependencies
    
    ```
    npm install webpack -g
    cd path/to/feathers-reduxify-services
    npm install
    cd example
    npm install
    ```

3. Build the client bundle
   
   `npm run build` bundles the client code into `public/dist/bundle.js`.
   
4. Start your app
    
    ```
    cd path/to/feathers-reduxify-services/example
    npm start
    ```
Build the client bundle.

`npm run build` bundles the client code into `public/dist/bundle.js`.

Start your app.
    
```
cd path/to/feathers-reduxify-services/example
npm start
```

Point your browser at `localhost:3030/index.html`

The client, on startup, adds a `Hello` item to `messages`, `find`'s and displays items,
and tries to `get` a non-existent item.

You can `create`, `get`, `patch`, `remove` and `find` items using the UI.

`client/feathers/index.js` reduxifies the `users` and `messages` feathers services
and exports their action creators and reducer as `{ services }`.
`client/reducers/index.js` hooks up the reducers for the reduxified services.
`client/index.js` performs the initial `create`, `find` and `get`.
It also configures the realtime replication.
`client/App.js::mapDispatchToProps` dispatches UI events.

## Help

For more information on all the things you can do with Feathers visit
[docs.feathersjs.com](http://docs.feathersjs.com).

## License

Copyright (c) 2016-2017

Licensed under the [MIT license](LICENSE).
