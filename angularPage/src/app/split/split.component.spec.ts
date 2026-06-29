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

  it('should generate a WhatsApp summary with totals and suggested transfers', () => {
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

    const clickSpy = spyOn(HTMLAnchorElement.prototype, 'click');

    component.shareWhatsApp();

    expect(clickSpy).toHaveBeenCalledTimes(1);
    const openedUrl = (clickSpy.calls.mostRecent().object as HTMLAnchorElement).href;
    const message = decodeURIComponent(openedUrl.split('text=')[1]);

    expect(message).toContain('🧾 dividimos?');
    expect(message).toContain('Resumen de gastos');
    expect(message).toContain('Total: $10450.00 entre 3 personas');
    expect(message).toContain('Acreedor 1 → recibe $100.00 de Deudor 1');
    expect(message).toContain('Acreedor 9 → recibe $108.00 de Deudor 9');
    expect(message).toContain('Calculado con dividimos?');
    expect(message).toContain('/share?data=');
  });

  it('should copy a short share link to the clipboard', async () => {
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

    await component.copyShareLink();

    expect(writeTextSpy).toHaveBeenCalledTimes(1);
    const copiedLink = writeTextSpy.calls.mostRecent().args[0] as string;
    expect(copiedLink).toContain('/share?data=');
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
