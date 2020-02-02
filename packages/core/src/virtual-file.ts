import path from 'path';
import fs from 'fs';
import {
  ProjectInterface,
  VirtualFileInterface,
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
}

export default class VirtualFileSystem extends Map<string, SkillFile> {
  private project: ProjectInterface;

  constructor(project: ProjectInterface, files: SkillFile[] = []) {
    super(files.map(file => [file.name, new VirtualFile(this, file)]));
    this.project = project;
  }

  add(file: SkillFile): VirtualFileSystem {
    this.set(file.name, new VirtualFile(this, file));
    return this;
  }

  async writeAllFiles(): Promise<void> {
    const writeFiles = Array.from(this.values()).map(file =>
      fs.promises.writeFile(
        path.join(this.project.root, this.project.config.configsDir, file.path),
        file.content
      )
    );
    await Promise.all(writeFiles);
  }
}
