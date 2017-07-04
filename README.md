# feathers-redux

[![Build Status](https://travis-ci.org/feathersjs/feathers-redux.png?branch=master)](https://travis-ci.org/feathersjs/feathers-redux)
[![Code Climate](https://codeclimate.com/github/feathersjs/feathers-redux/badges/gpa.svg)](https://codeclimate.com/github/feathersjs/feathers-redux)
[![Test Coverage](https://codeclimate.com/github/feathersjs/feathers-redux/badges/coverage.svg)](https://codeclimate.com/github/feathersjs/feathers-redux/coverage)
[![Dependency Status](https://img.shields.io/david/feathersjs/feathers-redux.svg?style=flat-square)](https://david-dm.org/feathersjs/feathers-redux)
[![Download Status](https://img.shields.io/npm/dm/feathers-redux.svg?style=flat-square)](https://www.npmjs.com/package/feathers-redux)

> Integrate Feathers services with your Redux store

## Example

On server:
```javascript
app.use('/users', ...);
app.use('/messages', ...);
```
On client:
```javascript
import reduxifyServices from 'feathers-redux';
const feathersClient = feathers(). ...;

// Create Redux actions and reducers for Feathers services
const services = reduxifyServices(feathersClient, ['users', 'messages']);

// Configure Redux store & reducers
export default combineReducers({
  users: services.users.reducer,
  messages: services.messages.reducer,
});

// Feathers service calls may now be dispatched.
store.dispatch(services.messages.get('557XxUL8PalGMgOo'));
store.dispatch(services.messages.find());
store.dispatch(services.messages.create({ text: 'Hello!' }));
```

[](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?utm_source=chrome-app-launcher-info-dialog)
![](./docs/screen-shot.jpg)

## Installation

```
npm install feathers-redux --save
```

## Documentation: reduxifyServices

```javascript
import reduxifyServices from 'feathers-redux';
const services = reduxifyServices(app, serviceNames, options);
```

__Options:__

- `app` (*required*) - The Feathers client app.
- `serviceNames` (*required*, string, array of strings, or object) - The
paths of the Feathers services to reduxify.
    - `'messages'` is short for `{ messages: 'messages }`.
    You can dispatch calls with `dispatch(services.messages.create(data, params));`.
    - `['users', 'messages']` is short for `{ users: 'users', messages: 'messages' }`.
    - `{ '/buildings/:buildingid': 'buildings' }` will reduxify the Feathers service
    configured with the path `/buildings/:buildingid`.
    You can dispatch calls with `dispatch(services.buildings.create(data, params));`.
- `options` (*optional*) - Names for props in the Redux store,
and for string fragments in the action constants.
The default is
```javascript
{ // Names of props for service's Redux state
  isError: 'isError', // e.g. state.messages.isError
  isLoading: 'isLoading',
  isSaving: 'isSaving',
  isFinished: 'isFinished',
  data: 'data',
  queryResult: 'queryResult',
  store: 'store',
  // Fragments to form action constants
  PENDING: 'PENDING', // e.g. MESSAGES_CREATE_PENDING
  FULFILLED: 'FULFILLED',
  REJECTED: 'REJECTED',
}
```
    
`reduxifyServices` returns an object of the form
```javascript
{
  messages: { // For the Feathers service with path /messages.
    // action creators
    create(data, params) {}, // Action creator for app.services('messages').create(data, params)
    update(id, data, params) {},
    patch(id, data, params) {},
    remove(id, params) {},
    find(params) {},
    get(id, params) {},
    store(object) {}, // Interface for realtime replication.
    reset() {}, // Reinitializes store for this service.
    // reducer
    reducer() {}, // Reducers handling actions MESSAGES_CREATE_PENDING, _FULFILLED, and _REJECTED.
  },
  users: { ... },
}
```

Service calls may be dispatched by
```javascript
dispatch(services.messages.create(data, params));
```

Reducers may be combined with
```javascript
combineReducers({
  users: services.users.reducer,
  messages: services.messages.reducer,
});
```

> **ProTip:** You have to include `redux-promise-middleware` and `redux-thunk`
in your middleware.

## Documentation: getServicesStatus

Its common for React apps to display info messages such as "Messages are being saved."
`getServicesStatus` returns a relevant message for the reduxified Feathers services.


```javascript
import reduxifyServices, { getServicesStatus } from 'feathers-redux';
const msg = getServicesStatus(state, serviceNames)
```

__Options:__

- `state` (*required*) - The state containing state for the services.
- `serviceNames` (*required*, string, array of strings) - The
names of the Feathers services.

The services are checked from left to right.
They first are checked for an error condition (`isError`),
and if an error is found the function returns an object similar to
```javascript
{ message: 'users: Error.message',
  className = Error.className, // Can be used to internationalize the message.
  serviceName = 'users';
}
```

Next they are check for loading or saving,
and if one is found the function returns an object similar to
```javascript
{ message: 'users is loading',
  className = 'isLoading', // Or isSaving.
  serviceName = 'users';
}
```

Otherwise the object is returned with empty strings.

## Realtime replication

The Feathers read-only, realtime replication engine is
[`feathers-offline-realtime`](https://github.com/feathersjs/feathers-offline-realtime).
You can connect this engine with
```javascript
const Realtime = require('feathers-offline-realtime');
const messages = feathersClient.service('/messages');

const messagesRealtime = new Realtime(messages, { subscriber: (records, last) => {
  store.dispatch(services.messages.store({ connected: messagesRealtime.connected, last, records }));
} });
```

## Shape of the store

The above code produces a state shaped like
```javascript
state = {
  messages: {
    isLoading: boolean, // If get or find have started
    isSaving: boolean, // If update, patch or remove have started
    isFinished: boolean, // If last call finished successfully
    isError: Feathers error, // If last call was unsuccessful
    data: hook.result, // Results from other than a find call
    queryResult: hook.result, // Results from a find call. May be paginated.
    store: {
      connected: boolean, // If replication engine still listening for Feathers service events
      last: { // Read https://github.com/feathersjs/feathers-offline-realtime#event-information.
        action: string, // Replication action.
        eventName: string, // Feathers service event name. e.g. created
        records: object, // Feathers service event record.
      },
      records: [ objects ], // Sorted near realtime contents of remote service
    },
  },
  users: { ... },
};
```

## Examples

`example/` contains an example you may run. Its README has instructions.

`feathers-redux/test/integration.test.js` may answer any questions regarding details.

## License

Copyright (c) 2017

Licensed under the [MIT license](LICENSE).
