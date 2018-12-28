import * as CtfNodes from '../src/CTF';

const { getConfigs, default: CTF, getDependencies, ...ctfs } = CtfNodes;

describe('CTF', () => {
  it('should do basic ctf', () => {
    expect(getConfigs(CTF(Object.values(ctfs)))).toMatchSnapshot();
    expect(getDependencies(CTF(Object.values(ctfs)))).toMatchSnapshot();
  });
});
