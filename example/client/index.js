
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import io from 'socket.io-client';
import feathers from 'feathers-client';
import Realtime from 'feathers-offline-realtime';
import reduxifyServices, { getServicesStatus } from '../../src';

import configureStore from './store';
import App from './App';

// Configure Feathers

const feathersClient = feathers()
  .configure(feathers.socketio(io()))
  .configure(feathers.hooks());

// Configure Redux

const services = reduxifyServices(feathersClient, ['users', 'messages']);
const store = configureStore(services);

// Dispatch some service actions without realtime enabled

store.dispatch(services.messages.remove(null));
store.dispatch(services.messages.create({ text: 'message 1' }));
store.dispatch(services.messages.create({ text: 'message 2' }));
store.dispatch(services.messages.create({ text: 'message 3' }));

// Configure realtime & connect it to services

const messages = feathersClient.service('/messages');
const messagesRealtime = new Realtime(messages, { sort: Realtime.sort('text') });

messagesRealtime.on('events', (records, last) => {
  store.dispatch(services.messages.store({ connected: messagesRealtime.connected, last, records }));
});

// Enable realtime. It will start with a snapshot.

messagesRealtime.connect()
  .then(() => console.log('Realtime replication started'));

// Render App

ReactDOM.render(
  <Provider store={store}>
    <App services={services} getServicesStatus={getServicesStatus}/>
  </Provider>,
  document.getElementById('root')
);
