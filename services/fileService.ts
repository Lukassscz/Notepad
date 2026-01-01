import { NoteFileStructure } from '../types';

export class FileService {
  static async openFile(): Promise<{ handle: FileSystemFileHandle, data: NoteFileStructure } | null> {
    try {
      const [handle] = await (window as any).showOpenFilePicker({
        types: [
          {
            description: 'MonoNote Files',
            accept: {
              'application/json': ['.mnote', '.json'],
            },
          },
        ],
        multiple: false,
      });

      const file = await handle.getFile();
      const text = await file.text();
      const data = JSON.parse(text) as NoteFileStructure;
      
      return { handle, data };
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('File open failed:', err);
      }
      return null;
    }
  }

  static async saveFile(handle: FileSystemFileHandle | null, data: NoteFileStructure): Promise<FileSystemFileHandle | null> {
    try {
      let targetHandle = handle;
      
      if (!targetHandle) {
        targetHandle = await (window as any).showSaveFilePicker({
          types: [
            {
              description: 'MonoNote Files',
              accept: {
                'application/json': ['.mnote', '.json'],
              },
            },
          ],
        });
      }

      const writable = await targetHandle.createWritable();
      await writable.write(JSON.stringify(data, null, 2));
      await writable.close();

      return targetHandle;
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('File save failed:', err);
      }
      return null;
    }
  }

  static async saveAs(data: NoteFileStructure): Promise<FileSystemFileHandle | null> {
    return this.saveFile(null, data);
  }
}
