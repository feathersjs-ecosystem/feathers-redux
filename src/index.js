import { createAction, handleActions } from 'redux-actions';
import { bindActionCreators } from 'redux';
import makeDebug from 'debug';

/**
 * Build a Redux compatible wrapper around a Feathers service.
 *
 * Instead of using a feathers-client service directly
 *     app.services('messages').create({ name: 'John' }, (err, data) => {...});
 * you first wrap the feathers service to expose Redux action creators and a reducer
 *     messages = reduxifyService(app, 'messages');
 * You can thereafter use the service in a standard Redux manner
 *     store.dispatch(messages.create({ name: 'John' }));
 * with async action creators being dispatched to a reducer which manages state.
 *
 * @param {Object} app the configured Feathers app, e.g. require('feathers-client')().configure(...)
 * @param {String} route is the Feathers' route for the service.
 * @param {String} name is the serviceName by which the service is known on client. Default route.
 * @param {Object} options
 * @returns {{find: *, get: *, create: *, update: *, patch: *, remove: *, on: *, reducer: *}}
 *
 * You will usually use on the client
 *      const users = reduxifyService(app, 'users');
 * However you may sometimes have awkward REST paths on the server like
 *      app.use('app.use('/verifyReset/:action/:value', ...);
 * You are then best of to use on the client
 *      const buildings = reduxifyService(app, '/verifyReset/:action/:value', 'verifyReset');
 * since you can thereafter use
 *      store.dispatch(verifyReset.create(...));
 *
 * Action creators for service calls are returned as { find, get, create, update, patch, remove }.
 * They expect the same parameters as their Feathers service methods, e.g. (id, data, params).
 *
 * Should you wish to write additional action creators, the { reducer } export expects action types
 *   'SERVICES_${SERVICE_NAME}_${METHOD}_PENDING', ...FULFILLED and ...REJECTED
 * where SERVICE_NAME is serviceName in upper case; METHOD is FIND, GET, ...
 *
 * Pro tip: You can implement optimistic updates within ...PENDING, finalizing them in ...FULFILL.
 *
 * The reducer's JS state (not immutable) is {
 *   isError: String|null,
 *   isLoading: Boolean,
 *   isSaving: Boolean,
 *   isFinished: Boolean,
 *   data: Object|null,
 *   queryResult: Object|null
 * }.
 * The find service call stores Feathers' query payload in queryResult. Other methods store in data.
 *
 * isError is Feathers' error payload { message, name, code, className, errors }.
 * If the feathers server response did not specify an error message, then the message property will
 * be feathers default of 'Error'.
 *
 * Options may change the state property names and the reducer action type names.
 *
 * Each service also gets a reset service call which re-initializes that service's state.
 * This may be used, for example, to remove isError in order to no longer render error messages.
 * store.dispatch(messages.reset(true)) will leave queryResult as is during initialization.
 *
 * An action creator for listening on service events is returned as { on } and could be used like:
 *   import feathersApp, { services } from './feathers';
 *   feathersApp.service('messages').on('created', data => { store.dispatch(
 *       services.messages.on('created', data, (event, data, dispatch, getState) => {
 *         // handle data change
 *       })
 *   ); });
 */

