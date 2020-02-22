## @alfred/core

## Usage

```js
import alfred from '@alfred/core';

const project = await alfred('/path/to/alfred/project');

// run a command
await project.run('start', {
  env: 'production',
  flags: {
    openInBrowser: true
  }
});
```
