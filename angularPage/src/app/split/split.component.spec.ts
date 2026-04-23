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
    expect(message).toContain('• Gasto 10: $1090.00 (Pagó: Juan)');
    expect(message).toContain('💰 Total: $10450.00');
    expect(message).toContain('🧮 Promedio por persona: $3483.33');
    expect(message).toContain('🔁 Transferencias:');
    expect(message).toContain('• Deudor 1 le debe a Acreedor 1: $100.00');
    expect(message).toContain('• Deudor 9 le debe a Acreedor 9: $108.00');
    expect(message).toContain('Hecho con --> https://dividimos.vercel.app/');
  });
});
