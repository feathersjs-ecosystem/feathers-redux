
/* global io */

import feathers from 'feathers-client';
import reduxifyServices, { getServicesStatus as getStatus } from '../../../lib';

const socket = io();

const app = feathers()
  .configure(feathers.socketio(socket))
  .configure(feathers.hooks())
  .configure(feathers.authentication({ storage: window.localStorage }));

export default app;
export const services = reduxifyServices(app, ['users', 'messages']);
export const getServicesStatus = getStatus;