const reduxifyService = (app, route, name = route, options = {}) => {
  const debug = makeDebug(`reducer:${name}`);
  debug(`route ${route}`);

  const defaults = {
    idField: 'id',
    isError: 'isError',
    isLoading: 'isLoading',
    isSaving: 'isSaving',
    isFinished: 'isFinished',
    data: 'data',
    queryResult: 'queryResult',
    store: 'store',
    PENDING: 'PENDING',
    FULFILLED: 'FULFILLED',
    REJECTED: 'REJECTED'
  };
  const pendingDefaults = {
    // individual pending/loading depending on the dispatched action
    createPending: 'createPending',
    findPending: 'findPending',
    getPending: 'getPending',
    updatePending: 'updatePending',
    patchPending: 'patchPending',
    removePending: 'removePending'
  };

  const queryResultDefaults = {
    total: 0,
    limit: 0,
    skip: 0,
    data: []
  };

  const opts = Object.assign({}, defaults, pendingDefaults, options);

  const getPendingDefaults = (slicedActionType) => {
    let result = {};
    for (let key in pendingDefaults) {
      if (`${slicedActionType}Pending` === pendingDefaults[key]) {
        result[key] = true;
      } else {
        result[key] = false;
      }
    }
    return result;
  };

  const SERVICE_NAME = `SERVICES_${name.toUpperCase()}_`;

  const service = app.service(route);
  if (!service) {
    debug(`redux: Feathers service '${route} does not exist.`);
    throw Error(`Feathers service '${route} does not exist.`);
  }

  const reducerForServiceMethod = (actionType, ifLoading, isFind) => {
    const slicedActionType = actionType.slice(SERVICE_NAME.length, actionType.length).toLowerCase(); // returns find/create/update/patch (etc.)
    const pendingResults = getPendingDefaults(slicedActionType);

    return {
      // promise has been started
      [`${actionType}_${opts.PENDING}`]: (state, action) => {
        debug(`redux:${actionType}_${opts.PENDING}`, action);
        return ({
          ...state,
          ...pendingResults,

          [opts.isError]: null,
          [opts.isLoading]: ifLoading,
          [opts.isSaving]: !ifLoading,
          [opts.isFinished]: false,
          [opts.data]: state[opts.data] || null,
          [opts.queryResult]: state[opts.queryResult] || null //  leave previous to reduce redraw
        });
      },

      // promise resolved
      [`${actionType}_${opts.FULFILLED}`]: (state, action) => {
        debug(`redux:${actionType}_${opts.FULFILLED}`, action);
        return {
          ...state,
          [opts.isError]: null,
          [opts.isLoading]: false,
          [opts.isSaving]: false,
          [opts.isFinished]: true,
          [opts.data]: !isFind ? action.payload : null,
          [opts.queryResult]: isFind ? action.payload : (state[opts.queryResult] || null),
          [opts[`${slicedActionType}Pending`]]: false
        };
      },

      // promise rejected
      [`${actionType}_${opts.REJECTED}`]: (state, action) => {
        debug(`redux:${actionType}_${opts.REJECTED}`, action);
        return {
          ...state,
          // action.payload = { name: "NotFound", message: "No record found for id 'G6HJ45'",
          //   code:404, className: "not-found" }
          [opts.isError]: action.payload,
          [opts.isLoading]: false,
          [opts.isSaving]: false,
          [opts.isFinished]: true,
          [opts.data]: null,
          [opts.queryResult]: isFind ? null : (state[opts.queryResult] || null),
          [opts[`${slicedActionType}Pending`]]: false
        };
      }
    };
  };

  // ACTION TYPES

  const FIND = `${SERVICE_NAME}FIND`;
  const GET = `${SERVICE_NAME}GET`;
  const CREATE = `${SERVICE_NAME}CREATE`;
  const UPDATE = `${SERVICE_NAME}UPDATE`;
  const PATCH = `${SERVICE_NAME}PATCH`;
  const REMOVE = `${SERVICE_NAME}REMOVE`;
  const RESET = `${SERVICE_NAME}RESET`;
  const STORE = `${SERVICE_NAME}STORE`;

  // FEATHERS EVENT LISTENER ACTION TYPES
  const ON_CREATED = `${SERVICE_NAME}ON_CREATED`;
  const ON_UPDATED = `${SERVICE_NAME}ON_UPDATED`;
  const ON_PATCHED = `${SERVICE_NAME}ON_PATCHED`;
  const ON_REMOVED = `${SERVICE_NAME}ON_REMOVED`;

  const actionTypesForServiceMethod = (actionType) => ({
    [`${actionType}`]: `${actionType}`,
    [`${actionType}_${opts.PENDING}`]: `${actionType}_${opts.PENDING}`,
    [`${actionType}_${opts.FULFILLED}`]: `${actionType}_${opts.FULFILLED}`,
    [`${actionType}_${opts.REJECTED}`]: `${actionType}_${opts.REJECTED}`
  });

  return {
    // ACTION CREATORS
    // Note: action.payload in reducer will have the value of .data below
    find: createAction(FIND, (p) => ({ promise: service.find(p), data: undefined })),
    get: createAction(GET, (id, p) => ({ promise: service.get(id, p) })),
    create: createAction(CREATE, (d, p) => ({ promise: service.create(d, p) })),
    update: createAction(UPDATE, (id, d, p) => ({ promise: service.update(id, d, p) })),
    patch: createAction(PATCH, (id, d, p) => ({ promise: service.patch(id, d, p) })),
    remove: createAction(REMOVE, (id, p) => ({ promise: service.remove(id, p) })),
    reset: createAction(RESET),
    store: createAction(STORE, store => store),
    on: (event, data, fcn) => (dispatch, getState) => { fcn(event, data, dispatch, getState); },

    onCreated: createAction(ON_CREATED, (payload) => ({ data: payload })),
    onUpdated: createAction(ON_UPDATED, (payload) => ({ data: payload })),
    onPatched: createAction(ON_PATCHED, (payload) => ({ data: payload })),
    onRemoved: createAction(ON_REMOVED, (payload) => ({ data: payload })),

    // ACTION TYPES
    types: {
      ...actionTypesForServiceMethod(FIND),
      ...actionTypesForServiceMethod(GET),
      ...actionTypesForServiceMethod(CREATE),
      ...actionTypesForServiceMethod(UPDATE),
      ...actionTypesForServiceMethod(PATCH),
      ...actionTypesForServiceMethod(REMOVE),
      RESET,
      STORE,

      ...actionTypesForServiceMethod(ON_CREATED),
      ...actionTypesForServiceMethod(ON_UPDATED),
      ...actionTypesForServiceMethod(ON_PATCHED),
      ...actionTypesForServiceMethod(ON_REMOVED)
    },

    // REDUCER
    reducer: handleActions(
      Object.assign({},
        reducerForServiceMethod(FIND, true, true),
        reducerForServiceMethod(GET, true),
        reducerForServiceMethod(CREATE, false),
        reducerForServiceMethod(UPDATE, false),
        reducerForServiceMethod(PATCH, false),
        reducerForServiceMethod(REMOVE, false),

        { [ON_CREATED]: (state, action) => {
          debug(`redux:${ON_CREATED}`, action);

          const updatedResult = Object.assign({}, state[opts.queryResult], {
            data: state[opts.queryResult].data.concat(action.payload.data),
            total: state[opts.queryResult].total + 1
          });

          return {
            ...state,
            [opts.queryResult]: updatedResult
          };
        } },

        { [ON_UPDATED]: (state, action) => {
          debug(`redux:${ON_UPDATED}`, action);

          return {
            ...state,
            [opts.queryResult]: Object.assign({}, state[opts.queryResult], {
              data: state[opts.queryResult].data.map(item => {
                if (item[opts.idField] === action.payload.data[opts.idField]) {
                  return action.payload.data;
                }
                return item;
              })
            })
          };
        } },

        { [ON_PATCHED]: (state, action) => {
          debug(`redux:${ON_PATCHED}`, action);

          return {
            ...state,
            [opts.queryResult]: Object.assign({}, state[opts.queryResult], {
              data: state[opts.queryResult].data.map(item => {
                if (item[opts.idField] === action.payload.data[opts.idField]) {
                  return action.payload.data;
                }
                return item;
              })
            })
          };
        } },

        { [ON_REMOVED]: (state, action) => {
          debug(`redux:${ON_REMOVED}`, action);
          const removeIndex = state.queryResult.data.findIndex(item => item[opts.idField] === action.payload.data[opts.idField]);
          const updatedResult = Object.assign({}, state[opts.queryResult], {
            data: [
              ...state[opts.queryResult].data.slice(0, removeIndex),
              ...state[opts.queryResult].data.slice(removeIndex + 1)
            ],
            total: state[opts.queryResult].total - 1
          });

          return {
            ...state,
            [opts.queryResult]: updatedResult
          };
        } },

        // reset status if no promise is pending
        { [RESET]: (state, action) => {
          debug(`redux:${RESET}`, action);

          if (state[opts.isLoading] || state[opts.isSaving]) {
            return state;
          }

          return {
            ...state,
            [opts.isError]: null,
            [opts.isLoading]: false,
            [opts.isSaving]: false,
            [opts.isFinished]: false,
            [opts.data]: null,
            [opts.queryResult]: action.payload ? state[opts.queryResult] : queryResultDefaults,
            [opts.store]: null
          };
        } },

        // update store
        { [STORE]: (state, action) => {
          debug(`redux:${STORE}`, action);

          return {
            ...state,
            [opts.store]: action.payload
          };
        } }
      ),
      {
        [opts.isError]: null,
        [opts.isLoading]: false,
        [opts.isSaving]: false,
        [opts.isFinished]: false,
        [opts.data]: null,
        [opts.queryResult]: queryResultDefaults,
        [opts.store]: null,

        [opts.createPending]: false,
        [opts.findPending]: false,
        [opts.getPending]: false,
        [opts.updatePending]: false,
        [opts.patchPending]: false,
        [opts.removePending]: false
      }
    )
  };
};

