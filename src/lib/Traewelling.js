import { generateCodeVerifier } from './customOauth';
import * as jsonUtil from './json-util'

export class Traewelling {

    constructor(settings) {
        this.fileManager = settings.fileManager;
        this.authorizationDir = settings.authorizationDir;

        this.accesstokenFile = this.fileManager.joinPath(this.authorizationDir, "access_token.json");
        this.codeVerifierFile = this.fileManager.joinPath(this.authorizationDir, "code_verifier.json");

        this.oauth2Client = settings.oauth2Client;
        this.redirectUri = settings.redirectUri;
        this.cache = settings.cache;
    }

    async readJsonFromFile(fileManager, file) {       
        if (!fileManager.fileExists(file)) {
          return undefined;
        }
        
        await fileManager.downloadFileFromiCloud(file);

        return jsonUtil.loadFromFile(fileManager, file);
    }

    async readTokenFromFile(fileManager, file) {
        let contents = await this.readJsonFromFile(fileManager, file);
        
        return contents;
    }

    async readCodeVerifierFromFile(fileManager, file) {
        let contents = await this.readJsonFromFile(fileManager, file);

        if (!contents) {
            return undefined;
        }

        if (new Date(contents.date) < new Date() - (10 * 60 * 1000)) {
            fileManager.remove(file);
            return undefined;
        }

        return contents.codeVerifier;
    }

    writeJsonToFile(fileManager, file, json) {
        jsonUtil.writeToFile(fileManager, file, json);
    }

    writeTokenToFile(fileManager, file, token) {
        this.writeJsonToFile(fileManager, file, token);
    }

    writeCodeVerifierToFile(fileManager, file, codeVerifier) {
        let json = {"codeVerifier": codeVerifier, "date": new Date()};
        this.writeJsonToFile(fileManager, file, json);
    }

    async getToken() {
        if (this.token) {
            return this.token;
        }
        this.token = await this.readTokenFromFile(this.fileManager, this.accesstokenFile);
        return this.token
    }

    setToken(token) {
        this.token = token;
        this.writeTokenToFile(this.fileManager, this.accesstokenFile, token);
    }

    async getCodeVerifier() {
        if (this.codeVerifier) {
            return this.codeVerifier;
        }

        this.codeVerifier = await this.readCodeVerifierFromFile(this.fileManager, this.codeVerifierFile);
        return this.codeVerifier;
    }

    setCodeVerifier(codeVerifier) {
        this.codeVerifier = codeVerifier;
        this.writeCodeVerifierToFile(this.fileManager, this.codeVerifierFile, codeVerifier);
    }

    async fetch(url, cacheExpiration=0) {
        let token = await this.getToken()

        if (!await this.isTokenValid()) {
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

    async isAuthenticated() {
        if (!await this.getToken()) {
            return false;
        }
        return true;
    }

    async isTokenValid() {
        if (!await this.isAuthenticated()) {
            return false;
        }
        if ((await this.getToken()).exiresAt < new Date()) {
            return false;
        }
        return true;
    }

    async isAuthenticationProcessStarted() {
        if (!await this.getCodeVerifier()) {
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
        
              codeVerifier: await this.getCodeVerifier(),
            }
        );

        this.setToken(token);
    }

    async fetchTokenFromQueryParameters(queryParameters) {
        let token = await this.oauth2Client.authorizationCode.getToken({
            code: queryParameters.code,
            redirectUri: this.redirectUri,
            codeVerifier: await this.getCodeVerifier(),
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