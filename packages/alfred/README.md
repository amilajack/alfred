## alfred

## Usage

```js
import alfred from 'alfred';

const project = await alfred('/path/to/alfred/project');

// run a command
await project.run('start', {
  env: 'production',
  flags: {
    openInBrowser: true
  }
});
```
