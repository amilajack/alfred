function app() {
  const h1 = document.createElement('h1');
  h1.innerText = 'Hello from Alfred!';
  document.body.appendChild(h1);
}

app();

if (module.hot) {
  module.hot.accept('./app.browser.js', () => {
    app();
  });
}
