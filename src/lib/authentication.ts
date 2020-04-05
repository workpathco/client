import Lock from 'browser-tabs-lock';
import * as storage from './storage';
import Crypto from './crypto';
import Transactioner from './transactioner';
import { AuthenticationError, CodeVerifierError, DataError } from './error';
import Iframe from './iframe';
import request from './request';
import T, { Token } from './token';

export const LOGGED_IN_KEY = '_wp_logged';
const lock = new Lock();
const RENEW_LOCK_KEY = '_wp_lock_renew';

export type AuthorizationUrl = {
  url: string;
  state: string;
};
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
  error: string;
  error_description: string;
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
  private _transactioner: Transactioner;

  constructor(options: AuthenticationOptions) {
    this._options = { ...this._options, ...options };
    if (!this._options.scope) {
      this._options.scope = 'offline_access';
    }
    this.token = new T();
    this._iframe = new Iframe();
    this._transactioner = new Transactioner();
  }

  async url(payload: UrlPayload = {}): Promise<AuthorizationUrl | void> {
    try {
      const state = Crypto.randomString(32);
      const codeVerifier = Crypto.randomString(32);
      const code_challenge = await Crypto.sha256(codeVerifier);

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

      this._transactioner.create(state, {
        code_verifier: codeVerifier,
        scope: this._options.scope,
        redirect_uri: this._options.redirect_uri
      });

      authorizationEndpointUrl.search = searchParams.toString();
      return { url: authorizationEndpointUrl.toString(), state };
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
      document.location.assign(authUrl.url);
    }
  }

  async renew(): Promise<Token | null> {
    // If we already have a token, just return it
    const token = this.token.getToken();
    if (this.isLoggedIn() && token) {
      return token;
    }
    const authUrl = await this.url({
      prompt: 'none',
      response_mode: 'web_message'
    });
    if (authUrl) {
      try {
        await lock.acquireLock(RENEW_LOCK_KEY, 5000);
        const response = await this._iframe.run(authUrl.url);
        await this.consume(response);
        return this.token.getToken();
      } catch (err) {
        throw err;
      } finally {
        await lock.releaseLock(RENEW_LOCK_KEY);
      }
    }
    return null;
  }
  async consume(
    {
      state: _state,
      code,
      error: _error,
      error_description: _error_description
    }: ConsumePayload = {
      state: null,
      code: null,
      error: null,
      error_description: null
    }
  ): Promise<void> {
    const params = new URLSearchParams(window.location.search);
    if (
      !_state &&
      !_error &&
      !Array.from((params as unknown) as Iterable<URLSearchParams>).length
    ) {
      throw new Error('There are no query params available for parsing.');
    }

    const state = _state || params.get('state');
    const error = _error || params.get('error');
    const error_description =
      _error_description || params.get('error_description');
    const transaction = this._transactioner.get(state);
    if (!transaction) {
      throw new CodeVerifierError();
    }

    this._transactioner.remove(state);

    if (error) {
      throw new AuthenticationError(error, error_description, state);
    }

    const requestParams = new URLSearchParams({
      code_verifier: transaction.code_verifier,
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
      throw new DataError();
    }
    this.token.setToken(response.data);
    this.setIsLoggedIn();
  }
  setIsLoggedIn() {
    storage.save(LOGGED_IN_KEY, '1');
  }
  removeIsLoggedIn() {
    storage.remove(LOGGED_IN_KEY);
  }
  isLoggedIn(): boolean {
    return !!storage.get(LOGGED_IN_KEY);
  }
}
export { Authenticate };
