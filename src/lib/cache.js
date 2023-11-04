// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: light-gray; icon-glyph: magic;
export default class Cache {
  constructor(name, expirationMinutes) {
    this.fm = FileManager.iCloud();
    this.cachePath = this.fm.joinPath(this.fm.documentsDirectory(), name);
    this.expirationMinutes = expirationMinutes;

    if (!this.fm.fileExists(this.cachePath)) {
      this.fm.createDirectory(this.cachePath)
    }
  }

  async read(key, expirationMinutes) {
    try {
      const path = this.fm.joinPath(this.cachePath, key);
      await this.fm.downloadFileFromiCloud(path);
      const createdAt = this.fm.creationDate(path);
      
      if (expirationMinutes || this.expirationMinutes) {
        if ((new Date()) - createdAt > ((expirationMinutes || this.expirationMinutes) * 60000)) {
          this.fm.remove(path);
          return null;
        }
      }
      
      const value = this.fm.readString(path);
    
      try {
        console.log(`Reading from cache...`);
        return JSON.parse(value);
      } catch(error) {
        return value;
      }
    } catch(error) {
      return null;
    }
  };

  write(key, value) {
    const path = this.fm.joinPath(this.cachePath, key.replace('/', '-'));
    console.log(`Caching to ${path}...`);

    if (typeof value === 'string' || value instanceof String) {
      this.fm.writeString(path, value);
    } else {
      this.fm.writeString(path, JSON.stringify(value));
    }
  }
}
