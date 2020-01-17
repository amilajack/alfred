## @alfred/core

`@alfred/core` has the the following responsibilities
* Validating alfred configs
* Handling CTF transforms
* Diffing dependencies (but not installing them)

`@alfred/core` should be hidden from users by default. The `alfred` serves as a wrapper for it. Advanced users should be able to swap different versions of core that are used by `alfred`.

## Usage

```js
import alfred from '@alfred/core';

const { config, run } = await alfred('/path/to/alfred/project');

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
