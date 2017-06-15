
import { createStore, applyMiddleware } from 'redux';
import rootReducer from '../reducers';
import middleware from '../middleware';

export default function configureStore(reduxifiedServices, initialState) {
  // Engage the #awesome Chrome extension "Redux DevTools" if it is installed on the browser.
  // This extension watches reducers and logs their invocations, actions and changing state.
  // It caches activity so you can 'time travel' through state changes.
  // It runs in an extension reducing the size of your app bundle.
  // This interface can be left in prod bundles and the extension activated in the field as needed.
  // https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?utm_source=chrome-app-launcher-info-dialog
  
  const window = {}; // patch to run on server
  
  const createStoreWithDevTools = window.devToolsExtension
    ? window.devToolsExtension()(createStore)
    : createStore;
  
  const createStoreWithMiddlewares = applyMiddleware(...middleware)(createStoreWithDevTools);
  
  return createStoreWithMiddlewares(rootReducer(reduxifiedServices), initialState);
}
