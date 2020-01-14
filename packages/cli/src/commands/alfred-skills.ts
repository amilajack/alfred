import alfred from '@alfred/core';
import Table, { HorizontalTable } from 'cli-table3';
import chalk from 'chalk';

(async () => {
  const project = await alfred();
  const { subCommandAndSkills, subCommandDict } = await project.skills();

  const table = new Table({
    head: [
      chalk.bold('SubCommand'),
      chalk.bold('Skills'),
      chalk.bold('Description')
    ]
  }) as HorizontalTable;

  Array.from(subCommandAndSkills.entries()).forEach(([subCommand, skills]) => {
    const description = (() => {
      if (subCommandDict.has(subCommand)) {
        const interfaceForSubCommand = subCommandDict.get(subCommand);
        if (
          interfaceForSubCommand &&
          interfaceForSubCommand.module &&
          interfaceForSubCommand.module.description
        ) {
          return interfaceForSubCommand.module.description;
        }
      }
      return '';
    })();

    table.push([subCommand, Array.from(skills).join(', '), description]);
  });

  console.log(table.toString());
})();
