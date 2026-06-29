import { AfterViewInit, Component, ElementRef, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements AfterViewInit, OnDestroy {
  currentLanguage: 'es' | 'en' = 'es';
  private revealObserver: IntersectionObserver | null = null;

  constructor(private readonly elementRef: ElementRef<HTMLElement>) {
    // Detect language preference
    const saved = localStorage.getItem('split-language');
    if (saved === 'es' || saved === 'en') {
      this.currentLanguage = saved;
    } else {
      const browserLanguage = (navigator.languages?.[0] ?? navigator.language ?? 'es').toLowerCase();
      this.currentLanguage = browserLanguage.startsWith('es') ? 'es' : 'en';
    }
  }

  setLanguage(lang: 'es' | 'en'): void {
    this.currentLanguage = lang;
    localStorage.setItem('split-language', lang);
    document.documentElement.setAttribute('lang', lang);
  }

  ngAfterViewInit(): void {
    const revealElements = Array.from(this.elementRef.nativeElement.querySelectorAll('.reveal'));

    if (!('IntersectionObserver' in window) || revealElements.length === 0) {
      revealElements.forEach((element) => element.classList.add('is-visible'));
      return;
    }

    this.revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          this.revealObserver?.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    revealElements.forEach((element) => this.revealObserver?.observe(element));
  }

  ngOnDestroy(): void {
    this.revealObserver?.disconnect();
  }
}
