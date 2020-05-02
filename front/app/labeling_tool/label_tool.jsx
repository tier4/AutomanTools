
import React from 'react';
import ReactDOM from 'react-dom';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import { SnackbarProvider } from 'notistack';
import thunk from 'redux-thunk';

import LabelTool from 'automan/labeling_tool/base_label_tool';
import reducer from 'automan/labeling_tool/reducers/reducer';

const store = createStore(
  reducer,
  applyMiddleware(thunk)
);
ReactDOM.render(
  <Provider store={store}>
    <SnackbarProvider maxSnack={3}>
      <LabelTool />
    </SnackbarProvider>
  </Provider>,
  document.getElementById('wrapper')
);

