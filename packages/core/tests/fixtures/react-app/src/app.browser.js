import React from 'react';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';

function App() {
  return <h1>Hello from Alfred!</h1>;
}

render(
  <AppContainer>
    <App />
  </AppContainer>,
  document.getElementById('root')
);
