const path = require('path');
const fs = require('fs');

module.exports = {
  name: 'redux',
  files: [
    {
      name: 'routes',
      path: 'src/routes.js',
      content: fs
        .readFileSync(path.join(__dirname, 'src/routes.jsx'))
        .toString()
    },
    {
      name: 'configureStore',
      path: 'src/store/configureStore.prod.js',
      content: fs
        .readFileSync(path.join(__dirname, 'src/store/configureStore.prod.js'))
        .toString()
    }
  ],
  transforms: {
    typescript(skill) {
      skill.files.get('configureStore').applyDiff(
        `@@ -12 +12 @@
-function configureStore(initialState) {
-  return createStore(rootReducer, initialState, enhancer);
+function configureStore(initialState?: counterStateType): Store {
+  return createStore(rootReducer, initialState, enhancer);`
      );
      return skill;
    }
  }
};
