const path = require('path');

module.exports = {
  name: 'react',
  description: 'A JavaScript library for building user interfaces',
  files: [
    {
      src: path.join(__dirname, 'boilerplate/index.js'),
      dest: 'src/app.browser.js'
    }
  ],
  hooks: {
    beforeLearn({ skill, interfaceStates }) {
      // @TODO @HACK Move this to proposed bootstrap API
      // https://github.com/amilajack/alfred/issues/217
      const isBrowserApp = interfaceStates.some(state => {
        return state.target === 'browser' && state.projectType === 'app';
      });
      if (isBrowserApp) {
        skill.files.add({
          src: path.join(__dirname, 'boilerplate/index.html'),
          dest: 'src/index.html'
        });
      }
    }
  }
};
