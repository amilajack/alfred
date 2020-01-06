## alfred

## Installation

```bash
npm install alfred
```

## Usage
```js
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
