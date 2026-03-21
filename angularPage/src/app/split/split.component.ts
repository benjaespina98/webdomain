import { Component } from '@angular/core';

interface ExpenseItem {
  id: number;
  description: string;
  amount: number;
  paidBy: string;
  participants: string[];
}

interface SimpleExpense {
  name: string;
  expense: number;
}

interface SettlementResult {
  debtor: string;
  creditor: string;
  amount: number;
}

type BalanceMap = Record<string, number>;

@Component({
  selector: 'app-split',
  templateUrl: './split.component.html',
  styleUrls: ['./split.component.scss']
})
export class SplitComponent {
  private readonly copyHeader = `División de Gastos\n*****************************************************\n`;
  private readonly copyFooter = `\n\nBenjapp®`;

  expenses: SimpleExpense[] = [];
  totalExpense = 0;
  averageSpent = 0;
  results: SettlementResult[] = [];
  name: string = '';
  expense: number | null = null;

  // Propiedades para modo avanzado (nuevo)
  useAdvancedMode = false;
  people: string[] = [];
  expenseItems: ExpenseItem[] = [];
  newPersonName: string = '';
  newExpenseDescription: string = '';
  newExpenseAmount: number | null = null;
  newExpensePaidBy: string = '';
  selectedParticipants: string[] = [];
  nextExpenseId = 1;

  addExpense() {
    const cleanName = this.name.trim();

    if (!cleanName) {
      alert('Por favor, completar el campo nombre...');
      return;
    }

    if (this.expense === null || isNaN(this.expense)) {
      alert('Por favor, completar el campo gasto...');
      return;
    }

    const expenseValue = Number(this.expense);

    const existingExpenseIndex = this.expenses.findIndex((item) => item.name === cleanName);

    if (existingExpenseIndex !== -1) {
      this.expenses[existingExpenseIndex].expense += expenseValue;
    } else {
      this.expenses.push({ name: cleanName, expense: expenseValue });
    }

    this.name = '';
    this.expense = null;
  }

  // Métodos para modo avanzado
  switchMode() {
    // Solo limpiar datos al cambiar modo, no cambiar useAdvancedMode porque ngModel ya lo hace
    this.clearAll();
  }

  addPerson() {
    if (!this.newPersonName.trim()) {
      alert('Por favor, ingresa un nombre válido');
      return;
    }
    
    if (this.people.includes(this.newPersonName.trim())) {
      alert('Esta persona ya está en la lista');
      return;
    }

    this.people.push(this.newPersonName.trim());
    this.newPersonName = '';
  }

  removePerson(person: string) {
    this.people = this.people.filter(p => p !== person);
    // Limpiar gastos de esta persona
    this.expenseItems = this.expenseItems.filter(item => 
      item.paidBy !== person && !item.participants.includes(person)
    );
    this.calculateAdvancedShares();
  }

  toggleParticipant(person: string) {
    const index = this.selectedParticipants.indexOf(person);
    if (index > -1) {
      this.selectedParticipants.splice(index, 1);
    } else {
      this.selectedParticipants.push(person);
    }
  }

  isParticipantSelected(person: string): boolean {
    return this.selectedParticipants.includes(person);
  }

  selectAllParticipants() {
    this.selectedParticipants = [...this.people];
  }

  deselectAllParticipants() {
    this.selectedParticipants = [];
  }

  areAllSelected(): boolean {
    return this.people.length > 0 && this.selectedParticipants.length === this.people.length;
  }

  shareAdvancedWhatsApp() {
    if (this.expenseItems.length === 0) {
      alert('No hay gastos para compartir');
      return;
    }

    let message = `*Split de gastos*\n`;
    message += `Total: $${this.totalExpense.toFixed(2)} | Promedio: $${this.averageSpent.toFixed(2)}\n`;

    if (this.results.length > 0) {
      message += `\n*Transferencias:*\n`;
      this.results.forEach(result => {
        message += `- ${result.debtor} -> ${result.creditor}: $${result.amount.toFixed(2)}\n`;
      });
    } else {
      message += `\nTodo balanceado. No hay transferencias pendientes.`;
    }

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  }

  addExpenseItem() {
    if (!this.newExpenseDescription.trim()) {
      alert('Por favor, ingresa una descripción del gasto');
      return;
    }
    
    if (this.newExpenseAmount === null || this.newExpenseAmount <= 0) {
      alert('Por favor, ingresa un monto válido');
      return;
    }

    if (!this.newExpensePaidBy) {
      alert('Por favor, selecciona quién pagó');
      return;
    }

    if (this.selectedParticipants.length === 0) {
      alert('Por favor, selecciona al menos un participante');
      return;
    }

    const newExpense: ExpenseItem = {
      id: this.nextExpenseId++,
      description: this.newExpenseDescription.trim(),
      amount: this.newExpenseAmount,
      paidBy: this.newExpensePaidBy,
      participants: [...this.selectedParticipants]
    };

    this.expenseItems.push(newExpense);
    
    // Limpiar formulario
    this.newExpenseDescription = '';
    this.newExpenseAmount = null;
    this.newExpensePaidBy = '';
    this.selectedParticipants = [];

    this.calculateAdvancedShares();
  }

