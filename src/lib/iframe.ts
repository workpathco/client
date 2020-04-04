import { AuthorizationUrl } from './authentication';
import { Token } from './token';
export type IframeEvents = {
  onSuccess: (token: Token) => void;
  onError: (error: Error) => void;
};
class Iframe {
  static async run(url: AuthorizationUrl): Promise<Token | null> {
    return new Promise((res, rej) => {
      const iframe = document.createElement('iframe');
      window.addEventListener(
        'message',
        event => {
          if (event.data.access_token) {
            iframe.remove();
            res(event.data);
          } else if (event.data.error) {
            rej(event.data.error);
          }
          rej(new Error('Issue requesting code;'));
        },
        false
      );
      iframe.setAttribute('width', '0');
      iframe.setAttribute('height', '0');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      iframe.setAttribute('src', url);
    });
  }
}

export default Iframe;
