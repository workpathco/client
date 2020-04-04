declare module 'sha.js' {
  export default function shaJs(algorithm: string): Hash;

  type Utf8AsciiLatin1Encoding = 'utf8' | 'ascii' | 'latin1';
  type HexBase64Latin1Encoding = 'latin1' | 'hex' | 'base64';

  export interface Hash extends NodeJS.ReadWriteStream {
    // tslint:disable:no-method-signature
    update(
      data: string | Buffer | DataView,
      inputEncoding?: Utf8AsciiLatin1Encoding
    ): Hash;
    digest(): Buffer;
    digest(encoding: HexBase64Latin1Encoding): string;
    // tslint:enable:no-method-signature
  }
}
