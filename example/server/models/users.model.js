const NeDB = require('nedb');
const path = require('path');

module.exports = function (app) {
  const dbPath = app.get('nedb');
  const Model = new NeDB({
    // filename: path.join(dbPath, 'users.db'), // patch so table resides in-memory
    autoload: true
  });

  return Model;
};
