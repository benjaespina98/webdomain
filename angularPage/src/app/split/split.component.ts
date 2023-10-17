import { Component } from '@angular/core';

@Component({
  selector: 'app-split',
  templateUrl: './split.component.html',
  styleUrls: ['./split.component.scss']
})
export class SplitComponent {
  expenses: { name: string; expense: number, category: string }[] = [];
  totalExpense = 0;
  results: { debtor: string; creditor: string; amount: number }[] = [];
  name: string = '';
  expense: number | null = null;
  category: string = ''; // Variable para la categoría
  categories: string[] = []; // Lista de categorías
  selectedCategory: string = ''; // Variable para la última categoría seleccionada
  showCategoryInput = false;

  addExpense() {
    if (!this.name) {
      alert('Por favor, completar el campo nombre...');
      return;
    }
    if (this.expense === null || isNaN(this.expense)) {
      alert('Por favor, completar el campo gasto...');
      return;
    }

    if (!this.selectedCategory) {
      alert('Por favor, selecciona una categoría...');
      return;
    }

    // Verificar si la categoría ya existe en la lista de categorías
    if (!this.categories.includes(this.selectedCategory)) {
      // Si la categoría no existe, toma el valor de la categoría personalizada
      this.category = this.selectedCategory;
    } else {
      // Si la categoría existe, usa el valor seleccionado del combo
      this.category = this.selectedCategory;
    }

    const expenseValue = Number(this.expense);

    // Verificar si la categoría ya existe en la lista de categorías
    if (!this.categories.includes(this.category)) {
      this.categories.push(this.category);
    }

    const existingExpense = this.expenses.find((item) => item.name === this.name && item.category === this.category);

    if (existingExpense) {
      // Si la persona ya ha ingresado un gasto, sumar el nuevo gasto al gasto existente
      existingExpense.expense += expenseValue;
    } else {
      // Si no, agregar un nuevo gasto
      this.expenses.push({ name: this.name, expense: expenseValue, category: this.category });
    }

    this.updateExpenseList();
    this.name = '';
    this.expense = null;
    this.selectedCategory = ''; // Restablece la categoría seleccionada
  }

  updateExpenseList() {
  }

  copyTable() {
    const textToCopy = this.results.map((result) => `- ${result.debtor} le debe pagar $${result.amount.toFixed(2)} a ${result.creditor}`).join('\n');

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

  deleteExpense(expenseItem: { name: string, expense: number, category: string }) {
    const index = this.expenses.indexOf(expenseItem);
    if (index !== -1) {
      this.expenses.splice(index, 1);
    }
  }
  clearExpenses() {
    this.expenses = [];
    this.results = [];
    this.category = '';
    this.categories = [];
  }


  toggleCategoryInput() {
    this.showCategoryInput = !this.showCategoryInput;
    if (!this.showCategoryInput) {
      this.category = '';
    }
  }

}
