
const assert = require('chai').assert;
const feathers = require('feathers');
const memory = require('feathers-memory');
const Realtime = require('feathers-offline-realtime');

const configureStore = require('./client/store');
const { default: reduxifyServices, getServicesStatus } = require('../src');

const initServiceState = {
  isError: null,
  isLoading: false,
  isSaving: false,
  isFinished: false,
  data: null,
  queryResult: null,
  store: null
};

const initialStatus = { message: '', className: '', serviceName: '' };
const savingStatus = {
  message: 'messages is saving',
  className: 'isSaving',
  serviceName: 'messages',
};
const errorStatus = id => ({
  message: `messages: No record found for id '${id}'`,
  className: 'not-found',
  serviceName: 'messages'
});

const initData = [];
for (let i = 0, len = 5; i < len; i += 1) {
  initData.push({ id: i, order: i });
}

let app;
let messages;
let store;
let reduxifiedServices;
let state;
let actions;
let messagesRealtime;

describe('integration test', () => {
  describe('feathers-redux', () => {
    beforeEach(() => {
      app = feathers()
        .configure(servicesConfig);

      messages = app.service('messages');

      return messages.remove(null)
        .then(() => messages.create(clone(initData)))
        .then(() => {
          reduxifiedServices = reduxifyServices(app, ['users', 'messages']);
          store = configureStore(reduxifiedServices);
        });
    });
  
    it('has getServicesStatus', () => {
      assert.isFunction(getServicesStatus);
    });

    it('initial state', () => {
      state = store.getState();

      assert.deepEqual(state.users, initServiceState);
      assert.deepEqual(state.messages, initServiceState);
  
      assert.deepEqual(getServicesStatus(state, 'users'), initialStatus);
      assert.deepEqual(getServicesStatus(state, 'messages'), initialStatus);
      assert.deepEqual(getServicesStatus(state, ['users', 'messages']), initialStatus);
    });

    it('successful service call', () => {
      const promise = store.dispatch(reduxifiedServices.messages.create({ text: 'hello' }));

      state = store.getState();
      assert.deepEqual(state.messages, {
        ...initServiceState, isSaving: true
      });
  
      assert.deepEqual(getServicesStatus(state, ['users', 'messages']), savingStatus);

      return promise.then(() => {
        state = store.getState();
        assert.deepEqual(state.messages, {
          ...initServiceState, isFinished: true, data: { id: 1, text: 'hello' }
        });
  
        assert.deepEqual(getServicesStatus(state, ['users', 'messages']), initialStatus);
      });
    });

    it('failed service call', () => {
      const promise = store.dispatch(reduxifiedServices.messages.get(999));

      state = store.getState();
      assert.deepEqual(state.messages, {
        ...initServiceState, isLoading: true
      });

      return promise
        .then(() => {
          assert(false, 'unexpected succeeded');
        })
        .catch(() => {
          state = store.getState();
          assert.equal(state.messages.isError.className, 'not-found');
          assert.deepEqual(
            { ...state.messages, isError: null },
            { ...initServiceState, isError: null, isFinished: true, data: null }
          );
  
          assert.deepEqual(getServicesStatus(state, ['users', 'messages']), errorStatus(999));
        });
    });

    it('service find call', () => {
      const promise = store.dispatch(
        reduxifiedServices.messages.find({ query: { id: { $lte: 1 } } })
      );

      state = store.getState();
      assert.deepEqual(state.messages, {
        ...initServiceState, isLoading: true
      });

      return promise
        .then(() => {
          state = store.getState();
          assert.deepEqual(
            { ...state.messages },
            { ...initServiceState,
              isFinished: true,
              queryResult: [{ id: 0, order: 0 }, { id: 1, order: 1 }]
            }
          );
  
          assert.deepEqual(getServicesStatus(state, ['users', 'messages']), initialStatus);
        });
    });

    it('reset', () => {
      const promise = store.dispatch(
        reduxifiedServices.messages.find({ query: { id: { $lte: 1 } } })
      );

      state = store.getState();

      return promise
        .then(() => {
          store.dispatch(reduxifiedServices.messages.reset());

          state = store.getState();
          assert.deepEqual(state.messages, initServiceState);
  
          assert.deepEqual(getServicesStatus(state, ['users', 'messages']), initialStatus);
        });
    });
  });

  describe('realtime replication', () => {
    beforeEach(() => {
      app = feathers()
        .configure(servicesConfig);

      messages = app.service('messages');

      return messages.remove(null)
        .then(() => messages.create(clone(initData)))
        .then(() => {
          reduxifiedServices = reduxifyServices(app, ['users', 'messages']);
          store = configureStore(reduxifiedServices);

          actions = [];

          messagesRealtime = new Realtime(messages, {
            publication: record => record.order <= 1,
            sort: Realtime.sort('order')
          });

          messagesRealtime.on('events', (records, last) => {
            actions.push(last);

            store.dispatch(reduxifiedServices.messages.store(
              { connected: messagesRealtime.connected, last, records }
            ));
          });
        });
    });

    it('connects', () => {
      return messagesRealtime.connect()
        .then(() => {
          assert.deepEqual(actions, [{ action: 'snapshot' }, { action: 'add-listeners' }]);

          state = store.getState();
          assert.deepEqual(state.messages.store, {
            connected: true,
            last: { action: 'add-listeners' },
            records: [{ id: 0, order: 0 }, { id: 1, order: 1 }]
          });
  
          assert.deepEqual(getServicesStatus(state, ['users', 'messages']), initialStatus);
        });
    });

    it('can change sort order', () => {
      return messagesRealtime.connect()
        .then(() => {
          messagesRealtime.changeSort(Realtime.multiSort({ order: -1 }));

          state = store.getState();
          assert.deepEqual(state.messages.store, {
            connected: true,
            last: { action: 'change-sort' },
            records: [{ id: 1, order: 1 }, { id: 0, order: 0 }]
          });
        });
    });

    it('add record from Feathers service', () => {
      return messagesRealtime.connect()
        .then(() => {
          return messages.create({ id: 0.1, order: 0.1 })
            .then(() => {
              state = store.getState();

              assert.deepEqual(state.messages.store, {
                connected: true,
                last: {
                  eventName: 'created',
                  action: 'mutated',
                  record: { id: 0.1, order: 0.1 }
                },
                records: [{ id: 0, order: 0 }, { id: 0.1, order: 0.1 }, { id: 1, order: 1 }]
              });
            });
        });
    });

    it('add record from reduxified service', () => {
      return messagesRealtime.connect()
        .then(() => {
          return store.dispatch(reduxifiedServices.messages.create({ id: 0.2, order: 0.2 }))
            .then(() => {
              state = store.getState();

              assert.deepEqual(state.messages.store, {
                connected: true,
                last: {
                  eventName: 'created',
                  action: 'mutated',
                  record: { id: 0.2, order: 0.2 }
                },
                records: [{ id: 0, order: 0 }, { id: 0.2, order: 0.2 }, { id: 1, order: 1 }]
              });
            });
        });
    });

    it('patch record remaining in publication', () => {
      return messagesRealtime.connect()
        .then(() => {
          return messages.patch(0, { order: 0.4 })
            .then(() => {
              state = store.getState();

              assert.deepEqual(state.messages.store, {
                connected: true,
                last: {
                  eventName: 'patched',
                  action: 'mutated',
                  record: { id: 0, order: 0.4 }
                },
                records: [{ id: 0, order: 0.4 }, { id: 1, order: 1 }]
              });
            });
        });
    });

    it('patch record into publication', () => {
      return messagesRealtime.connect()
        .then(() => {
          return messages.patch(2, { order: 0.3 })
            .then(() => {
              state = store.getState();

              assert.deepEqual(state.messages.store, {
                connected: true,
                last: {
                  eventName: 'patched',
                  action: 'mutated',
                  record: { id: 2, order: 0.3 }
                },
                records: [{ id: 0, order: 0 }, { id: 2, order: 0.3 }, { id: 1, order: 1 }]
              });
            });
        });
    });

    it('patch record out of publication', () => {
      return messagesRealtime.connect()
        .then(() => {
          return messages.patch(0, { order: 10 })
            .then(() => {
              state = store.getState();

              assert.deepEqual(state.messages.store, {
                connected: true,
                last: {
                  eventName: 'patched',
                  action: 'left-pub',
                  record: { id: 0, order: 10 }
                },
                records: [{ id: 1, order: 1 }]
              });
            });
        });
    });
  });
});

// Helpers

function servicesConfig () {
  const app = this;
  app.configure(usersConfig);
  app.configure(messagesConfig);
}

function usersConfig () {
  const app = this;
  app.use('/users', memory({}));
}

function messagesConfig () {
  const app = this;
  app.use('/messages', memory({}));
}

function clone (obj) {
  return JSON.parse(JSON.stringify(obj));
}
