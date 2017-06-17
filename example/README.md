# feathers-redux example

> Example showing feathers-redux being used.
Read feathers-redux/README.md for details.

## Running the example

1. Make sure you have [NodeJS](https://nodejs.org/) installed.
2. Install your dependencies
    
    ```
    npm install webpack -g
    cd path/to/feathers-redux
    npm install
    cd example
    npm install
    ```

3. Build the client bundle
   
   `npm run build` bundles the client code into `public/dist/bundle.js`.
   
4. Start your app
    
    ```
    cd path/to/feathers-redux/example
    npm start
    ```
    
5. Point your browser at `localhost:3030`

The client, on startup, dispatches 3 items into the `messages` service.
Realtime replication is then configured and it snapshots the service contents to the store.
You can `create`, `get`, `patch`, `remove` and `find` items using the UI.

## Help

For more information on all the things you can do with Feathers visit
[docs.feathersjs.com](http://docs.feathersjs.com)
and
[its Slack channel](https://feathersjs.slack.com/messages/C08QQ5YDA/).

## License

Copyright (c) 2016-2017

Licensed under the [MIT license](LICENSE).
