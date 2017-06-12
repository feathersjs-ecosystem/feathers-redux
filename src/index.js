// import errors from 'feathers-errors';
import makeDebug from 'debug';

const debug = makeDebug('feathers-redux');

export default function init () {
  debug('Initializing feathers-redux plugin');
  return 'feathers-redux';
}
