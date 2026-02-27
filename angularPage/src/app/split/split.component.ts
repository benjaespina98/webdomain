import { Component } from '@angular/core';

interface ExpenseItem {
  id: number;
  description: string;
  amount: number;
  paidBy: string;
  participants: string[];
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

  totalExpense = 0;
  averageSpent = 0;
  results: SettlementResult[] = [];

  people: string[] = [];
  expenseItems: ExpenseItem[] = [];
  newPersonName: string = '';
  newExpenseDescription: string = '';
  newExpenseAmount: number | null = null;
  newExpensePaidBy: string = '';
  selectedParticipants: string[] = [];
  nextExpenseId = 1;

  addPerson(): void {
    const cleanPersonName = this.newPersonName.trim();

    if (!cleanPersonName) {
      alert('Por favor, ingresa un nombre válido');
      return;
    }

    if (this.people.includes(cleanPersonName)) {
      alert('Esta persona ya está en la lista');
      return;
    }

    this.people.push(cleanPersonName);
    this.newPersonName = '';

    if (this.selectedParticipants.length === 0) {
      this.selectAllParticipants();
    }
  }

  removePerson(person: string): void {
    this.people = this.people.filter((currentPerson) => currentPerson !== person);
    this.expenseItems = this.expenseItems.filter((item) =>
      item.paidBy !== person && !item.participants.includes(person)
    );
    this.calculateAdvancedShares();
  }

