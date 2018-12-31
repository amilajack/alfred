/* eslint no-restricted-syntax: off */
import powerset from '@amilajack/powerset';
import CTF, {
  CTFS,
  getConfigs,
  getDependencies,
  writeConfigsFromCtf,
  getExecuteWrittenConfigsMethods
} from '../../src/CTF';

describe('CTF', () => {
  describe('executors', () => {
    let ctf;

    beforeAll(() => {
      ctf = new Map();
      ctf.set('build', CTFS.webpack);
    });

    it('should create simple executor', () => {
      expect(getExecuteWrittenConfigsMethods(ctf)).toMatchSnapshot();
    });

    it('should run simple executor', async () => {
      await writeConfigsFromCtf(ctf);
      expect(getExecuteWrittenConfigsMethods(ctf).build()).toMatchSnapshot();
    });
  });

  // Generate tests for CTF combinations
  const ctfNamesCombinations = powerset(Object.keys(CTFS)).sort();
  for (const ctfCombination of ctfNamesCombinations) {
    it(`combination ${ctfCombination.join(',')}`, () => {
      expect(ctfCombination).toMatchSnapshot();
      // Get the CTFs for each combination
      const filteredCtfs = ctfCombination.map(ctfName => CTFS[ctfName]);
      const result = CTF(filteredCtfs);
      expect(getConfigs(result)).toMatchSnapshot();
      expect(getDependencies(result)).toMatchSnapshot();
    });
  }
});
