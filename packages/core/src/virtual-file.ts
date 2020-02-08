import path from 'path';
import fs from 'fs';
import emphasize from 'emphasize/lib/core';
import diffLang from 'highlight.js/lib/languages/diff';
import { applyPatch } from 'diff';
import {
  ProjectInterface,
  VirtualFileInterface,
  VirtualFileSystemInterface,
  SkillFile
} from '@alfred/types';

export class VirtualFile implements VirtualFileInterface {
  public path: string;

  public content = '';

  public name = '';

  private fs: VirtualFileSystem;

  constructor(fs: VirtualFileSystem, file: SkillFile) {
    this.path = file.path;
    this.name = file.name;
    this.content = file.content || '';
    this.fs = fs;
  }

  move(destDir: string): VirtualFileInterface {
    this.path = destDir;
    return this;
  }

  rename(fileName: string): VirtualFileInterface {
    const newPath = path.join(path.parse(this.path).dir, fileName);
    this.path = newPath;
    return this;
  }

  delete(): void {
    this.fs.delete(this.path);
  }

  write(content: string): VirtualFileInterface {
    this.content += content;
    return this;
  }

  replace(content: string): VirtualFileInterface {
    this.content = content;
    return this;
  }

  applyDiff(patch: string): VirtualFileInterface {
    emphasize.registerLanguage('diff', diffLang);
    const syntaxHighlightedPatch = emphasize.highlight('diff', patch).value;

    const patchResult = applyPatch(this.content, patch);
    if (!patchResult) {
      throw new Error(
        `The following patch could not be applied to "${this.path}". Check the line numbers of the patch: \n\n ${syntaxHighlightedPatch}`
      );
    }
    this.content = patchResult;

    return this;
  }
}

export default class VirtualFileSystem extends Map<string, SkillFile>
  implements VirtualFileSystemInterface {
  constructor(files: SkillFile[] = []) {
    super();
    files.forEach(file => {
      this.add(file);
    });
  }

  add(file: SkillFile): VirtualFileSystem {
    this.set(file.name, new VirtualFile(this, file));
    return this;
  }

  async writeAllFiles(project: ProjectInterface): Promise<void> {
    const writeFiles = Array.from(this.values()).map(file =>
      fs.promises.writeFile(
        path.join(project.root, project.config.configsDir, file.path),
        file.content
      )
    );
    await Promise.all(writeFiles);
  }
}
