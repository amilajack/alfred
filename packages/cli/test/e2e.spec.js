import Joker from '@amilajack/joker';

describe('e2e', () => {
  it('should get help commands', async () => {
    await new Joker()
      .base(require.resolve('../lib/alfred.js'))
      .run('help')
      .expect(result => {
        expect(result.stdout).toMatchSnapshot();
        expect(result.stderr).toEqual('');
      })
      .code(0)
      .end();
  });

  it.skip('should create new project', () => {});

  it.skip('should learn new alfred skill', () => {});
});
