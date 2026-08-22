export interface Utf8StreamDecoder {
  decode(
    input?: ArrayBuffer | ArrayBufferView,
    options?: { stream?: boolean },
  ): string;
}

function bytesFrom(input?: ArrayBuffer | ArrayBufferView) {
  if (!input) return new Uint8Array(0);
  if (input instanceof ArrayBuffer) return new Uint8Array(input);
  return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
}

class CompatibleUtf8Decoder implements Utf8StreamDecoder {
  private pending = new Uint8Array(0);

  decode(
    input?: ArrayBuffer | ArrayBufferView,
    options: { stream?: boolean } = {},
  ) {
    const incoming = bytesFrom(input);
    const bytes = new Uint8Array(this.pending.length + incoming.length);
    bytes.set(this.pending);
    bytes.set(incoming, this.pending.length);
    this.pending = new Uint8Array(0);

    let result = "";
    let index = 0;
    while (index < bytes.length) {
      const first = bytes[index];
      if (first <= 0x7f) {
        result += String.fromCharCode(first);
        index += 1;
        continue;
      }

      let length = 0;
      let codePoint = 0;
      let minimum = 0;
      if (first >= 0xc2 && first <= 0xdf) {
        length = 2;
        codePoint = first & 0x1f;
        minimum = 0x80;
      } else if (first >= 0xe0 && first <= 0xef) {
        length = 3;
        codePoint = first & 0x0f;
        minimum = 0x800;
      } else if (first >= 0xf0 && first <= 0xf4) {
        length = 4;
        codePoint = first & 0x07;
        minimum = 0x10000;
      } else {
        result += "\ufffd";
        index += 1;
        continue;
      }

      if (index + length > bytes.length) {
        if (options.stream) this.pending = bytes.slice(index);
        else result += "\ufffd";
        break;
      }

      let valid = true;
      for (let offset = 1; offset < length; offset += 1) {
        const continuation = bytes[index + offset];
        if ((continuation & 0xc0) !== 0x80) {
          valid = false;
          break;
        }
        codePoint = (codePoint << 6) | (continuation & 0x3f);
      }
      if (
        !valid ||
        codePoint < minimum ||
        codePoint > 0x10ffff ||
        (codePoint >= 0xd800 && codePoint <= 0xdfff)
      ) {
        result += "\ufffd";
        index += 1;
        continue;
      }

      if (codePoint <= 0xffff) {
        result += String.fromCharCode(codePoint);
      } else {
        const adjusted = codePoint - 0x10000;
        result += String.fromCharCode(
          0xd800 + (adjusted >> 10),
          0xdc00 + (adjusted & 0x3ff),
        );
      }
      index += length;
    }
    return result;
  }
}

export function createUtf8StreamDecoder(): Utf8StreamDecoder {
  if (typeof TextDecoder !== "undefined") return new TextDecoder("utf-8");
  return new CompatibleUtf8Decoder();
}
