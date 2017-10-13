let program;_550‍.w('commander',[["default",function(v){program=v}]]);let glob;_550‍.w('glob',[["default",function(v){glob=v}]]);let alfred;_550‍.w('./providers',[["default",function(v){alfred=v}]]);



program.version('0.0.1').command('rmdir <dir> [otherDirs...]').action((dir, otherDirs) => {
  console.log('rmdir %s', dir);
  if (otherDirs) {
    otherDirs.forEach((oDir) => {
      console.log('rmdir %s', oDir);
    });
  }
}).parse(process.argv);
