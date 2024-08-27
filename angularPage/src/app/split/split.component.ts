import { Component } from '@angular/core';

@Component({
  selector: 'app-split',
  templateUrl: './split.component.html',
  styleUrls: ['./split.component.scss']
})
export class SplitComponent {
  rtdo_i: string = `División de Gastos\n*****************************************************\n`;
  rtdo_f: string = `\n\nBenjapp®`;
  expenses: { name: string; expense: number }[] = [];
  totalExpense = 0;
  averageSpent = 0;  // Variable para el promedio
  results: { debtor: string; creditor: string; amount: number }[] = [];
  name: string = '';
  expense: number | null = null;

  addExpense() {
    if (!this.name) {
      alert('Por favor, completar el campo nombre...');
      return;
    }
    if (this.expense === null || isNaN(this.expense)) {
      alert('Por favor, completar el campo gasto...');
      return;
    }

    const expenseValue = Number(this.expense);

    const existingExpenseIndex = this.expenses.findIndex((item) => item.name === this.name);

    if (existingExpenseIndex !== -1) {
      // Si la persona ya ha ingresado un gasto, sumar el nuevo gasto al gasto existente
      this.expenses[existingExpenseIndex].expense += expenseValue;
    } else {
      // Si no, agregar un nuevo gasto
      this.expenses.push({ name: this.name, expense: expenseValue });
    }

    this.updateExpenseList();
    this.name = '';
    this.expense = null;
  }

  updateExpenseList() {
  }

  copyTable() {
    const resultsText = this.results
        .map((result) => `» ${result.debtor} le debe pagar $${result.amount.toFixed(2)} a ${result.creditor}`)
        .join('\n');

    // Crea una cadena que incluye los cálculos de Gasto Total y Promedio
    const calculationsText = `----------------------------------
                              \nGasto Total: $${this.totalExpense.toFixed(2)}\nPromedio por Sujeto: $${this.averageSpent.toFixed(2)}`+ this.rtdo_f;

    const textToCopy = this.rtdo_i + `${resultsText}\n\n${calculationsText}`  ;

    navigator.clipboard.writeText(textToCopy)
        .then(() => {
            alert('Datos copiados :)');
        })
        .catch((error) => {
            console.error('Error al copiar al portapapeles: ', error);
        }); 
  }

  calculateShares() {
    this.totalExpense = this.expenses.reduce((total, item) => total + item.expense, 0);
    const individualShare = this.totalExpense / this.expenses.length;
    this.averageSpent = individualShare;  // Calcular el promedio

    const debts: { [key: string]: number } = {};
    const credits: { [key: string]: number } = {};

    this.expenses.forEach((payer) => {
      const share = individualShare - payer.expense;
      if (share > 0) {
        debts[payer.name] = (debts[payer.name] || 0) + share;
      } else if (share < 0) {
        credits[payer.name] = (credits[payer.name] || 0) - share;
      }
    });

    this.results = [];

    for (const debtor in debts) {
      for (const creditor in credits) {
        if (debtor !== creditor) {
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

  deleteExpense(expenseItem: { name: string; expense: number }) {
    const index = this.expenses.indexOf(expenseItem);
    if (index !== -1) {
      this.expenses.splice(index, 1);
    }
  }

  clearExpenses() {
    this.expenses = [];
    this.results = [];
    this.totalExpense = 0;
    this.averageSpent = 0;  // Reiniciar el promedio
  }
}
