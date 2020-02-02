import path from 'path';
import fs from 'fs';
import {
  ProjectInterface,
  VirtualFileInterface,
  SkillFile
} from '@alfred/types';

export default class VirtualFile implements VirtualFileInterface {
  public path: string;

  public content = '';

  private fs: VirtualFileSystem;

  constructor(fs: VirtualFileSystem, file: SkillFile) {
    this.path = file.path;
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

export class VirtualFileSystem extends Set {
  private project: ProjectInterface;

  private files: Map<string, VirtualFile>;

  constructor(project: ProjectInterface, files: SkillFile[] = []) {
    super();
    this.project = project;
    this.files = new Map(
      files.map(file => [file.name, new VirtualFile(this, file)])
    );
  }

  async writeAllFiles(): Promise<void> {
    const writeFiles = Array.from(this.files.values()).map(file =>
      fs.promises.writeFile(
        path.join(this.project.root, this.project.config.configsDir, file.path),
        file.content
      )
    );
    await Promise.all(writeFiles);
  }
}
