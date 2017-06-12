# feathers-redux

[![Build Status](https://travis-ci.org/feathersjs/feathers-redux.png?branch=master)](https://travis-ci.org/feathersjs/feathers-redux)
[![Code Climate](https://codeclimate.com/github/feathersjs/feathers-redux/badges/gpa.svg)](https://codeclimate.com/github/feathersjs/feathers-redux)
[![Test Coverage](https://codeclimate.com/github/feathersjs/feathers-redux/badges/coverage.svg)](https://codeclimate.com/github/feathersjs/feathers-redux/coverage)
[![Dependency Status](https://img.shields.io/david/feathersjs/feathers-redux.svg?style=flat-square)](https://david-dm.org/feathersjs/feathers-redux)
[![Download Status](https://img.shields.io/npm/dm/feathers-redux.svg?style=flat-square)](https://www.npmjs.com/package/feathers-redux)

> Integrate Feathers services with your Redux store

**Work in progress. Do not use**

```javascript
/* on server */
app.use('/users', ...);
app.use('/messages', ...);

/* on client */
const app = feathers().configure(feathers.socketio(socket)).configure(feathers.hooks());

// reduxify Feathers' services
const services = reduxifyServices(app, ['users', 'messages']); // the 1 line

// hook up Redux reducers
export default combineReducers({
  users: services.users.reducer,
  messages: services.messages.reducer,
});

// Feathers is now 100% compatible with Redux
store.dispatch(services.messages.get('557XxUL8PalGMgOo'));
store.dispatch(services.messages.find());
store.dispatch(services.messages.create({ text: 'Shiver me timbers!' }));
```

**_Simple, huh._**

[](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?utm_source=chrome-app-launcher-info-dialog)
![](./docs/screen-shot.jpg)

## Installation

```
npm install feathers-redux --save
```

## Documentation

## Complete Example

Expose action creators and reducers for Feathers services. Then use them like normal Redux.

```javascript
import { applyMiddleware, combineReducers, createStore } from 'redux';
import reduxifyServices, { getServicesStatus } from 'feathers-reduxify-services';
const feathersApp = feathers().configure(feathers.socketio(socket)) ...

// Expose Redux action creators and reducers for Feathers' services
const services = reduxifyServices(feathersApp, ['users', 'messages']);

// Typical Redux store creation, crammed together
const store = applyMiddleware(
  reduxThunk, reduxPromiseMiddleware() // middleware needed
)(createStore)(combineReducers({
  users: services.users.reducer, // include reducers for Feathers' services
  messages: services.messages.reducer
}));

// Invoke Feathers' services using standard Redux.
store.dispatch(services.messages.get('557XxUL8PalGMgOo'));
store.dispatch(services.messages.find());
store.dispatch(services.messages.create({ text: 'Shiver me timbers!' }));
```

Dispatch Redux actions on Feathers' real time service events.

```javascript
const messages = feathersApp.service('messages');

messages.on('created', data => {
  store.dispatch(
    // Create a thunk action to invoke the function.
    services.messages.on('created', data, (eventName, data, dispatch, getState) => {
      console.log('--created event', data);
    })
  );
});
```

Keep the user informed of service activity.

```javascript
const status = getServicesStatus(servicesRootState, ['users', 'messages']).message;
```

Replication engines generally maintain a near realtime, local copy of (some of) the records
in a service on the server.

`feathers-reduxify-services` now provides an interface which you can use
to interface replication engines with the Redux state for the service.
This interface updates the state property `store`.

`feathers-offline-realtime` is the official Feathersjs realtime replication engine.
Please read its README.

It can be interfaced with `feathers-reduxify-services` as follows:
```javascript
import reduxifyServices from 'feathers-reduxify-services';
import Realtime from 'feathers-offline-realtime';

const services = reduxifyServices(app, ['messages', ...]);
const store = applyMiddleware( ... , messages: services.messages.reducer }));

const messagesRealtime = new Realtime(feathersApp.service('/messages'));

messagesRealtime.on('events', (records, last) => {
  store.dispatch(services.messages.store({ connected: messagesRealtime.connected, last, records }));
});
```

This would create the state:
```javascript
state.messages.store = {
  connected: boolean, // if the replication engine is still listening to server
  last: { activity, eventName, record }, // last activity. See feathers-offline-realtime
  records: [ objects ], // the near realtime contents of the remote service
};
```

## Example app

Make sure you have [NodeJS](https://nodejs.org/) installed.

Install your dependencies.
    
```
npm install webpack -g
cd path/to/feathers-reduxify-services
npm install
cd example
npm install
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

## License

Copyright (c) 2017

Licensed under the [MIT license](LICENSE).
