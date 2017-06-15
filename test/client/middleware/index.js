
import reduxThunk from 'redux-thunk';
import reduxPromiseMiddleware from 'redux-promise-middleware';

import logger from './logger';

export default [
  reduxThunk,
  reduxPromiseMiddleware(),
  //logger, // doesn't work on server
];
