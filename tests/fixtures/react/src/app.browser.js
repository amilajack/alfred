/* eslint react/jsx-filename-extension: off */
import React from 'react';
import { render } from 'react-dom';
import App from './app';

render(<App />, document.getElementById('root'));

if (module.hot) {
  module.hot.accept('./app', () => {
    console.log('Accepting the updated printMe module!');
    render(<App />, document.getElementById('root'));
  });
}
