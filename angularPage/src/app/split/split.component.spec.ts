import { ComponentFixture, TestBed, fakeAsync, flush, tick } from '@angular/core/testing';
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
    imports: [FormsModule, RouterTestingModule, SplitComponent]
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

    const openSpy = spyOn(window, 'open').and.returnValue({ opener: null } as unknown as Window);
    component.shareWhatsApp();

    expect(openSpy).toHaveBeenCalledTimes(1);
    const message = decodeURIComponent((openSpy.calls.mostRecent().args[0] as string).split('text=')[1]);

    expect(message).toContain('🧾 *dividimos?*');
    expect(message).toContain('Cena · 3 personas');
    expect(message).toContain('Total *$ 3.000*');
    expect(message).toContain('Juan → Pepe: *$ 1.000*');
    expect(message).toContain('Detalle completo 👇');
    expect(message).toContain('/share#data=');
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
    expect(writeTextSpy.calls.mostRecent().args[0] as string).toContain('/share#data=');
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

  it('pide confirmación antes de borrar todo y permite deshacer', () => {
    component.people = ['Ana', 'Beto'];
    component.expenseItems = [
      { id: 1, description: 'Cena', amount: 100, paidBy: 'Ana', participants: ['Ana', 'Beto'] }
    ];

    component.clearAll();
    expect(component.pendingConfirm).not.toBeNull();
    expect(component.people.length).toBe(2);

    component.acceptConfirm();
    expect(component.people).toEqual([]);
    expect(component.expenseItems).toEqual([]);

    component.undoLastAction();
    expect(component.people).toEqual(['Ana', 'Beto']);
    expect(component.expenseItems.length).toBe(1);
  });

  describe('editar persona, alias y montos personalizados', () => {
    beforeEach(() => {
      component.people = ['Ana', 'Beto', 'Caro'];
      component.expenseItems = [
        { id: 1, description: 'Cena', amount: 90, paidBy: 'Ana', participants: ['Ana', 'Beto', 'Caro'] },
        { id: 2, description: 'Vino', amount: 100, paidBy: 'Beto', participants: ['Beto', 'Caro'], shares: { Beto: 40, Caro: 60 } }
      ];
    });

    it('renombra a la persona en gastos, pagador y montos, y se puede deshacer', () => {
      component.startPersonEdit('Beto');
      component.personDraftName = 'Beto G';
      component.savePersonEdit();

      expect(component.people).toEqual(['Ana', 'Beto G', 'Caro']);
      expect(component.expenseItems[1].paidBy).toBe('Beto G');
      expect(component.expenseItems[1].participants).toEqual(['Beto G', 'Caro']);
      expect(component.expenseItems[1].shares).toEqual({ 'Beto G': 40, Caro: 60 });

      component.undoLastAction();
      expect(component.people).toEqual(['Ana', 'Beto', 'Caro']);
      expect(component.expenseItems[1].shares).toEqual({ Beto: 40, Caro: 60 });
    });

    it('no permite renombrar a un nombre que ya existe', () => {
      component.startPersonEdit('Beto');
      component.personDraftName = 'caro';
      component.savePersonEdit();

      expect(component.people).toEqual(['Ana', 'Beto', 'Caro']);
      expect(component.editingPerson).toBe('Beto');
    });

    it('guarda el alias, lo acompaña al renombrar y lo borra al quitar a la persona', fakeAsync(() => {
      component.startPersonEdit('Ana');
      component.personDraftAlias = 'ana.mp';
      component.savePersonEdit();
      expect(component.aliasOf('Ana')).toBe('ana.mp');

      component.startPersonEdit('Ana');
      component.personDraftName = 'Anita';
      component.savePersonEdit();
      expect(component.aliasOf('Anita')).toBe('ana.mp');
      expect(component.aliasOf('Ana')).toBe('');

      component.removePerson('Anita');
      flush();
      expect(component.aliasOf('Anita')).toBe('');
    }));

    it('el mensaje de WhatsApp incluye el alias de quien cobra', () => {
      component.aliases = { Ana: 'ana.mp' };
      const openSpy = spyOn(window, 'open').and.returnValue({ opener: null } as unknown as Window);

      component.shareWhatsApp();

      const message = decodeURIComponent((openSpy.calls.mostRecent().args[0] as string).split('text=')[1]);
      expect(message).toContain('💳 *Ana*: ana.mp');
    });

    it('valida que los montos personalizados sumen el total', () => {
      component.newExpenseAmount = 100;
      component.setSplitMode('amounts');
      component.setShare('Ana', 30);
      component.setShare('Beto', 50);

      expect(component.sharesAreValid()).toBeFalse();
      expect(component.sharesStatus().text).toContain('Faltan');

      component.setShare('Caro', 20);
      expect(component.sharesAreValid()).toBeTrue();
      expect(component.sharesStatus().ok).toBeTrue();

      component.setShare('Caro', 30);
      expect(component.sharesStatus().text).toContain('Te pasaste');
    });

    it('repartir parejo cierra al centavo y se puede guardar el gasto con montos', () => {
      component.newExpenseDescription = 'Taxi';
      component.newExpenseAmount = 100;
      component.newExpensePaidBy = 'Ana';
      component.setSplitMode('amounts');
      component.fillSharesEqually();

      expect(component.sharesAreValid()).toBeTrue();
      component.addExpenseItem();

      const saved = component.expenseItems[component.expenseItems.length - 1];
      expect(saved.shares).toEqual({ Ana: 33.34, Beto: 33.33, Caro: 33.33 });
    });

    it('al quitar a alguien de un gasto con montos, ese gasto se reparte en partes iguales entre quienes quedan', fakeAsync(() => {
      component.removePerson('Caro');
      flush();

      const wine = component.expenseItems.find((item) => item.id === 2)!;
      expect(wine.participants).toEqual(['Beto']);
      expect(wine.shares).toBeUndefined();
    }));
  });
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
