// @flow
import Table from 'cli-table3';
import chalk from 'chalk';

(async () => {
  const alfred = await Alfred();
  const { map, subcommandDict } = alfred;

  const table = new Table({
    head: [
      chalk.bold('Subcommand'),
      chalk.bold('Skills'),
      chalk.bold('Description')
    ]
  });

  Array.from(map.entries()).forEach(([subcommand, skills]) => {
    const description = (() => {
      if (subcommandDict.has(subcommand)) {
        const interfaceForSubcommand = subcommandDict.get(subcommand);
        if (
          interfaceForSubcommand &&
          interfaceForSubcommand.module &&
          interfaceForSubcommand.module.description
        ) {
          return interfaceForSubcommand.module.description;
        }
      }
      return '';
    })();

    table.push([subcommand, Array.from(skills).join(', '), description]);
  });

  console.log(table.toString());
})();
