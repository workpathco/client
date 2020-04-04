import {
  AuthorizationUrl,
  ConsumePayload,
  AuthenticationOptions
} from './authentication';
import { Token } from './token';
export type IframeEvents = {
  onSuccess: (token: Token) => void;
  onError: (error: Error) => void;
};
class Iframe {
  private _options: AuthenticationOptions;
  constructor(options: AuthenticationOptions) {
    this._options = options;
  }
  async run(url: AuthorizationUrl): Promise<ConsumePayload | null> {
    return new Promise((res, rej) => {
      const iframe = document.createElement('iframe');
      iframe.setAttribute('width', '0');
      iframe.setAttribute('height', '0');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      iframe.setAttribute('src', url);
      window.addEventListener(
        'message',
        event => {
          const parsedOrigin = parseURL(process.env.AUTH_URL);
          if (
            event.data.response_mode === 'web_message' &&
            event.origin === `${parsedOrigin.protocol}//${parsedOrigin.host}`
          ) {
            if (!event.data.error) {
              iframe.remove();
              return res(event.data);
            }
            return rej(event.data.error);
          }
        },
        false
      );
    });
  }
}

export default Iframe;

function parseURL(url: string) {
  let parser = document.createElement('a');
  // Let the browser do the work
  parser.href = url;
  // Convert query string to object
  return {
    protocol: parser.protocol,
    host: parser.host,
    hostname: parser.hostname,
    port: parser.port,
    pathname: parser.pathname,
    search: parser.search
  };
}
