function app() {
  console.log('hello world!');
}

app();

if (module.hot) {
  module.hot.accept('./app.browser.js', () => {
    app();
  });
}
