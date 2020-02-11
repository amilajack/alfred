const path = require('path');

module.exports = {
  name: 'react',
  description: 'A JavaScript library for building user interfaces',
  files: [
    {
      src: path.join(__dirname, 'boilerplate/index.html'),
      dest: 'src/index.html',
      condition({ project }) {
        return project.interfaceStates.some(state => {
          return state.target === 'browser' && state.projectType === 'app';
        });
      }
    },
    {
      src: path.join(__dirname, 'boilerplate/index.js'),
      dest: 'src/app.browser.js'
    }
  ]
};
