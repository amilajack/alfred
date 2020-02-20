import alfred from '@alfred/core';
import Table, { HorizontalTable } from 'cli-table3';
import chalk from 'chalk';

(async (): Promise<void> => {
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
    const description = ((): string => {
      if (subCommandDict.has(subCommand)) {
        const taskForSubCommand = subCommandDict.get(subCommand);
        if (
          taskForSubCommand &&
          taskForSubCommand.module &&
          taskForSubCommand.module.description
        ) {
          return taskForSubCommand.module.description;
        }
      }
      return '';
    })();

    table.push([subCommand, Array.from(skills).join(', '), description]);
  });

  console.log(table.toString());
})();