/**
 * Convenience method to build wrappers for multiple services. You should this not reduxifyService.
 *
 * @param {Object} app - See reduxifyService
 * @param {Object|Array|String} routeNameMap - The feathers services to reduxify. See below.
 * @param {Object} options - See reduxifyService
 * @returns {Object} Each services' action creators. See reduxifyService.
 *
 * If the feathers server has:
 *   app.use('users', ...);
 *   app.use('/buildings/:buildingid', ...);
 * then you can do
 *   services = reduxifyServices(app, { users: 'users', '/buildings/:buildingid': 'buildings' });
 *   ...
 *   store.dispatch(users.create(...));
 *   store.dispatch(users.create(...));
 *
 * A routeNameMap of ['users', 'members'] is the same as { users: 'users', members: 'members' }.
 * A routeNameMao of 'users' is the same as { users: 'users' }.
 */
export default (app, routeNameMap, options) => {
  const services = {};
  let routeNames = {};

  if (typeof routeNameMap === 'string') {
    routeNames = { [routeNameMap]: routeNameMap };
  } else if (Array.isArray(routeNameMap)) {
    routeNameMap.forEach(name => { routeNames[name] = name; });
  } else if (typeof routeNameMap === 'object') {
    routeNames = routeNameMap;
  }

  Object.keys(routeNames).forEach(route => {
    services[routeNames[route]] = reduxifyService(app, route, routeNames[route], options);
  });

  return services;
};

