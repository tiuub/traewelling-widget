
export default class Cache {
  constructor(settings) {
    this.fileManager = settings.fileManager;
    this.cachePath = settings.cachePath;

    if (!this.fileManager.fileExists(this.cachePath)) {
      this.fileManager.createDirectory(this.cachePath)
    }
  }

  async read(key, expirationMinutes=2) {
    key = key.replace("https://", "").replace("http://", "").replace("www.", "").replaceAll('/', '_').replaceAll(':', '');
    try {
      const path = this.fileManager.joinPath(this.cachePath, key);
      await this.fileManager.downloadFileFromiCloud(path);
      const createdAt = this.fileManager.creationDate(path);
      
      if ((new Date()) - createdAt > ((expirationMinutes) * 60000)) {
        this.fileManager.remove(path);
        return null;
      }
      
      const value = this.fileManager.readString(path);
    
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
    key = key.replace("https://", "").replace("http://", "").replace("www.", "").replaceAll('/', '_').replaceAll(':', '');
    const path = this.fileManager.joinPath(this.cachePath, key);
    console.log(`Caching to ${path}...`);

    if (typeof value === 'string' || value instanceof String) {
      this.fileManager.writeString(path, value);
    } else {
      this.fileManager.writeString(path, JSON.stringify(value));
    }
  }

  async fetchJson({ url, headers, cacheKey, cacheExpiration }) {
    if (cacheKey) {
      const cached = await this.read(cacheKey, cacheExpiration);
      if (cached) {
        return cached;
      }
    }
  
    try {
      console.log(`Fetching url: ${url}`);
      const req = new Request(url);
      if (headers) {
        req.headers = headers;
      }
      const resp = await req.loadJSON();
      if (cacheKey) {
        this.write(cacheKey, resp);
      }
      return resp;
    } catch (error) {
      console.log(error);
    }
  }
}
