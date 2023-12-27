import { generateCodeVerifier } from './customOauth';
import * as jsonUtil from './json-util'

export class Traewelling {

    constructor(settings) {
        this.fileManager = settings.fileManager;
        this.authorizationDir = settings.authorizationDir;

        this.accesstokenFile = this.fileManager.joinPath(this.authorizationDir, "access_token.json");
        this.codeVerifierFile = this.fileManager.joinPath(this.authorizationDir, "code_verifier.json");

        if (!this.fileManager.fileExists(this.authorizationDir)) {
            this.fileManager.createDirectory(this.authorizationDir)
          }

        if (!this.fileManager.fileExists(this.accesstokenFile)) {
            this.fileManager.downloadFileFromiCloud(this.accesstokenFile);
        }
        
        if (!this.fileManager.fileExists(this.codeVerifierFile)) {
            this.fileManager.downloadFileFromiCloud(this.codeVerifierFile);
        }

        this.oauth2Client = settings.oauth2Client;
        this.redirectUri = settings.redirectUri;
        this.cache = settings.cache;
    }

    readTokenFromFile() {
        if (!this.fileManager.fileExists(this.accesstokenFile)) {
            return undefined;
        }
    
        let contents = jsonUtil.loadFromFile(this.fileManager, this.accesstokenFile);
        
        return contents;
    }

    writeTokenToFile(token) {
        jsonUtil.writeToFile(this.fileManager, this.accesstokenFile, token);
    }

    getToken() {
        if (this.token) {
            return this.token;
        }
        this.token = this.readTokenFromFile();
        return this.token
    }

    setToken(token) {
        this.token = token;
        this.writeTokenToFile(token);
    }

    readCodeVerifierFromFile() {
        if (!this.fileManager.fileExists(this.codeVerifierFile)) {
          return undefined;
        }
        let contents = jsonUtil.loadFromFile(this.fileManager, this.codeVerifierFile);
        if (new Date(contents.date) < new Date() - (10 * 60 * 1000)) {
          return undefined;
        }
        
        this.fileManager.remove(this.codeVerifierFile);

        return contents.codeVerifier;
    }

    writeCodeVerifierToFile(codeVerifier) {
        let json = {"codeVerifier": codeVerifier, "date": new Date()};
        jsonUtil.writeToFile(this.fileManager, this.codeVerifierFile, json);
    }

    getCodeVerifier() {
        if (this.codeVerifier) {
            return this.codeVerifier;
        }
        this.codeVerifier = this.readCodeVerifierFromFile();
        return this.codeVerifier;
    }

    setCodeVerifier(codeVerifier) {
        this.codeVerifier = codeVerifier;
        this.writeCodeVerifierToFile(this.codeVerifier);
    }

    async fetch(url, cacheExpiration=0) {
        let token = this.getToken()

        if (!this.isTokenValid) {
            token = this.oauth2Client.refreshToken(token);
            this.setToken(token);
        }
        
        let headers = {'Authorization': 'Bearer ' + token.accessToken};

        if (this.cache) {
            return await this.cache.fetchJson({
                url: url, 
                headers: headers, 
                cacheKey: url, 
                cacheExpiration: cacheExpiration});
        }

        let req = new Request(url);
        req.headers = headers;
        return await req.loadJSON();
    }

    isAuthenticated() {
        if (!this.getToken()) {
            return false;
        }
        return true;
    }

    isTokenValid() {
        if (!this.isAuthenticated()) {
            return false;
        }
        if (this.getToken().exiresAt < new Date()) {
            return false;
        }
        return true;
    }

    isAuthenticationProcessStarted() {
        if (!this.getCodeVerifier()) {
            return false;
        }
        return true;
    }

    async getAuthorizeUri() {
        const codeVerifier = await generateCodeVerifier();

        let authorizeUri = await this.oauth2Client.authorizationCode.getAuthorizeUri({
            redirectUri: this.redirectUri,

            state: 'some-string',

            codeVerifier,

            scope: ['read-statistics'],
        });
        this.setCodeVerifier(codeVerifier);
        return authorizeUri;
    }

    async fetchTokenFromCodeRedirect(redirectUri) {
        let token = await this.oauth2Client.authorizationCode.getTokenFromCodeRedirect(
            redirectUri,
            {
              redirectUri: this.redirectUri,
        
              state: 'some-string',
        
              codeVerifier: this.getCodeVerifier(),
            }
        );

        this.setToken(token);
    }

    async fetchTokenFromQueryParameters(queryParameters) {
        let token = await this.oauth2Client.authorizationCode.getToken({
            code: queryParameters.code,
            redirectUri: this.redirectUri,
            codeVerifier: this.getCodeVerifier(),
        });

        this.setToken(token);
    }

    async getUserInfo(cacheExpiration=0) {
        return await this.fetch("https://traewelling.de/api/v1/auth/user", cacheExpiration);
    }

    async getStatsDaily(date, cacheExpiration=0) {
        return await this.fetch(`https://traewelling.de/api/v1/statistics/daily/${date}`, cacheExpiration);
    }
}