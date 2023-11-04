// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-brown; icon-glyph: magic;
import Cache from './cache';
import * as http from './http';

export default class Updater {
  constructor(repo) {
    this.repo = repo;
    this.fm = FileManager.iCloud();
    this.cache = new Cache(`UpdaterCache`, 15);
  }

  async checkForUpdate(version) {
    const remoteVersion = await this.getLatestVersion();

    if (this.versionCompare(remoteVersion, version) > 0) {
      console.log(`Version ${remoteVersion} is greater than ${version}. Update available!`);

      return true;
    }

    console.log(`Version ${version} is not newer than ${remoteVersion}. Skipping update.`);

    return false;
  }

  async getLatestVersion() {
    const tag_name = await this.getLatestTagName()
    const version = tag_name.replace("v", "");

    return version;
  }

  async getLatestTagName() {
    const url = `https://api.github.com/repos/${this.repo}/releases`;
    const data = await http.fetchJson({
      url,
      cache: this.cache,
      cacheKey: `${this.repo.replace("/", "_")}Updater`,
      cacheExpiration: 0
    });

    if (!data || data.length === 0) {
      return null;
    }

    const matches = data
      .filter(x => !x.draft && !x.prerelease)
      .sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

    if (!matches|| matches.length === 0) {
      return null;
    }

    const release = matches[0];
    
    return release.tag_name
  }

  async updateScript(name) {
    const tag_name = await this.getLatestTagName()
    console.log(`Updating script to ${tag_name}!`)
    const url = `https://github.com/${this.repo}/releases/download/${tag_name}/${name}.js`
    console.log(`Update url: ${url}`)
    const req = new Request(url);
    const content = await req.loadString();

    const path = this.fm.joinPath(this.fm.documentsDirectory(), name + '.js');

    this.fm.writeString(path, content);
  }

  // Method to compare two versions. 
  // Returns 1 if v2 is smaller, -1 
  // if v1 is smaller, 0 if equal 
  versionCompare(v1, v2) 
  { 
    var vnum1 = 0, vnum2 = 0; 
    for (var i = 0, j = 0; (i < v1.length || j < v2.length);) { 
        while (i < v1.length && v1[i] != '.') { 
            vnum1 = vnum1 * 10 + (v1[i] - '0'); 
            i++; 
        } 
 
        while (j < v2.length && v2[j] != '.') { 
            vnum2 = vnum2 * 10 + (v2[j] - '0'); 
            j++; 
        } 
 
        if (vnum1 > vnum2) 
            return 1; 
        if (vnum2 > vnum1) 
            return -1; 
 
        vnum1 = vnum2 = 0; 
        i++; 
        j++; 
    } 
    return 0; 
  }
}
