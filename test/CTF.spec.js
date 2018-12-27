import * as CtfNodes from '../src/CTF';

const { getConfigs, default: CTF, getDependencies } = CtfNodes;

describe('CTF', () => {
  it('should do basic ctf', () => {
    const { babel, eslint, webpack } = CtfNodes;
    expect(getConfigs(CTF([babel, eslint, webpack]))).toMatchSnapshot();
    expect(getDependencies(CTF([babel, eslint, webpack]))).toMatchSnapshot();
  });
});
