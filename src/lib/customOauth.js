import jsSHA from './sha256';

class URL {
    constructor(url) {
      this.url = url;
      this.protocol = null;
      this.hostname = null;
      this.port = null;
      this.pathname = null;
      this.searchParams = new URLSearchParams();
  
      // Parse the URL.
      const match = this.url.match("((?:(?:([^:]+):)?\/\/)?(([^:/]+)(?::([0-9]+))?))([^\\?#]*)(?:\\?([^#]*))?(?:#(.*))?");
      if (match) {
        this.protocol = match[2];
        this.hostname = match[4];
        this.port = match[5] || null;
        this.pathname = match[6];
        this.searchParams = new URLSearchParams(match[7]);
      }
    }

    toString() {
      return this.url;
    }
  
    get origin() {
      return this.protocol + '://' + this.hostname + (this.port ? ':' + this.port : '');
    }
  
    get href() {
      return this.origin + this.pathname + '?' + this.searchParams.toString();
    }
  }
  
  class URLSearchParams {
    constructor(params) {
      this.params = new Map();
  
      if (params) {
        if (typeof params === 'string') {
          params.split('&').forEach((param) => {
            const [key, value] = param.split('=');
            this.params.set(key, value);
          });
        } else if (typeof params === 'object') {
          for (const [key, value] of Object.entries(params)) {
            this.params.set(key, value);
          }
        }
      }
    }
  
    has(key) {
      return this.params.has(key);
    }
  
    get(key) {
      return this.params.get(key);
    }
  
    set(key, value) {
      this.params.set(key, value);
    }
  
    delete(key) {
      this.params.delete(key);
    }
  
    toString() {
      return [...this.params.entries()].map(([key, value]) => {
        return `${key}=${value}`;
      }).join('&');
    }
  } 


export class OAuth2Client {
    constructor(clientSettings) {
        this.settings = clientSettings;
    }

    get authorizationCode() {
        return new OAuth2AuthorizationCodeClient(this);
    }

    async getEndpoint(endpoint) {
        if (this.settings[endpoint] !== undefined) {
            return resolve(this.settings[endpoint], this.settings.server);
        }
        // If we got here it means we need to 'guess' the endpoint.
        if (!this.settings.server) {
            throw new Error(`Could not determine the location of ${endpoint}. Either specify ${endpoint} in the settings, or the "server" endpoint to let the client discover it.`);
        }
        
        switch (endpoint) {
            case 'authorizationEndpoint':
                return resolve('/authorize', this.settings.server);
            case 'tokenEndpoint':
                return resolve('/token', this.settings.server);
        }
    }

    async refreshToken(token) {
      if (!token.refreshToken) {
          throw new Error('This token didn\'t have a refreshToken. It\'s not possible to refresh this');
      }

      const body = {
          grant_type: 'refresh_token',
          refresh_token: token.refreshToken,
          client_id: this.settings.clientId
      };

      return this.tokenResponseToOAuth2Token(this.request('tokenEndpoint', body));
    }

    async request(endpoint, body) {
        const uri = await this.getEndpoint(endpoint);
        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
        };
        const req = new Request(uri);
        req.method = "post";
        req.body = generateQueryString(body);
        req.headers = headers;

        return await req.loadJSON();
    }

    tokenResponseToOAuth2Token(resp) {
        return resp.then(body => {
          var _a;
            return ({
                accessToken: body.access_token,
                expiresAt: body.expires_in ? Date.now() + (body.expires_in * 1000) : null,
                refreshToken: (_a = body.refresh_token) !== null && _a !== void 0 ? _a : null,
            });
        });
    }
}

function resolve(base, uri) {
    const match = uri.match("((?:(?:([^:]+):)?\/\/)?(([^:/]+)(?::([0-9]+))?))([^\\?#]*)(?:\\?([^#]*))?(?:#(.*))?");
    let url = match[1] + base;
    return new URL(url).toString();
}

function generateQueryString(params) {
    return new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([k, v]) => v !== undefined))).toString();
}

export class OAuth2AuthorizationCodeClient {
 
    constructor(client) {
  
      this.client = client;
  
    }
  
    async getAuthorizeUri(params) {
        const codeChallenge = await getCodeChallenge(params.codeVerifier);
        const authorizationEndpoint = await this.client.getEndpoint("authorizationEndpoint");
      let query = {
        client_id: this.client.settings.clientId,
        response_type: 'code',
        redirect_uri: params.redirectUri,
        code_challenge_method: codeChallenge[0],
        code_challenge: codeChallenge[1],
      };
      if (params.state) {
        query.state = params.state;
      }
      if (params.scope) {
        query.scope = params.scope.join(' ');
      }  
      return authorizationEndpoint + '?' + generateQueryString(query);
    }

    async getTokenFromCodeRedirect(url, params) {
        const { code } = await this.validateResponse(url, {
            state: params.state
        });

        return this.getToken({
            code,
            redirectUri: params.redirectUri,
            codeVerifier: params.codeVerifier,
        });
    }

    async validateResponse(url, params) {
        var _a;
        const queryParams = new URL(url).searchParams;
        if (!queryParams.has('code'))
            throw new Error(`The url did not contain a code parameter ${url}`);
        if (params.state && params.state !== queryParams.get('state')) {
            throw new Error(`The "state" parameter in the url did not match the expected value of ${params.state}`);
        }
        return {
            code: queryParams.get('code'),
            scope: queryParams.has('scope') ? queryParams.get('scope').split(' ') : undefined,
        };
    }
    /**
     * Receives an OAuth2 token using 'authorization_code' grant
     */
    async getToken(params) {
        const body = {
            grant_type: 'authorization_code',
            client_id: this.client.settings.clientId,
            code: params.code,
            redirect_uri: params.redirectUri,
            code_verifier: params.codeVerifier,
        };
        return this.client.tokenResponseToOAuth2Token(this.client.request('tokenEndpoint', body));
    }
}

// Using less secure getRandomValues function, because Scriptable doesnt come with crypto
function getRandomValues(array) {
    for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
    }
    return array;
}

export async function generateCodeVerifier() {
    const arr = new Uint8Array(32);
    getRandomValues(arr);
    return base64Url(arr);
}

export async function getCodeChallenge(codeVerifier) {
    const shaObj = new jsSHA('SHA-256', 'ARRAYBUFFER')
    shaObj.update(stringToBuffer(codeVerifier))
    let codeChallenge = shaObj.getHash('B64');
    codeChallenge = codeChallenge.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return ['S256', codeChallenge];  
}

function stringToBuffer(input) {

    const buf = new Uint8Array(input.length);
    for(let i=0; i<input.length;i++) {
      buf[i] = input.charCodeAt(i) & 0xFF;
    }
    return buf;
  
  }
  
function base64Url(buf) {
  return (
    btoa(String.fromCharCode(...new Uint8Array(buf)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
  );
}