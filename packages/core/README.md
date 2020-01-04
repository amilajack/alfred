## @alfred/core

`@alfred/core` has the the following responsibilities
* Validating alfred configs
* Handling CTF transforms
* Diffing dependencies (but not installing them)

## Usage

```js
import alfred from '@alfred/core';

const opts = {};
const { config, run } = await Alfred('/path/to/alfred/project', { ...opts });

console.log(config.skills);

await run('start', {
  env: 'production',
  options: {
    pkgAutoFormatting: true
  },
  flags: {
    openInBrowser: true
  }
});
```
