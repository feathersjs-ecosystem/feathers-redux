
/* eslint no-var: 0 */

const assert = require('chai').assert;
const feathersFakes = require('feathers-tests-fake-app-users');
const reduxifyServices = require('../lib').default;
const getServicesStatus = require('../lib').getServicesStatus;

const usersDb = [];
const messagesDb = [];

describe('reduxify:getServicesStatus', () => {
  var app;
  var users;
  var messages;
  var services;
  var rootState;

  beforeEach(() => {
    app = feathersFakes.app();
    users = feathersFakes.makeDbService(app, 'users', clone(usersDb));
    messages = feathersFakes.makeDbService(app, 'messages', clone(messagesDb));
    app.use('users', users);
    app.use('users', messages);
    services = reduxifyServices(app, ['users', 'messages']);
    rootState = {
      users: services.users.reducer({}, '@@INIT'),
      messages: services.messages.reducer({}, '@@INIT'),
    };
  });

  it('has getServicesStatus', () => {
    assert.isFunction(getServicesStatus);
  });

  it('initial status', () => {
    assert.deepEqual(
      getServicesStatus(rootState, 'users'),
      status('', '', '')
    );
  });

  it('loading status', () => {
    rootState.users = services.users.reducer(
      rootState.users, reducerActionType('users', 'find', 'pending')
    );

    assert.deepEqual(
      getServicesStatus(rootState, 'users'),
      status('users is loading', 'isLoading', 'users')
    );
  });

  it('saving status', () => {
    rootState.users = services.users.reducer(
      rootState.users, reducerActionType('users', 'update', 'pending')
    );

    assert.deepEqual(
      getServicesStatus(rootState, 'users'),
      status('users is saving', 'isSaving', 'users')
    );
  });

  it('async complete status', () => {
    rootState.users = services.users.reducer(
      rootState.users, reducerActionType('users', 'update', 'pending')
    );
    rootState.users = services.users.reducer(
      rootState.users, reducerActionType('users', 'update', 'fulfilled')
    );

    assert.deepEqual(
      getServicesStatus(rootState, 'users'),
      status('', '', '')
    );
  });

  it('error status', () => {
    rootState.users = services.users.reducer(
      rootState.users, reducerActionType('users', 'update', 'pending')
    );
    rootState.users = services.users.reducer(
      rootState.users, reducerActionType('users', 'update', 'rejected')
    );

    assert.deepEqual(
      getServicesStatus(rootState, 'users'),
      status('users: xxx', 'yyy', 'users')
    );
  });

  it('ignore error status for error with no error.message', () => {
    rootState.messages = services.messages.reducer(
      rootState.messages, reducerActionType('messages', 'update', 'pending')
    );
    rootState.users = services.users.reducer(
      rootState.users, reducerActionType('users', 'update', 'pending')
    );
    rootState.users = services.users.reducer(
      rootState.users, reducerActionType('users', 'update', 'rejected', 'Error')
    );

    assert.deepEqual(
      getServicesStatus(rootState, ['users', 'messages']),
      status('messages is saving', 'isSaving', 'messages')
    );
  });

  it('ignore error status for error with feather\'s default for no error.message', () => {
    rootState.messages = services.messages.reducer(
      rootState.messages, reducerActionType('messages', 'update', 'pending')
    );
    rootState.users = services.users.reducer(
      rootState.users, reducerActionType('users', 'update', 'pending')
    );
    rootState.users = services.users.reducer(
      rootState.users, reducerActionType('users', 'update', 'rejected', '')
    );

    assert.deepEqual(
      getServicesStatus(rootState, ['users', 'messages']),
      status('messages is saving', 'isSaving', 'messages')
    );
  });

  it('order of services 1', () => {
    rootState.users = services.users.reducer(
      rootState.users, reducerActionType('users', 'get', 'pending')
    );
    rootState.messages = services.messages.reducer(
      rootState.messages, reducerActionType('messages', 'get', 'pending')
    );

    assert.deepEqual(
      getServicesStatus(rootState, ['users', 'messages']),
      status('users is loading', 'isLoading', 'users')
    );
  });

  it('order of services 2', () => {
    rootState.users = services.users.reducer(
      rootState.users, reducerActionType('users', 'get', 'pending')
    );
    rootState.messages = services.messages.reducer(
      rootState.messages, reducerActionType('messages', 'get', 'pending')
    );

    assert.deepEqual(
      getServicesStatus(rootState, ['messages', 'users']),
      status('messages is loading', 'isLoading', 'messages')
    );
  });

  it('rejected is higher priority', () => {
    rootState.users = services.users.reducer(
      rootState.users, reducerActionType('users', 'get', 'rejected')
    );
    rootState.messages = services.messages.reducer(
      rootState.messages, reducerActionType('messages', 'get', 'pending')
    );

    assert.deepEqual(
      getServicesStatus(rootState, ['messages', 'users']),
      status('users: xxx', 'yyy', 'users')
    );
  });
});

// Helpers

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function reducerActionType(service, method, step, errMessage) {
  if (typeof errMessage === 'undefined') {
    errMessage = 'xxx'; // eslint-disable-line no-param-reassign
  }
  const payload = step !== 'rejected' ? errMessage : { message: errMessage, className: 'yyy' };

  return {
    type: `SERVICES_${service.toUpperCase()}_${method.toUpperCase()}_${step.toUpperCase()}`,
    payload,
  };
}

function status(message, className, serviceName) {
  return { message, className, serviceName };
}
