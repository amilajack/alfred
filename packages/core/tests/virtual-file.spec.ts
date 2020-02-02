import path from 'path';
import VirtualFileSystem from '../src/virtual-file';
import Project from '../src/project';

describe('virtual file system', () => {
  let fs;

  const project = new Project(path.join(__dirname, 'fixtures/react-app'));

  const file = {
    name: 'routes',
    path: 'src/routes.js'
  };

  beforeEach(() => {
    fs = new VirtualFileSystem(project);
  });

  it('should delete files', () => {
    fs.add(file);
    expect(fs.values()).not.toEqual([]);
    fs.delete('routes');
    expect(Array.from(fs.values())).toEqual([]);
  });

  it('should rename files', () => {
    fs.add(file)
      .get('routes')
      .rename('routes.ts');
    expect(fs.get('routes')).toHaveProperty('path', 'src/routes.ts');
  });

  it('should rename files', () => {
    fs.add(file)
      .get('routes')
      .rename('routes.ts');
    expect(fs.get('routes')).toHaveProperty('path', 'src/routes.ts');
  });

  it('should write to file', () => {
    fs.add(file)
      .get('routes')
      .write('console.log(1);');
    expect(fs.get('routes')).toHaveProperty('content', 'console.log(1);');
    fs.get('routes').write('alert(2);');
    expect(fs.get('routes')).toHaveProperty(
      'content',
      'console.log(1);alert(2);'
    );
  });
});
