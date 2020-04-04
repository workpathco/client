import Cookies from 'js-cookie';
import { STATE_PREFIX } from './shared';
import Crypto from './crypto';
import { CodeVerifierError, DataError } from './error';
import Iframe from './iframe';
import request from './request';
import T, { Token } from './token';

export const LOGGED_IN_KEY = '_wp_logged';

export type AuthorizationUrl = string;
export type UrlPayload = {
  prompt?: string;
  response_mode?: string;
};
export type AuthenticationOptions = {
  redirect_uri: string;
  client_id: string;
  scope?: string;
};
export type ConsumePayload = {
  state: string;
  code: string;
};
export type Events = {
  onSuccess?: () => void;
  onError?: () => void;
};
class Authenticate {
  private _options: AuthenticationOptions = {
    redirect_uri: null,
    client_id: null,
    scope: null
  };

  public token: T;
  private _iframe: Iframe;

  constructor(options: AuthenticationOptions) {
    this._options = { ...this._options, ...options };
    if (!this._options.scope) {
      this._options.scope = 'offline_access';
    }
    this.token = new T();
    this._iframe = new Iframe(this._options);
  }

  async url(payload: UrlPayload = {}): Promise<AuthorizationUrl | void> {
    try {
      const state = Crypto.randomString(32);
      const codeVerifier = Crypto.randomString(32);
      const code_challenge = await Crypto.sha256(codeVerifier);
      this.setState(state, codeVerifier);

      const authorizationEndpointUrl = new URL(
        `${process.env.AUTH_URL || 'https://auth.workpath.co'}/oauth/authorize`
      );

      // here we encode the authorization request
      const searchParams = new URLSearchParams({
        state,
        code_challenge,
        response_type: 'code',
        code_challenge_method: 'S256',
        scope: this._options.scope,
        client_id: this._options.client_id,
        redirect_uri: this._options.redirect_uri,
        ...payload
      });

      authorizationEndpointUrl.search = searchParams.toString();
      return authorizationEndpointUrl.toString();
    } catch (err) {
      throw new Error(
        `Error creating authorization url. Reason: ${err.message}`
      );
    }
  }

  async logout() {
    this.removeIsLoggedIn();
    this.token.removeToken();

    const logoutUrl = new URL(`${process.env.AUTH_URL}/logout`);
    const params = new URLSearchParams({
      redirect_uri: this._options.redirect_uri,
      client_id: this._options.client_id
    });
    logoutUrl.search = params.toString();
    window.location.href = '';
    window.location.assign(logoutUrl.toString());
  }

  async login() {
    const authUrl = await this.url();
    if (authUrl) {
      document.location.href = '';
      document.location.assign(authUrl);
    }
  }

  async renew(): Promise<Token | null> {
    const authUrl = await this.url({
      prompt: 'none',
      response_mode: 'web_message'
    });
    if (authUrl) {
      const { code, state } = await this._iframe.run(authUrl);
      await this.consume({ code, state });
      return this.token.getToken();
    }
    return null;
  }
  async consume(
    { state: _state, code }: ConsumePayload = { state: null, code: null }
  ): Promise<void> {
    const params = new URLSearchParams(window.location.search);
    const state = _state || params.get('state');
    const code_verifier = this.getState(state);
    if (!code_verifier) {
      throw new CodeVerifierError();
    }
    const requestParams = new URLSearchParams({
      code_verifier,
      code: code || params.get('code'),
      code_method_challenge: 'S256',
      grant_type: 'authorization_code',
      scope: this._options.scope,
      client_id: this._options.client_id,
      redirect_uri: this._options.redirect_uri
    });

    const response = await request.post(
      '/oauth/token',
      requestParams.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    if (!response || !response.data) {
      this.removeState(state);
      throw new DataError();
    }
    this.token.setToken(response.data);
    this.setIsLoggedIn();
    this.removeState(state);
  }
  setIsLoggedIn() {
    Cookies.set(LOGGED_IN_KEY, '1');
  }
  removeIsLoggedIn() {
    Cookies.remove(LOGGED_IN_KEY);
  }
  isLoggedIn(): boolean {
    return !!Cookies.get(LOGGED_IN_KEY);
  }

  getState(state: string) {
    return sessionStorage.getItem(`${STATE_PREFIX}${state}`);
  }

  setState(state: string, codeVerifier: string) {
    sessionStorage.setItem(`${STATE_PREFIX}${state}`, codeVerifier);
  }

  removeState(state: string) {
    sessionStorage.removeItem(`${STATE_PREFIX}${state}`);
  }
}
export { Authenticate };