  removeExpenseItem(expenseId: number) {
    this.expenseItems = this.expenseItems.filter(item => item.id !== expenseId);
    this.calculateAdvancedShares();
  }

  calculateAdvancedShares() {
    if (this.people.length === 0 || this.expenseItems.length === 0) {
      this.results = [];
      this.totalExpense = 0;
      this.averageSpent = 0;
      return;
    }

    const balances: BalanceMap = {};
    this.people.forEach(person => {
      balances[person] = 0;
    });

    this.totalExpense = 0;

    this.expenseItems.forEach(expense => {
      this.totalExpense += expense.amount;
      const sharePerPerson = expense.amount / expense.participants.length;
      
      balances[expense.paidBy] += expense.amount;

      expense.participants.forEach(participant => {
        balances[participant] -= sharePerPerson;
      });
    });

    const debts: BalanceMap = {};
    const credits: BalanceMap = {};

    Object.entries(balances).forEach(([person, balance]) => {
      if (balance < 0) {
        debts[person] = Math.abs(balance);
      } else if (balance > 0) {
        credits[person] = balance;
      }
    });

    this.results = this.buildTransfers(debts, credits, 0.01);

    this.averageSpent = this.totalExpense / this.people.length;
  }

  clearAll() {
    // Limpiar modo simple
    this.expenses = [];
    this.name = '';
    this.expense = null;
    
    // Limpiar modo avanzado
    this.people = [];
    this.expenseItems = [];
    this.newPersonName = '';
    this.newExpenseDescription = '';
    this.newExpenseAmount = null;
    this.newExpensePaidBy = '';
    this.selectedParticipants = [];
    this.nextExpenseId = 1;
    
    this.resetResults();
  }

  copyTable() {
    let resultsText: string;
    let calculationsText: string;

    if (this.useAdvancedMode) {
      // Formato para modo avanzado
      resultsText = this.results
        .map((result) => `- ${result.debtor} le debe pagar $${result.amount.toFixed(2)} a ${result.creditor}`)
        .join('\n');

      const expenseDetailsText = this.expenseItems
        .map(item => `${item.description}: $${item.amount.toFixed(2)} (pagado por ${item.paidBy}, participantes: ${item.participants.join(', ')})`)
        .join('\n');

      calculationsText = `Gasto Total: $${this.totalExpense.toFixed(2)}\nPromedio por Participante: $${this.averageSpent.toFixed(2)}\n\nDetalle de gastos:\n${expenseDetailsText}`;
    } else {
      // Formato para modo simple
      resultsText = this.results
        .map((result) => `» ${result.debtor} le debe pagar $${result.amount.toFixed(2)} a ${result.creditor}`)
        .join('\n');

      calculationsText = `----------------------------------
                              \nGasto Total: $${this.totalExpense.toFixed(2)}\nPromedio por Sujeto: $${this.averageSpent.toFixed(2)}` + this.copyFooter;
    }

    const textToCopy = this.copyHeader + `${resultsText}\n\n${calculationsText}`;

    navigator.clipboard.writeText(textToCopy)
        .then(() => {
            alert('Datos copiados :)');
        })
        .catch((error) => {
            console.error('Error al copiar al portapapeles: ', error);
        }); 
  }

  calculateShares() {
    if (this.expenses.length === 0) {
      this.resetResults();
      return;
    }

    this.totalExpense = this.expenses.reduce((total, item) => total + item.expense, 0);
    const individualShare = this.totalExpense / this.expenses.length;
    this.averageSpent = individualShare;

    const debts: BalanceMap = {};
    const credits: BalanceMap = {};

    this.expenses.forEach((payer) => {
      const share = individualShare - payer.expense;
      if (share > 0) {
        debts[payer.name] = (debts[payer.name] || 0) + share;
      } else if (share < 0) {
        credits[payer.name] = (credits[payer.name] || 0) - share;
      }
    });

    this.results = this.buildTransfers(debts, credits);
  }

  deleteExpense(expenseItem: SimpleExpense) {
    const index = this.expenses.indexOf(expenseItem);
    if (index !== -1) {
      this.expenses.splice(index, 1);
    }
  }

  clearExpenses() {
    if (this.useAdvancedMode) {
      this.clearAll();
    } else {
      this.expenses = [];
      this.resetResults();
    }
  }

  private resetResults() {
    this.results = [];
    this.totalExpense = 0;
    this.averageSpent = 0;
  }

  private buildTransfers(debts: BalanceMap, credits: BalanceMap, minTransfer = 0): SettlementResult[] {
    const transferResults: SettlementResult[] = [];

    for (const debtor in debts) {
      for (const creditor in credits) {
        if (debtor !== creditor && debts[debtor] > 0 && credits[creditor] > 0) {
          const amount = Math.min(debts[debtor], credits[creditor]);
          if (amount > minTransfer) {
            transferResults.push({ debtor, creditor, amount });
            debts[debtor] -= amount;
            credits[creditor] -= amount;
          }
        }
      }
    }

    return transferResults;
  }
}