  toggleParticipant(person: string): void {
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

  selectAllParticipants(): void {
    this.selectedParticipants = [...this.people];
  }

  deselectAllParticipants(): void {
    this.selectedParticipants = [];
  }

  onPaidByChange(): void {
    if (!this.newExpensePaidBy) {
      return;
    }

    if (this.selectedParticipants.length === 0) {
      this.selectedParticipants = [this.newExpensePaidBy];
    }
  }

  areAllSelected(): boolean {
    return this.people.length > 0 && this.selectedParticipants.length === this.people.length;
  }

  areNoneSelected(): boolean {
    return this.selectedParticipants.length === 0;
  }

  getPeopleForSelection(): string[] {
    const selected = this.people.filter((person) => this.selectedParticipants.includes(person));
    const notSelected = this.people.filter((person) => !this.selectedParticipants.includes(person));
    return [...selected, ...notSelected];
  }

  isPayerIncludedInParticipants(): boolean {
    if (!this.newExpensePaidBy) {
      return true;
    }

    return this.selectedParticipants.includes(this.newExpensePaidBy);
  }

  shareWhatsApp(): void {
    if (this.expenseItems.length === 0) {
      alert('No hay gastos para compartir');
      return;
    }

    const maxTransfersToShow = 6;
    const baseMessage = [
      '💸 *Dividimos?*',
      `👥 ${this.people.length} | 🧾 ${this.expenseItems.length}`,
      `💰 Total: $${this.totalExpense.toFixed(2)} | 📊 Promedio: $${this.averageSpent.toFixed(2)}`
    ];

    let message = `${baseMessage.join('\n')}\n`;

    if (this.results.length > 0) {
      const visibleTransfers = this.results.slice(0, maxTransfersToShow);
      const hiddenTransfersCount = this.results.length - visibleTransfers.length;

      message += `\n🔁 *Transferencias:*\n`;
      visibleTransfers.forEach((result) => {
        message += `• ${result.debtor} ➜ ${result.creditor}: $${result.amount.toFixed(2)}\n`;
      });

      if (hiddenTransfersCount > 0) {
        message += `… y ${hiddenTransfersCount} más\n`;
      }
    } else {
      message += `\n✅ Todo saldado. No hay transferencias pendientes.`;
    }

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  }

  addExpenseItem(): void {
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
      this.selectAllParticipants();
    }

    if (this.selectedParticipants.length === 0) {
      alert('Por favor, agrega participantes para dividir el gasto');
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

    this.newExpenseDescription = '';
    this.newExpenseAmount = null;
    this.newExpensePaidBy = '';
    this.selectAllParticipants();

    this.calculateAdvancedShares();
  }

  removeExpenseItem(expenseId: number): void {
    this.expenseItems = this.expenseItems.filter((item) => item.id !== expenseId);
    this.calculateAdvancedShares();
  }

  calculateAdvancedShares(): void {
    if (this.people.length === 0 || this.expenseItems.length === 0) {
      this.resetResults();
      return;
    }

    const balances = this.createZeroBalances(this.people);

    this.totalExpense = 0;

    this.expenseItems.forEach((expense) => {
      this.totalExpense += expense.amount;
      const sharePerPerson = expense.amount / expense.participants.length;

      balances[expense.paidBy] += expense.amount;

      expense.participants.forEach((participant) => {
        balances[participant] -= sharePerPerson;
      });
    });

    const { debts, credits } = this.splitBalances(balances);

    this.results = this.buildTransfers(debts, credits, 0.01);
    this.averageSpent = this.totalExpense / this.people.length;
  }

  clearAll(): void {
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

  copyTable(): void {
    const resultsText = this.results
      .map((result) => `- ${result.debtor} le debe pagar $${result.amount.toFixed(2)} a ${result.creditor}`)
      .join('\n');

    const expenseDetailsText = this.expenseItems
      .map((item) => `${item.description}: $${item.amount.toFixed(2)} (pagado por ${item.paidBy}, participantes: ${item.participants.join(', ')})`)
      .join('\n');

    const calculationsText = `Gasto Total: $${this.totalExpense.toFixed(2)}\nPromedio por Participante: $${this.averageSpent.toFixed(2)}\n\nDetalle de gastos:\n${expenseDetailsText}`;

    const textToCopy = this.copyHeader + `${resultsText}\n\n${calculationsText}`;

    navigator.clipboard.writeText(textToCopy)
        .then(() => {
            alert('Datos copiados :)');
        })
        .catch((error) => {
            console.error('Error al copiar al portapapeles: ', error);
        }); 
  }

  trackByPerson(_index: number, person: string): string {
    return person;
  }

  trackByExpenseItem(_index: number, expenseItem: ExpenseItem): number {
    return expenseItem.id;
  }

  trackByResult(_index: number, result: SettlementResult): string {
    return `${result.debtor}-${result.creditor}`;
  }

  private resetResults() {
    this.results = [];
    this.totalExpense = 0;
    this.averageSpent = 0;
  }

  private createZeroBalances(people: string[]): BalanceMap {
    return people.reduce<BalanceMap>((accumulator, person) => {
      accumulator[person] = 0;
      return accumulator;
    }, {});
  }

  private splitBalances(balances: BalanceMap): { debts: BalanceMap; credits: BalanceMap } {
    const debts: BalanceMap = {};
    const credits: BalanceMap = {};

    Object.entries(balances).forEach(([person, balance]) => {
      if (balance < 0) {
        debts[person] = Math.abs(balance);
      } else if (balance > 0) {
        credits[person] = balance;
      }
    });

    return { debts, credits };
  }

  private buildTransfers(debts: BalanceMap, credits: BalanceMap, minTransfer = 0): SettlementResult[] {
    const transferResults: SettlementResult[] = [];

    const remainingDebts: BalanceMap = { ...debts };
    const remainingCredits: BalanceMap = { ...credits };

    for (const debtor in remainingDebts) {
      for (const creditor in remainingCredits) {
        if (debtor !== creditor && remainingDebts[debtor] > 0 && remainingCredits[creditor] > 0) {
          const amount = Math.min(remainingDebts[debtor], remainingCredits[creditor]);
          if (amount > minTransfer) {
            transferResults.push({ debtor, creditor, amount });
            remainingDebts[debtor] -= amount;
            remainingCredits[creditor] -= amount;
          }
        }
      }
    }

    return transferResults;
  }
}
