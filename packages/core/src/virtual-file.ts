import path from 'path';
import emphasize from 'emphasize/lib/core';
import diffLang from 'highlight.js/lib/languages/diff';
import fs from 'fs-extra';
import { applyPatch } from 'diff';
import {
  ProjectInterface,
  VirtualFileInterface,
  VirtualFileSystemInterface,
  SkillFile,
  Dir
} from '@alfred/types';

export class VirtualFile implements VirtualFileInterface {
  public dest: string;

  public content = '';

  public name = '';

  private fs: VirtualFileSystem;

  condition: SkillFile['condition'];

  constructor(vfs: VirtualFileSystem, file: SkillFile) {
    this.dest = file.dest;
    this.name = file.alias || file.dest;
    this.condition = file.condition;
    this.content =
      typeof file.src === 'string'
        ? fs.readFileSync(file.src).toString()
        : file.content || '';
    this.fs = vfs;
  }

  move(destDir: string): VirtualFileInterface {
    this.dest = destDir;
    return this;
  }

  rename(fileName: string): VirtualFileInterface {
    const newPath = path.join(path.parse(this.dest).dir, fileName);
    this.dest = newPath;
    return this;
  }

  delete(): void {
    this.fs.delete(this.dest);
  }

  write(content: string): VirtualFileInterface {
    this.content += content;
    return this;
  }

  replace(
    searchValueOrContent: string,
    replaceValue?: string
  ): VirtualFileInterface {
    if (replaceValue) {
      this.content = this.content.replace(searchValueOrContent, replaceValue);
      return this;
    }
    this.content = searchValueOrContent;
    return this;
  }

  applyDiff(patch: string): VirtualFileInterface {
    emphasize.registerLanguage('diff', diffLang);
    const syntaxHighlightedPatch = emphasize.highlight('diff', patch).value;

    const patchResult = applyPatch(this.content, patch);
    if (!patchResult) {
      throw new Error(
        `The following patch could not be applied to "${this.dest}". Check the line numbers of the patch: \n\n ${syntaxHighlightedPatch}`
      );
    }
    this.content = patchResult;

    return this;
  }
}

export default class VirtualFileSystem extends Map<string, VirtualFile>
  implements VirtualFileSystemInterface {
  private dirs: Dir[] = [];
  constructor(files: SkillFile[] = [], dirs: Dir[] = []) {
    super();
    this.dirs = dirs;
    files.forEach(file => {
      this.add(file);
    });
  }

  addDir(dir: Dir): VirtualFileSystem {
    this.dirs.push(dir);
    return this;
  }

  add(file: SkillFile): VirtualFileSystem {
    this.set(file.alias || file.dest, new VirtualFile(this, file));
    return this;
  }

  async writeAllFiles(project: ProjectInterface): Promise<void> {
    // Copy all dirs
    await Promise.all(
      this.dirs.map(dir => fs.copy(dir.src, path.join(project.root, dir.dest)))
    );
    // Write all files
    const filesToWrite = Array.from(this.values()).map(async file => {
      if (typeof file.condition === 'function') {
        if (!(await file.condition({ project }))) return;
      }
      const filePath = path.join(
        project.root,
        project.config.configsDir,
        file.dest
      );
      const fileDir = path.dirname(filePath);
      if (!fs.existsSync(fileDir)) {
        await fs.promises.mkdir(fileDir, {
          recursive: true
        });
      }
      return fs.promises.writeFile(filePath, file.content);
    });
    await Promise.all(filesToWrite);
  }
}
