import { ConsumePayload } from './authentication';
import { Token } from './token';
export type IframeEvents = {
  onSuccess: (token: Token) => void;
  onError: (error: Error) => void;
};

const TIMEOUT_ERROR = { error: 'timeout', error_description: 'Timeout' };
const DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS = 60;
const CLEANUP_IFRAME_TIMEOUT_IN_SECONDS = 2;
const eventOrigin = getEventOrigin(process.env.AUTH_URL);
class Iframe {
  async run(url: string): Promise<ConsumePayload | null> {
    return new Promise((res, rej) => {
      const iframe = document.createElement('iframe');
      iframe.setAttribute('width', '0');
      iframe.setAttribute('height', '0');
      iframe.style.display = 'none';

      const timeoutSetTimeoutId = setTimeout(() => {
        rej(TIMEOUT_ERROR);
        window.document.body.removeChild(iframe);
      }, DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS * 1000);

      const iframeEventHandler = function(e: MessageEvent) {
        if (e.origin != eventOrigin) return;
        if (!e.data || e.data.type !== 'authorization_response') return;

        (<any>e.source).close();
        e.data.response.error ? rej(e.data.response) : res(e.data.response);
        clearTimeout(timeoutSetTimeoutId);
        window.removeEventListener('message', iframeEventHandler, false);

        // Delay the removal of the iframe to prevent hanging loading status
        // in Chrome: https://github.com/auth0/auth0-spa-js/issues/240
        setTimeout(
          () => window.document.body.removeChild(iframe),
          CLEANUP_IFRAME_TIMEOUT_IN_SECONDS * 1000
        );
      };

      window.addEventListener('message', iframeEventHandler, false);
      window.document.body.appendChild(iframe);
      iframe.setAttribute('src', url);
    });
  }
}
export default Iframe;

function getEventOrigin(url: string) {
  let parser = document.createElement('a');
  parser.href = url;
  return `${parser.protocol}//${parser.host}`;
}
