import { Injectable } from '@angular/core';
import * as LZString from 'lz-string';

export interface ShareExpenseDto {
  d: string;
  a: number;
  b: number;
  r?: number[];
}

export interface SharePayload {
  p: string[];
  e: ShareExpenseDto[];
}

@Injectable({
  providedIn: 'root'
})
export class ShareService {
  private readonly schemaVersion = 4;

  encodeState(state: unknown): string {
    return LZString.compressToEncodedURIComponent(JSON.stringify(state));
  }

  decodeState<T>(encoded: string, version: number): T | null {
    if (version !== this.schemaVersion) {
      return null;
    }
    try {
      const json = LZString.decompressFromEncodedURIComponent(encoded);
      if (!json) {
        return null;
      }
      return JSON.parse(json) as T;
    } catch {
      return null;
    }
  }

  buildShareUrl(state: unknown): string {
    const encoded = this.encodeState(state);
    return `${window.location.origin}/share?data=${encoded}&v=${this.schemaVersion}`;
  }
}