/**
 * Get a status to display as a summary of all Feathers services.
 *
 * The services are checked in serviceNames order.
 * The first service with an error message, returns that as the status.
 * Otherwise the first service loading or saving returns its status.
 *
 * @param {Object} servicesState - the slice of state containing the states for the services.
 *    state[name] has the JS state (not immutable) for service 'name'.
 * @param {Array|String} serviceNames
 * @returns {{message: string, className: string, serviceName: string}}
 *    message is the English language status text.
 *    You can create your own internationalized messages with serviceName and className.
 *    className will be isLoading, isSaving or it will be Feathers' error's className.
 */

export const getServicesStatus = (servicesState, serviceNames) => {
  var status = {
    message: '',
    className: '',
    serviceName: ''
  };
  serviceNames =
    Array.isArray(serviceNames) ? serviceNames : [serviceNames];

  // Find an error with an err.message. 'Error' is what feather returns when there is no msg text.
  const done = serviceNames.some(name => {
    const state = servicesState[name];

    if (state && state.isError && state.isError.message && state.isError.message !== 'Error') {
      status.message = `${name}: ${state.isError.message}`;
      status.className = state.isError.className;
      status.serviceName = name;
      return true;
    }

    return false;
  });

  if (done) { return status; }

  serviceNames.some(name => {
    const state = servicesState[name];

    if (state && !state.isError && (state.isLoading || state.isSaving)) {
      status.message = `${name} is ${state.isLoading ? 'loading' : 'saving'}`;
      status.className = state.isLoading ? 'isLoading' : 'isSaving';
      status.serviceName = name;
      return true;
    }

    return false;
  });

  return status;
};

/**
 * Method to bind a given dispatch function with the passed services.
 *
 * This helps with not having to pass down store.dispatch as a prop everywhere
 * Read More: http://redux.js.org/docs/api/bindActionCreators.html
 *
 * @param {Object} services - using the default reduxifyService method
 * @param {Function} dispatch - the relevant store.dispatch function which is to be bounded to actionCreators
 * @param {Array=} targetActions - list of action names to be targeted for binding
 * @returns {Object} boundServices - returns the new services object with the bounded action creators
 */

export const bindWithDispatch = (dispatch, services, targetActions) => {
  targetActions = targetActions || [
    // default targets from feathers-redux
    'find',
    'get',
    'create',
    'update',
    'patch',
    'remove',
    'reset',
    'store',
    // couple more optional ones in case feathers-reduxify-authentication is being used
    'authenticate',
    'logout'
  ];

  const _serviceNames = Object.keys(services);
  // map over the services object to get every service
  _serviceNames.forEach(_name => {
    const _methodNames = Object.keys(services[_name]);

    // map over every method in the service
    _methodNames.forEach(_method => {
      // if method is in targeted actions then replace it with bounded method
      if (targetActions.includes(_method)) {
        services[_name][_method] = bindActionCreators(
          services[_name][_method],
          dispatch
        );
      }
    });
  });

  return services;
};
