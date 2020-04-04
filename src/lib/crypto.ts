class Crypto {
  static randomString(length: number) {
    const _validChars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let array = new Uint8Array(length);
    if (!window.crypto) {
      throw new Error('Crypto functionality not supported');
    }
    window.crypto.getRandomValues(array);
    array = array.map(x => _validChars.charCodeAt(x % _validChars.length));
    return String.fromCharCode(...array);
  }

  static urlEncodeB64(input: string) {
    const b64Chars: { [x: string]: string } = { '+': '-', '/': '_', '=': '' };
    return input.replace(/[+/=]/g, (m: string) => b64Chars[m]);
  }

  static bufferToBase64UrlEncoded(input: ArrayBuffer) {
    var bytes = new Uint8Array(input);
    return Crypto.urlEncodeB64(window.btoa(String.fromCharCode(...bytes)));
  }

  static async sha256(message: string) {
    let encoder = new TextEncoder();
    let data = encoder.encode(message);
    if (!window.crypto || !window.crypto.subtle) {
      throw new Error('SubtleCrypto functionality not supported');
    }

    const hash = await window.crypto.subtle.digest('SHA-256', data);
    return Crypto.bufferToBase64UrlEncoded(hash);
  }
}

export default Crypto;
