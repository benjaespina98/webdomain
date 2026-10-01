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
