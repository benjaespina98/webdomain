import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';

import { SplitComponent } from './split.component';
import { LanguageService } from '../services/language.service';
import { VoiceInputService } from '../services/voice-input.service';

describe('SplitComponent', () => {
  let component: SplitComponent;
  let fixture: ComponentFixture<SplitComponent>;
  let languageService: LanguageService;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      declarations: [SplitComponent],
      imports: [FormsModule, RouterTestingModule]
    });

    fixture = TestBed.createComponent(SplitComponent);
    component = fixture.componentInstance;
    languageService = TestBed.inject(LanguageService);
    languageService.set('es');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should build a WhatsApp summary with totals and suggested transfers', () => {
    component.people = ['Pepe', 'Juan', 'Ana'];
    component.expenseItems = [
      { id: 1, description: 'Cena', amount: 3000, paidBy: 'Pepe', participants: ['Pepe', 'Juan', 'Ana'] }
    ];

    const openSpy = spyOn(window, 'open');
    component.shareWhatsApp();

    expect(openSpy).toHaveBeenCalledTimes(1);
    const message = decodeURIComponent((openSpy.calls.mostRecent().args[0] as string).split('text=')[1]);

    expect(message).toContain('🧾 *dividimos?*');
    expect(message).toContain('👥 Pepe, Juan, Ana');
    expect(message).toContain('Total: $ 3.000,00');
    expect(message).toContain('Juan le paga *$ 1.000,00* a Pepe');
    expect(message).toContain('Hecho con dividimos? 🤙');
    expect(message).toContain('/share?data=');
  });

  it('should copy a share link to the clipboard', async () => {
    component.people = ['juan', 'benja'];
    component.expenseItems = [
      { id: 1, description: 'Helado', amount: 100, paidBy: 'juan', participants: ['juan', 'benja'] }
    ];

    const writeTextSpy = jasmine.createSpy('writeText').and.returnValue(Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: writeTextSpy }, configurable: true });

    await component.copyShareLink();

    expect(writeTextSpy).toHaveBeenCalledTimes(1);
    expect(writeTextSpy.calls.mostRecent().args[0] as string).toContain('/share?data=');
  });

  it('should calculate transfers when only some participants share an expense', () => {
    component.people = ['juan', 'benja', 'lucho', 'ari'];
    component.expenseItems = [
      { id: 1, description: 'Helado', amount: 100, paidBy: 'ari', participants: ['benja', 'lucho'] }
    ];


    expect(component.totalExpense).toBe(100);
    expect(component.averageSpent).toBe(25);
    expect(component.results.length).toBe(2);
    expect(component.results).toContain(jasmine.objectContaining({ debtor: 'benja', creditor: 'ari', amount: 50 }));
    expect(component.results).toContain(jasmine.objectContaining({ debtor: 'lucho', creditor: 'ari', amount: 50 }));
  });

  it('should distribute cents consistently when the amount is not evenly divisible', () => {
    component.people = ['Ana', 'Beto', 'Caro'];
    component.expenseItems = [
      { id: 1, description: 'Taxi', amount: 10, paidBy: 'Ana', participants: ['Ana', 'Beto', 'Caro'] }
    ];


    expect(component.totalExpense).toBe(10);
    expect(component.results.length).toBe(2);
    expect(component.results).toContain(jasmine.objectContaining({ debtor: 'Beto', creditor: 'Ana', amount: 3.33 }));
    expect(component.results).toContain(jasmine.objectContaining({ debtor: 'Caro', creditor: 'Ana', amount: 3.33 }));
  });

  it('should keep shared expenses alive when a participant (not the payer) is removed', fakeAsync(() => {
    component.people = ['Ana', 'Beto', 'Caro'];
    component.expenseItems = [
      { id: 1, description: 'Cena', amount: 90, paidBy: 'Ana', participants: ['Ana', 'Beto', 'Caro'] }
    ];

    component.removePerson('Caro');
    tick(200); // fade-out (removeAnimationMs): recién ahí se agenda el timer del aviso
    tick(6000); // timer del aviso con "deshacer" (6000ms)

    expect(component.expenseItems.length).toBe(1);
    expect(component.expenseItems[0].participants).toEqual(['Ana', 'Beto']);
    expect(component.results).toContain(jasmine.objectContaining({ debtor: 'Beto', creditor: 'Ana', amount: 45 }));
  }));

  it('should drop expenses paid by a removed person', fakeAsync(() => {
    component.people = ['Ana', 'Beto'];
    component.expenseItems = [
      { id: 1, description: 'Cena', amount: 90, paidBy: 'Ana', participants: ['Ana', 'Beto'] }
    ];

    component.removePerson('Ana');
    tick(200); // fade-out (removeAnimationMs): recién ahí se agenda el timer del aviso
    tick(6000); // timer del aviso con "deshacer" (6000ms)

    expect(component.expenseItems.length).toBe(0);
    expect(component.results.length).toBe(0);
  }));

  it('should restore the previous state when undoing a deletion', fakeAsync(() => {
    component.people = ['Ana', 'Beto'];
    component.expenseItems = [
      { id: 1, description: 'Cena', amount: 90, paidBy: 'Ana', participants: ['Ana', 'Beto'] }
    ];
    component.nextExpenseId = 2;

    component.removeExpenseItem(1);
    tick(200); // fade-out (removeAnimationMs): recién ahí se agenda el timer del aviso
    tick(6000); // timer del aviso con "deshacer" (6000ms)
    expect(component.expenseItems.length).toBe(0);

    component.undoLastAction();
    expect(component.expenseItems.length).toBe(1);
    expect(component.expenseItems[0].description).toBe('Cena');

    tick(3000); // drena el timer del aviso final ("Cambio deshecho") para que fakeAsync no se queje
  }));
});

describe('VoiceInputService.parseExpense', () => {
  let service: VoiceInputService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VoiceInputService);
  });

  it('should extract payer, amount and description from a Spanish phrase', () => {
    const parsed = service.parseExpense('Ana pagó 12500 de cena', ['Ana', 'Bruno'], 'es');

    expect(parsed.paidBy).toBe('Ana');
    expect(parsed.amount).toBe(12500);
    expect(parsed.description.toLowerCase()).toBe('cena');
  });

  it('should understand thousands spoken as "mil"', () => {
    const parsed = service.parseExpense('nafta 8 mil pagó Luca', ['Luca'], 'es');

    expect(parsed.amount).toBe(8000);
    expect(parsed.paidBy).toBe('Luca');
  });

  it('should read the participants that follow "entre"', () => {
    const parsed = service.parseExpense('pizza 4500 pagó Ana entre Bruno y Luca', ['Ana', 'Bruno', 'Luca'], 'es');

    expect(parsed.amount).toBe(4500);
    expect(parsed.participants).toEqual(['Ana', 'Bruno', 'Luca']);
  });

  it('should parse an English phrase', () => {
    const parsed = service.parseExpense('Ana paid 120.50 for dinner', ['Ana', 'Bruno'], 'en');

    expect(parsed.paidBy).toBe('Ana');
    expect(parsed.amount).toBe(120.5);
    expect(parsed.description.toLowerCase()).toBe('dinner');
  });

  it('should return nothing usable when there is no amount or description', () => {
    const parsed = service.parseExpense('Ana', ['Ana'], 'es');

    expect(parsed.amount).toBeNull();
    expect(parsed.description).toBe('');
  });
});
