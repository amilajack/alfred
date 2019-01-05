/* eslint no-restricted-syntax: off, import/no-extraneous-dependencies: off */
import powerset from '@amilajack/powerset';
import CTF, {
  CTFS,
  getConfigs,
  getDependencies,
  getDevDependencies,
  getExecuteWrittenConfigsMethods
} from '../src';

describe('CTF', () => {
  describe('executors', () => {
    let ctf;

    beforeAll(() => {
      ctf = new Map();
      ctf.set('webpack', CTFS.webpack);
    });

    it('should generate functions for scripts', () => {
      expect(getExecuteWrittenConfigsMethods(ctf)).toMatchSnapshot();
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
      expect(getDevDependencies(result)).toMatchSnapshot();
    });
  }

  it('should add devDepencencies', () => {
    const { devDependencies } = CTF([CTFS.webpack])
      .get('webpack')
      .addDevDependencies({
        foobar: '0.0.0'
      });
    expect(devDependencies).toMatchSnapshot();
  });
});
