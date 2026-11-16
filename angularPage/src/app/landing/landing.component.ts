import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, inject } from '@angular/core';
import { LanguageService, LanguageCode } from '../services/language.service';
import { markLandingSeen } from './landing.guard';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-landing',
    templateUrl: './landing.component.html',
    styleUrls: ['./landing.component.scss'],
    imports: [RouterLink]
})
export class LandingComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly languageService = inject(LanguageService);

  readonly currentYear = new Date().getFullYear();
  private revealObserver: IntersectionObserver | null = null;
  private mutationObserver: MutationObserver | null = null;

  get currentLanguage(): LanguageCode {
    return this.languageService.current;
  }

  setLanguage(lang: LanguageCode): void {
    this.languageService.set(lang);
  }

  ngOnInit(): void {
    markLandingSeen();
  }

  ngAfterViewInit(): void {
    const host = this.elementRef.nativeElement;

    if ('IntersectionObserver' in window) {
      this.revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            this.revealObserver?.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    }

    this.observeReveals(host);

    // Los bloques con @if (por ejemplo, los textos por idioma) se vuelven a crear al cambiar de idioma:
    // hay que observar los nodos nuevos o quedan con opacity 0.
    if ('MutationObserver' in window) {
      this.mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            this.observeReveals(node);
          }
        }));
      });
      this.mutationObserver.observe(host, { childList: true, subtree: true });
    }
  }

  private observeReveals(root: HTMLElement): void {
    const elements = [
      ...(root.classList.contains('reveal') ? [root] : []),
      ...Array.from(root.querySelectorAll<HTMLElement>('.reveal')),
    ].filter((element) => !element.classList.contains('is-visible'));

    elements.forEach((element) => {
      if (this.revealObserver) {
        this.revealObserver.observe(element);
      } else {
        element.classList.add('is-visible');
      }
    });
  }

  ngOnDestroy(): void {
    this.revealObserver?.disconnect();
    this.mutationObserver?.disconnect();
  }
}
