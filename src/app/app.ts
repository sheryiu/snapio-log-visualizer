import { isPlatformBrowser } from '@angular/common';
import { Component, inject, PLATFORM_ID, signal } from '@angular/core';
import { ButtonModule } from 'portal-ui-ng/base';
import { DividerComponent, MenuItemDirective, VerticalNavigationMenuComponent } from 'portal-ui-ng/components';
import { RootSidenavComponent } from 'portal-ui-ng/pages';

@Component({
  selector: 'app-root',
  imports: [DividerComponent, RootSidenavComponent, VerticalNavigationMenuComponent, MenuItemDirective, ButtonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('snapio-log-visualizer');

  storedFiles = signal<string[]>([]);

  constructor() {
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      this.initiateFileList();
    }
  }

  private async initiateFileList() {
    const root = await navigator.storage.getDirectory();
    const logsDir = await root.getDirectoryHandle('logs', { create: true });
    this.listStoredFiles(logsDir);
  }

  async openFilePicker(): Promise<void> {
    try {
      // Open file picker for .log files
      const [fileHandle] = await window.showOpenFilePicker({
        types: [
          {
            description: 'Log files',
            accept: { 'text/plain': ['.log'] }
          }
        ],
        multiple: false
      });

      if (!fileHandle) return;

      // Get the file from the handle
      const file = await fileHandle.getFile();

      // Store the file in OPFS
      await this.storeFileInOPFS(file);
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Error opening file picker:', error);
      }
    }
  }

  private async storeFileInOPFS(file: File): Promise<void> {
    try {
      // Get the OPFS root directory
      const root = await navigator.storage.getDirectory();

      // Create or get a 'logs' subdirectory
      const logsDir = await root.getDirectoryHandle('logs', { create: true });

      const fileName = file.name.includes('.') ? file.name.slice(0, file.name.lastIndexOf('.')) : file.name;
      // Create a file handle with the same name as the uploaded file
      const fileHandle = await logsDir.getFileHandle(fileName, { create: true });

      // Create a writable stream
      const writable = await fileHandle.createWritable();

      // Write the file contents
      await writable.write(file);
      await writable.close();

      console.log(`File stored in OPFS: ${fileName}`);

      // Log all stored files
      await this.listStoredFiles(logsDir);
    } catch (error) {
      console.error('Error storing file in OPFS:', error);
      throw error;
    }
  }

  private async listStoredFiles(logsDir: FileSystemDirectoryHandle): Promise<void> {
    const storedFiles: string[] = [];

    for await (const entry of logsDir.entries()) {
      const [name, handle] = entry;
      if (handle.kind === 'file') {
        storedFiles.push(name);
      }
    }

    console.log('Stored log files:', storedFiles);
    this.storedFiles.set(storedFiles);
  }
}
