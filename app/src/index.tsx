import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './app/App';
import config from './config/config';
import * as serviceWorker from './serviceWorker';
// Using HashRouter instead of BrowserRouter for use on Github Pages
import { HashRouter as Router } from 'react-router-dom';
import { ThemeProvider } from '@material-ui/styles';
import { createMuiTheme } from '@material-ui/core';

const darkTheme = createMuiTheme({
  palette: {
    type: 'dark',
  },
});

ReactDOM.render(
  <ThemeProvider theme={darkTheme}>
    <Router>
      <App backendURI={config().BACKEND_URI} />
    </Router>
  </ThemeProvider>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
