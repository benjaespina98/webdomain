import { Injectable } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';

export interface SeoData {
  title: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  constructor(
    private readonly titleService: Title,
    private readonly meta: Meta
  ) {}

  update(data: SeoData, path: string): void {
    this.titleService.setTitle(data.title);
    this.meta.updateTag({ name: 'description', content: data.description });
    this.meta.updateTag({ property: 'og:title', content: data.title });
    this.meta.updateTag({ property: 'og:description', content: data.description });
    this.meta.updateTag({ name: 'twitter:title', content: data.title });
    this.meta.updateTag({ name: 'twitter:description', content: data.description });

    const canonicalUrl = `https://dividimos.vercel.app${path}`;
    this.meta.updateTag({ property: 'og:url', content: canonicalUrl });

    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);
  }
}
