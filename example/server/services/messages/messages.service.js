'use strict';

// Initializes the `messages` service on path `/messages`
const createService = require('feathers-memory');
const hooks = require('./messages.hooks');
const filters = require('./messages.filters');

module.exports = function () {
  const app = this;
  const paginate = app.get('paginate');

  const options = {
    name: 'messages',
    paginate
  };

  // Initialize our service with any options it requires
  app.use('/messages', createService(options));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('messages');

  service.hooks(hooks);

  if (service.filter) {
    service.filter(filters);
  }
};
