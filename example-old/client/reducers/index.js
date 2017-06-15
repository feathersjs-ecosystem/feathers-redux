
import { combineReducers } from 'redux';
import { services } from '../feathers';

export default combineReducers({
  users: services.users.reducer,
  messages: services.messages.reducer,
});

