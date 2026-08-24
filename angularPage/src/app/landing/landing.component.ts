import { AfterViewInit, Component, ElementRef, OnDestroy } from '@angular/core';
import { LanguageService, LanguageCode } from '../services/language.service';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements AfterViewInit, OnDestroy {
  readonly currentYear = new Date().getFullYear();
  private revealObserver: IntersectionObserver | null = null;

  constructor(
    private readonly elementRef: ElementRef<HTMLElement>,
    private readonly languageService: LanguageService
  ) {}

  get currentLanguage(): LanguageCode {
    return this.languageService.current;
  }

  setLanguage(lang: LanguageCode): void {
    this.languageService.set(lang);
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
