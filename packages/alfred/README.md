## alfred

### CLI

```bash
# Create a new project
alfred new project
cd my-project

# Build your project
alfred run build

# See docs for more commands
# https://alfred.js.org/docs/cli
```

### API

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

// See the [full API docs](https://alfred.js.org/docs/api/)
```
