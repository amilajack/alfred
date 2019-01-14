// @flow
import path from 'path';
import pkgUp from 'pkg-up';

/**
 * Get the root of a project from the current working directory
 */
export async function getProjectRoot() {
  const pkgPath = await pkgUp();
  return path.dirname(pkgPath);
}

export default function expectOneSubcommand(args: Array<string>): string {
  switch (args.length) {
    case 0: {
      throw new Error('One subcommand must be passed');
    }
    case 1: {
      break;
    }
    default: {
      throw new Error('Only one subcommand can be passed');
    }
  }

  return args[0];
}
