import { Component } from '@angular/core';

@Component({
  selector: 'app-split',
  templateUrl: './split.component.html',
  styleUrls: ['./split.component.scss']
})
export class SplitComponent {
  expenses: { name: string; expense: number }[] = [];
  totalExpense = 0;
  results: { debtor: string; creditor: string; amount: number }[] = [];
  name: string = '';
  expense: number | null = null;

  addExpense() {
    if (this.name && this.expense !== null && !isNaN(this.expense)) {
      const expenseValue = Number(this.expense); // Convierte a número si no lo es
      this.expenses.push({ name: this.name, expense: expenseValue });
      this.updateExpenseList();
      this.name = '';
      this.expense = null;
    }
  }

  updateExpenseList() {
    // Puedes implementar esta función si deseas mostrar la lista de gastos en la vista.
  }

  copyTable() {
    const textToCopy = this.results.map((result) => `- ${result.debtor} le debe pagar $${result.amount.toFixed(2)} a ${result.creditor}`).join('\n');

    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        alert('Tabla copiada al portapapeles.');
      })
      .catch((error) => {
        console.error('Error al copiar al portapapeles: ', error);
      });
  }

  calculateShares() {
    this.totalExpense = this.expenses.reduce((total, item) => total + item.expense, 0);
    const individualShare = this.totalExpense / this.expenses.length;

    const debts: { [key: string]: number } = {};
    const credits: { [key: string]: number } = {};

    this.expenses.forEach((payer) => {
      const share = individualShare - payer.expense;
      if (share > 0) {
        debts[payer.name] = share;
      } else {
        credits[payer.name] = -share;
      }
    });

    this.results = [];

    for (const debtor in debts) {
      for (const creditor in credits) {
        const amount = Math.min(debts[debtor], credits[creditor]);
        if (amount > 0) {
          this.results.push({ debtor, creditor, amount });
          debts[debtor] -= amount;
          credits[creditor] -= amount;
        }
      }
    }
  }
}
