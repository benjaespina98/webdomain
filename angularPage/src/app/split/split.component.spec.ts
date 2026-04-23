import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { SplitComponent } from './split.component';

describe('SplitComponent', () => {
  let component: SplitComponent;
  let fixture: ComponentFixture<SplitComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SplitComponent],
      imports: [FormsModule]
    });
    fixture = TestBed.createComponent(SplitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should generate a WhatsApp summary with totals, average, and suggested transfers', () => {
    component.currentLanguage = 'es';
    component.people = ['Pepe', 'Juan', 'Ana'];
    component.expenseItems = Array.from({ length: 10 }, (_, index) => ({
      id: index + 1,
      description: `Gasto ${index + 1}`,
      amount: 1000 + index * 10,
      paidBy: index % 2 === 0 ? 'Pepe' : 'Juan',
      participants: ['Pepe', 'Juan', 'Ana']
    }));
    component.totalExpense = component.expenseItems.reduce((sum, item) => sum + item.amount, 0);
    component.averageSpent = component.totalExpense / component.people.length;
    component.results = Array.from({ length: 9 }, (_, index) => ({
      debtor: `Deudor ${index + 1}`,
      creditor: `Acreedor ${index + 1}`,
      amount: 100 + index
    }));

    const openSpy = spyOn(window, 'open').and.stub();

    component.shareWhatsApp();

    expect(openSpy).toHaveBeenCalledTimes(1);
    const openedUrl = openSpy.calls.mostRecent().args[0] as string;
    const message = decodeURIComponent(openedUrl.split('text=')[1]);

    expect(message).toContain('dividimos? 💸');
    expect(message).toContain('👥 3 Personas');
    expect(message).toContain('🧾 Gastos:');
    expect(message).toContain('• Gasto 10: $1090.00 (Pagó: Juan | Participan: Pepe, Juan, Ana)');
    expect(message).toContain('💰 Total: $10450.00');
    expect(message).toContain('🧮 Promedio por persona: $3483.33');
    expect(message).toContain('🔁 Transferencias:');
    expect(message).toContain('• Deudor 1 le debe a Acreedor 1: $100.00');
    expect(message).toContain('• Deudor 9 le debe a Acreedor 9: $108.00');
    expect(message).toContain('Hecho con --> https://dividimos.vercel.app/');
  });

  it('should copy summary with participants included in each expense line', async () => {
    component.currentLanguage = 'es';
    component.people = ['juan', 'benja', 'lucho', 'ari'];
    component.expenseItems = [
      {
        id: 1,
        description: 'Helado',
        amount: 100,
        paidBy: 'ari',
        participants: ['benja', 'lucho']
      }
    ];
    component.calculateAdvancedShares();

    const writeTextSpy = jasmine.createSpy('writeText').and.returnValue(Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextSpy },
      configurable: true
    });

    await component.copySummary();

    expect(writeTextSpy).toHaveBeenCalledTimes(1);
    const copiedMessage = writeTextSpy.calls.mostRecent().args[0] as string;
    expect(copiedMessage).toContain('• Helado: $100.00 (Pagó: ari | Participan: benja, lucho)');
  });

  it('should calculate transfers correctly when only some participants share an expense', () => {
    component.people = ['juan', 'benja', 'lucho', 'ari'];
    component.expenseItems = [
      {
        id: 1,
        description: 'Helado',
        amount: 100,
        paidBy: 'ari',
        participants: ['benja', 'lucho']
      }
    ];

    component.calculateAdvancedShares();

    expect(component.totalExpense).toBe(100);
    expect(component.averageSpent).toBe(25);
    expect(component.results.length).toBe(2);
    expect(component.results).toContain(jasmine.objectContaining({ debtor: 'benja', creditor: 'ari', amount: 50 }));
    expect(component.results).toContain(jasmine.objectContaining({ debtor: 'lucho', creditor: 'ari', amount: 50 }));
  });

  it('should distribute cents consistently when amount is not divisible equally', () => {
    component.people = ['Ana', 'Beto', 'Caro'];
    component.expenseItems = [
      {
        id: 1,
        description: 'Taxi',
        amount: 10,
        paidBy: 'Ana',
        participants: ['Ana', 'Beto', 'Caro']
      }
    ];

    component.calculateAdvancedShares();

    expect(component.totalExpense).toBe(10);
    expect(component.results.length).toBe(2);
    expect(component.results).toContain(jasmine.objectContaining({ debtor: 'Beto', creditor: 'Ana', amount: 3.33 }));
    expect(component.results).toContain(jasmine.objectContaining({ debtor: 'Caro', creditor: 'Ana', amount: 3.33 }));
  });
});
