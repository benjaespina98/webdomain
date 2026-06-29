import { Injectable } from '@angular/core';
import * as LZString from 'lz-string';

@Injectable({
  providedIn: 'root'
})
export class ShareService {
  private readonly schemaVersion = 1;

  encodeState(state: unknown): string {
    const payload = JSON.stringify({ schemaVersion: this.schemaVersion, state });
    return LZString.compressToEncodedURIComponent(payload);
  }

  decodeState<T>(encoded: string): T | null {
    try {
      const json = LZString.decompressFromEncodedURIComponent(encoded);
      if (!json) {
        return null;
      }

      const parsed = JSON.parse(json) as { schemaVersion: number; state: T };
      if (!parsed || parsed.schemaVersion !== this.schemaVersion) {
        return null;
      }

      return parsed.state;
    } catch {
      return null;
    }
  }

  buildShareUrl(state: unknown): string {
    const encoded = this.encodeState(state);
    return `${window.location.origin}/share?data=${encoded}`;
  }
}
