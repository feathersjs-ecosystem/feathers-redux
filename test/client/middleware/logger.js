
// See http://redux.js.org/docs/advanced/Middleware.html

const logger = store => next => action => {
  console.groupCollapsed(action.type);
  console.info('dispatching', action);
  const result = next(action);
  console.log('next state', store.getState());
  console.groupEnd(action.type);
  return result;
};

export default logger;
