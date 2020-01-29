import path from 'path';
import fs from 'fs';
import { FileInterface } from '@alfred/types';

export default class File implements FileInterface {
  public path: string;

  constructor(filePath: string) {
    this.path = filePath;
  }

  async move(destDir: string): Promise<FileInterface> {
    fs.promises.rename(this.path, destDir);
    this.path = destDir;
    return this;
  }

  async rename(fileName: string): Promise<FileInterface> {
    const newPath = path.join(path.parse(this.path).dir, fileName);
    await fs.promises.rename(this.path, newPath);
    this.path = newPath;
    return this;
  }

  async delete(): Promise<void> {
    await fs.promises.unlink(this.path);
  }

  async write(contents: string): Promise<FileInterface> {
    await fs.promises.writeFile(this.path, contents);
    return this;
  }

  async append(contents: string): Promise<FileInterface> {
    await fs.promises.appendFile(this.path, contents);
    return this;
  }
}
