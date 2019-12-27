## @alfred/core

`@alfred/core` has the the following responsibilities
* Validating alfred configs
* Handling CTF transforms
* Diffing dependencies (but not installing them)

## Usage

```js
import Alfred from '@alfred/core';

const { config, alfred } = await Alfred('/path/to/alfred/project');

console.log(config.skills);

await alfred.run('start', {
  env: 'production',
  options: {
    pkgAutoFormatting: false
  },
  flags: {
    openInBrowser: true
  }
});
```
