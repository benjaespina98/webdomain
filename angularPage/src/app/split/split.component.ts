import { Component, HostListener } from '@angular/core';

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
type LanguageCode = 'es' | 'en';

interface TranslationMap {
  appSubtitle: string;
  participants: string;
  participantsHelp: string;
  addPersonLabel: string;
  addButton: string;
  personPlaceholder: string;
  noParticipantsYet: string;
  addExpense: string;
  addExpenseHelp: string;
  needPersonFirst: string;
  expenseDescriptionLabel: string;
  expenseDescriptionPlaceholder: string;
  totalAmountLabel: string;
  amountPlaceholder: string;
  whoPaidLabel: string;
  selectPlaceholder: string;
  whoParticipates: string;
  participantHint: string;
  selectAll: string;
  clearSelection: string;
  selected: string;
  selectedFirstHint: string;
  payerNotIncluded: string;
  ready: string;
  includedParticipants: string;
  addExpenseButton: string;
  clearAll: string;
  clearAllTitle: string;
  shareWhatsapp: string;
  registeredExpenses: string;
  description: string;
  amount: string;
  paidBy: string;
  participantsColumn: string;
  perPerson: string;
  actions: string;
  deleteExpense: string;
  deleteParticipantTitle: string;
  deleteExpenseTitle: string;
  results: string;
  info: string;
  value: string;
  totalExpense: string;
  averagePerPerson: string;
  owesTo: string;
  allSettled: string;
  enterValidName: string;
  personAlreadyExists: string;
  noExpensesToShare: string;
  enterExpenseDescription: string;
  enterValidAmount: string;
  selectWhoPaid: string;
  addParticipantsToSplit: string;
  shareHeader: string;
  shareParticipants: string;
  shareExpensesLoaded: string;
  shareTotal: string;
  shareAverage: string;
  shareDetailTitle: string;
  sharePaidBy: string;
  shareAndMoreExpenses: string;
  shareTransfersTitle: string;
  shareAndMoreTransfers: string;
  shareAllSettled: string;
  shareNoTransfers: string;
  shareTransferConnector: string;
  shareFooter: string;
  shareTo: string;
  languageAria: string;
  clearSelectionTitle: string;
  splitAllTitle: string;
  languageSpanish: string;
  languageEnglish: string;
  languageChangedEs: string;
  languageChangedEn: string;
  personAdded: string;
  personRemoved: string;
  expenseAdded: string;
  expenseRemoved: string;
  allCleared: string;
  undo: string;
  undoApplied: string;
  confirmClearAll: string;
  confirmRemovePerson: string;
  confirmRemoveExpense: string;
  nothingToClear: string;
  shareGeneratedAt: string;
  shareOpenApp: string;
  whatsappOpened: string;
  splitModeAll: string;
  splitModeCustom: string;
  splitAllHelp: string;
  splitCustomHelp: string;
}

interface AppSnapshot {
  people: string[];
  expenseItems: ExpenseItem[];
  newPersonName: string;
  newExpenseDescription: string;
  newExpenseAmount: number | null;
  newExpensePaidBy: string;
  splitMode: 'all' | 'custom';
  selectedParticipants: string[];
  nextExpenseId: number;
  totalExpense: number;
  averageSpent: number;
  results: SettlementResult[];
}

@Component({
  selector: 'app-split',
  templateUrl: './split.component.html',
  styleUrls: ['./split.component.scss']
})
export class SplitComponent {
  private readonly languageStorageKey = 'split-language';
  private readonly translations: Record<LanguageCode, TranslationMap> = {
    es: {
      appSubtitle: 'Sumá personas, cargá gastos y resolvé quién le paga a quién en un toque.',
      participants: 'Participantes',
      participantsHelp: 'Agregalos una sola vez y listo. Después elegís quién participa en cada gasto.',
      addPersonLabel: 'Agregar Persona:',
      addButton: 'Agregar',
      personPlaceholder: 'Ej: Juan',
      noParticipantsYet: 'Todavía no cargaste participantes.',
      addExpense: 'Agregar Gasto',
      addExpenseHelp: 'Completá los datos y marcá quiénes comparten ese gasto.',
      needPersonFirst: 'Primero agregá al menos una persona para empezar.',
      expenseDescriptionLabel: 'Descripción del gasto:',
      expenseDescriptionPlaceholder: 'Ej: Cena, Nafta, Uber',
      totalAmountLabel: 'Monto total:',
      amountPlaceholder: 'Ej: 15000',
      whoPaidLabel: '¿Quién pagó?',
      selectPlaceholder: 'Seleccionar...',
      whoParticipates: '¿Quiénes participan en este gasto?',
      participantHint: 'Tocá cada nombre para incluirlo o quitarlo del gasto.',
      selectAll: 'Seleccionar todos',
      clearSelection: 'Borrar selección',
      selected: 'Seleccionados',
      selectedFirstHint: '(los seleccionados aparecen primero)',
      payerNotIncluded: 'pagó, pero no está incluido en el reparto.',
      ready: 'Listo',
      includedParticipants: 'participante(s) incluidos.',
      addExpenseButton: 'Agregar Gasto',
      clearAll: 'Limpiar Todo',
      clearAllTitle: 'Borra participantes y gastos',
      shareWhatsapp: 'Compartir por WhatsApp',
      registeredExpenses: 'Gastos Registrados',
      description: 'Descripción',
      amount: 'Monto',
      paidBy: 'Pagado por',
      participantsColumn: 'Participantes',
      perPerson: 'Por persona',
      actions: 'Acciones',
      deleteExpense: 'Eliminar',
      deleteParticipantTitle: 'Eliminar participante',
      deleteExpenseTitle: 'Eliminar gasto',
      results: 'Resultados',
      info: 'Información',
      value: 'Valor',
      totalExpense: 'Gasto Total:',
      averagePerPerson: 'Promedio por persona:',
      owesTo: 'le debe pagar',
      allSettled: '✅ Todo saldado. No hay pagos pendientes.',
      enterValidName: 'Por favor, ingresa un nombre válido',
      personAlreadyExists: 'Esta persona ya está en la lista',
      noExpensesToShare: 'No hay gastos para compartir',
      enterExpenseDescription: 'Por favor, ingresa una descripción del gasto',
      enterValidAmount: 'Por favor, ingresa un monto válido',
      selectWhoPaid: 'Por favor, selecciona quién pagó',
      addParticipantsToSplit: 'Por favor, agrega participantes para dividir el gasto',
      shareHeader: '💸 dividimos? - Resumen',
      shareParticipants: '👥 Participantes cargados',
      shareExpensesLoaded: '🧾 Gastos cargados',
      shareTotal: '💰 Total',
      shareAverage: '📊 Promedio por persona',
      shareDetailTitle: '🧾 Detalle de gastos',
      sharePaidBy: '👤 Pagó',
      shareAndMoreExpenses: '… y {count} gasto(s) más',
      shareTransfersTitle: '🔁 Transferencias sugeridas',
      shareAndMoreTransfers: '… y {count} transferencia(s) más',
      shareAllSettled: '✅ Todo saldado',
      shareNoTransfers: 'No hay transferencias pendientes.',
      shareTransferConnector: 'd/.',
      shareFooter: '📲 Hecho con dividimos?',
      shareTo: 'a',
      languageAria: 'Cambiar idioma',
      clearSelectionTitle: 'Desmarcar todas las personas',
      splitAllTitle: 'Si elegís Todos, el gasto se divide entre todas las personas cargadas',
      languageSpanish: 'Español',
      languageEnglish: 'Inglés',
      languageChangedEs: 'Idioma cambiado a Español',
      languageChangedEn: 'Idioma cambiado a Inglés',
      personAdded: 'Participante agregado',
      personRemoved: 'Participante eliminado',
      expenseAdded: 'Gasto agregado',
      expenseRemoved: 'Gasto eliminado',
      allCleared: 'Se limpió toda la información',
      undo: 'Deshacer',
      undoApplied: 'Cambio deshecho',
      confirmClearAll: '¿Seguro que querés borrar participantes y gastos?',
      confirmRemovePerson: '¿Eliminar este participante y sus gastos relacionados?',
      confirmRemoveExpense: '¿Eliminar este gasto?',
      nothingToClear: 'No hay datos para limpiar',
      shareGeneratedAt: '🕒 Generado',
      shareOpenApp: '🌐 Probar app',
      whatsappOpened: 'WhatsApp abierto',
      splitModeAll: 'Dividir entre todos',
      splitModeCustom: 'Elegir participantes',
      splitAllHelp: 'El gasto se dividirá en partes iguales entre todos los participantes registrados.',
      splitCustomHelp: 'Elegí quiénes participan de este gasto.'
    },
    en: {
      appSubtitle: 'Add people, enter expenses, and quickly see who owes whom.',
      participants: 'Participants',
      participantsHelp: 'Add them once and you are done. Then choose who is included in each expense.',
      addPersonLabel: 'Add Person:',
      addButton: 'Add',
      personPlaceholder: 'Ex: John',
      noParticipantsYet: 'You have not added participants yet.',
      addExpense: 'Add Expense',
      addExpenseHelp: 'Fill in the details and mark who shares this expense.',
      needPersonFirst: 'Add at least one person first to start.',
      expenseDescriptionLabel: 'Expense description:',
      expenseDescriptionPlaceholder: 'Ex: Dinner, Fuel, Uber',
      totalAmountLabel: 'Total amount:',
      amountPlaceholder: 'Ex: 15000',
      whoPaidLabel: 'Who paid?',
      selectPlaceholder: 'Select...',
      whoParticipates: 'Who participates in this expense?',
      participantHint: 'Tap each name to include or remove it from this expense.',
      selectAll: 'Select all',
      clearSelection: 'Clear selection',
      selected: 'Selected',
      selectedFirstHint: '(selected participants appear first)',
      payerNotIncluded: 'paid, but is not included in the split.',
      ready: 'Ready',
      includedParticipants: 'participant(s) included.',
      addExpenseButton: 'Add Expense',
      clearAll: 'Clear All',
      clearAllTitle: 'Deletes participants and expenses',
      shareWhatsapp: 'Share on WhatsApp',
      registeredExpenses: 'Registered Expenses',
      description: 'Description',
      amount: 'Amount',
      paidBy: 'Paid by',
      participantsColumn: 'Participants',
      perPerson: 'Per person',
      actions: 'Actions',
      deleteExpense: 'Delete',
      deleteParticipantTitle: 'Delete participant',
      deleteExpenseTitle: 'Delete expense',
      results: 'Results',
      info: 'Information',
      value: 'Value',
      totalExpense: 'Total Expense:',
      averagePerPerson: 'Average per person:',
      owesTo: 'owes',
      allSettled: '✅ All settled. No pending payments.',
      enterValidName: 'Please enter a valid name',
      personAlreadyExists: 'This person is already in the list',
      noExpensesToShare: 'There are no expenses to share',
      enterExpenseDescription: 'Please enter an expense description',
      enterValidAmount: 'Please enter a valid amount',
      selectWhoPaid: 'Please select who paid',
      addParticipantsToSplit: 'Please add participants to split the expense',
      shareHeader: '💸 dividimos? - Summary',
      shareParticipants: '👥 Participants loaded',
      shareExpensesLoaded: '🧾 Expenses loaded',
      shareTotal: '💰 Total',
      shareAverage: '📊 Average per person',
      shareDetailTitle: '🧾 Expense details',
      sharePaidBy: '👤 Paid by',
      shareAndMoreExpenses: '… and {count} more expense(s)',
      shareTransfersTitle: '🔁 Suggested transfers',
      shareAndMoreTransfers: '… and {count} more transfer(s)',
      shareAllSettled: '✅ All settled',
      shareNoTransfers: 'There are no pending transfers.',
      shareTransferConnector: 'to',
      shareFooter: '📲 Built with dividimos?',
      shareTo: 'to',
      languageAria: 'Change language',
      clearSelectionTitle: 'Uncheck all people',
      splitAllTitle: 'If you choose All, the expense is split across all loaded people',
      languageSpanish: 'Spanish',
      languageEnglish: 'English',
      languageChangedEs: 'Language changed to Spanish',
      languageChangedEn: 'Language changed to English',
      personAdded: 'Participant added',
      personRemoved: 'Participant removed',
      expenseAdded: 'Expense added',
      expenseRemoved: 'Expense deleted',
      allCleared: 'All information has been cleared',
      undo: 'Undo',
      undoApplied: 'Change undone',
      confirmClearAll: 'Are you sure you want to delete participants and expenses?',
      confirmRemovePerson: 'Delete this participant and related expenses?',
      confirmRemoveExpense: 'Delete this expense?',
      nothingToClear: 'There is no data to clear',
      shareGeneratedAt: '🕒 Generated',
      shareOpenApp: '🌐 Try app',
      whatsappOpened: 'WhatsApp opened',
      splitModeAll: 'Split equally',
      splitModeCustom: 'Choose participants',
      splitAllHelp: 'The expense will be divided equally among all registered participants.',
      splitCustomHelp: 'Choose who takes part in this expense.'
    }
  };

  currentLanguage: LanguageCode = 'es';
  uiNotice = '';
  uiNoticeType: 'success' | 'info' | 'warning' = 'info';
  canUndoLastAction = false;
  private lastSnapshot: AppSnapshot | null = null;
  private noticeTimer: ReturnType<typeof setTimeout> | null = null;

  totalExpense = 0;
  averageSpent = 0;
  results: SettlementResult[] = [];

  people: string[] = [];
  expenseItems: ExpenseItem[] = [];
  newPersonName: string = '';
  newExpenseDescription: string = '';
  newExpenseAmount: number | null = null;
  newExpensePaidBy: string = '';
  splitMode: 'all' | 'custom' = 'all';
  selectedParticipants: string[] = [];
  nextExpenseId = 1;

  constructor() {
    this.initializeLanguage();
  }

  t(key: keyof TranslationMap): string {
    return this.translations[this.currentLanguage][key];
  }

  setLanguage(language: LanguageCode): void {
    this.currentLanguage = language;
    localStorage.setItem(this.languageStorageKey, language);
    const languageMessage = language === 'es' ? this.t('languageChangedEs') : this.t('languageChangedEn');
    this.showNotice(languageMessage, 'info');
  }

  dismissNotice(): void {
    this.uiNotice = '';
    this.canUndoLastAction = false;
    if (this.noticeTimer) {
      clearTimeout(this.noticeTimer);
      this.noticeTimer = null;
    }
  }

  undoLastAction(): void {
    if (!this.lastSnapshot) {
      return;
    }

    this.restoreSnapshot(this.lastSnapshot);
    this.lastSnapshot = null;
    this.canUndoLastAction = false;
    this.showNotice(this.t('undoApplied'), 'info');
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    if (!(event.ctrlKey || event.metaKey) || event.key !== 'Enter') {
      return;
    }

    if (!this.isExpenseFormValid()) {
      return;
    }

    event.preventDefault();
    this.addExpenseItem();
  }

  addPerson(): void {
    const cleanPersonName = this.newPersonName.trim();

    if (!cleanPersonName) {
      alert(this.t('enterValidName'));
      return;
    }

    if (this.people.includes(cleanPersonName)) {
      alert(this.t('personAlreadyExists'));
      return;
    }

    this.people.push(cleanPersonName);
    this.newPersonName = '';
    this.showNotice(this.t('personAdded'), 'success');

    if (this.selectedParticipants.length === 0) {
      this.selectAllParticipants();
    }
  }

  removePerson(person: string): void {
    if (!confirm(this.t('confirmRemovePerson'))) {
      return;
    }

    this.saveSnapshotForUndo();
    this.people = this.people.filter((currentPerson) => currentPerson !== person);
    this.expenseItems = this.expenseItems.filter((item) =>
      item.paidBy !== person && !item.participants.includes(person)
    );
    this.calculateAdvancedShares();
    this.showNotice(this.t('personRemoved'), 'warning', true);
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

    if (!this.selectedParticipants.includes(this.newExpensePaidBy)) {
      this.selectedParticipants = [...this.selectedParticipants, this.newExpensePaidBy];
    }
  }

  areAllSelected(): boolean {
    return this.people.length > 0 && this.selectedParticipants.length === this.people.length;
  }

  areNoneSelected(): boolean {
    return this.selectedParticipants.length === 0;
  }

  getPeopleForSelection(): string[] {
    return this.people;
  }

  isPayerIncludedInParticipants(): boolean {
    if (!this.newExpensePaidBy) {
      return true;
    }

    return this.selectedParticipants.includes(this.newExpensePaidBy);
  }

  shareWhatsApp(): void {
    if (this.expenseItems.length === 0) {
      alert(this.t('noExpensesToShare'));
      return;
    }

    const generatedAt = new Date().toLocaleString(this.currentLanguage === 'es' ? 'es-AR' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    const appLink = this.getShareAppLink();

    const headerLines = [
      '🟣 Dividimos?',
      `${this.t('shareParticipants')}: ${this.people.length}`,
      `${this.t('shareExpensesLoaded')}: ${this.expenseItems.length}`,
      `${this.t('shareTotal')}: ${this.formatCurrency(this.totalExpense)}`,
      `${this.t('shareAverage')}: ${this.formatCurrency(this.averageSpent)}`
    ];

    const expensesLines = [
      '',
      this.t('shareDetailTitle'),
      ...this.expenseItems.map((item, index) =>
        `${index + 1}) ${item.description} - ${this.formatCurrency(item.amount)}\n   ${this.t('sharePaidBy')}: ${item.paidBy} | 👥 ${item.participants.join(', ')}`
      )
    ];

    const transfersLines = [''];

    if (this.results.length > 0) {
      transfersLines.push(this.t('shareTransfersTitle'));
      this.results.forEach((result, index) => {
        if (this.currentLanguage === 'es') {
          transfersLines.push(`${index + 1}. ${result.debtor} le debe pagar a ${result.creditor}: ${this.formatCurrency(result.amount)}`);
        } else {
          transfersLines.push(`${index + 1}. ${result.debtor} ${this.t('shareTransferConnector')} ${result.creditor}: ${this.formatCurrency(result.amount)}`);
        }
      });
    } else {
      transfersLines.push(this.t('shareAllSettled'));
      transfersLines.push(this.t('shareNoTransfers'));
    }

    const footerLines = [
      '',
      this.t('shareFooter'),
      ...(appLink ? [`${this.t('shareOpenApp')}: ${appLink}`] : [])
    ];
    const message = [...headerLines, ...expensesLines, ...transfersLines, ...footerLines].join('\n');

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
    this.showNotice(this.t('whatsappOpened'), 'success');
  }

  addExpenseItem(): void {
    if (!this.newExpenseDescription.trim()) {
      alert(this.t('enterExpenseDescription'));
      return;
    }
    
    if (this.newExpenseAmount === null || this.newExpenseAmount <= 0) {
      alert(this.t('enterValidAmount'));
      return;
    }

    if (!this.newExpensePaidBy) {
      alert(this.t('selectWhoPaid'));
      return;
    }

    if (this.splitMode === 'all') {
      this.selectAllParticipants();
    } else if (this.splitMode === 'custom' && this.selectedParticipants.length === 0) {
      alert(this.t('addParticipantsToSplit'));
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
    this.showNotice(this.t('expenseAdded'), 'success');
  }

  removeExpenseItem(expenseId: number): void {
    if (!confirm(this.t('confirmRemoveExpense'))) {
      return;
    }

    this.saveSnapshotForUndo();
    this.expenseItems = this.expenseItems.filter((item) => item.id !== expenseId);
    this.calculateAdvancedShares();
    this.showNotice(this.t('expenseRemoved'), 'warning', true);
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
    if (this.people.length === 0 && this.expenseItems.length === 0) {
      this.showNotice(this.t('nothingToClear'), 'info');
      return;
    }

    if (!confirm(this.t('confirmClearAll'))) {
      return;
    }

    this.saveSnapshotForUndo();
    this.people = [];
    this.expenseItems = [];
    this.newPersonName = '';
    this.newExpenseDescription = '';
    this.newExpenseAmount = null;
    this.newExpensePaidBy = '';
    this.splitMode = 'all';
    this.selectedParticipants = [];
    this.nextExpenseId = 1;

    this.resetResults();
    this.showNotice(this.t('allCleared'), 'warning', true);
  }

  private isExpenseFormValid(): boolean {
    return this.people.length > 0
      && !!this.newExpenseDescription.trim()
      && !!this.newExpenseAmount
      && this.newExpenseAmount > 0
      && !!this.newExpensePaidBy;
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

  private formatCurrency(amount: number): string {
    return `$${amount.toFixed(2)}`;
  }

  private getShareAppLink(): string {
    const baseUrl = `${window.location.origin}${window.location.pathname}`;
    if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
      return '';
    }

    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}ref=whatsapp`;
  }

  private showNotice(message: string, type: 'success' | 'info' | 'warning', enableUndo = false): void {
    this.uiNotice = message;
    this.uiNoticeType = type;
    this.canUndoLastAction = enableUndo && !!this.lastSnapshot;

    if (this.noticeTimer) {
      clearTimeout(this.noticeTimer);
    }

    this.noticeTimer = setTimeout(() => {
      this.uiNotice = '';
      this.canUndoLastAction = false;
      this.noticeTimer = null;
    }, 4500);
  }

  private saveSnapshotForUndo(): void {
    this.lastSnapshot = {
      people: [...this.people],
      expenseItems: this.expenseItems.map((item) => ({ ...item, participants: [...item.participants] })),
      newPersonName: this.newPersonName,
      newExpenseDescription: this.newExpenseDescription,
      newExpenseAmount: this.newExpenseAmount,
      newExpensePaidBy: this.newExpensePaidBy,
      splitMode: this.splitMode,
      selectedParticipants: [...this.selectedParticipants],
      nextExpenseId: this.nextExpenseId,
      totalExpense: this.totalExpense,
      averageSpent: this.averageSpent,
      results: this.results.map((result) => ({ ...result }))
    };
  }

  private restoreSnapshot(snapshot: AppSnapshot): void {
    this.people = [...snapshot.people];
    this.expenseItems = snapshot.expenseItems.map((item) => ({ ...item, participants: [...item.participants] }));
    this.newPersonName = snapshot.newPersonName;
    this.newExpenseDescription = snapshot.newExpenseDescription;
    this.newExpenseAmount = snapshot.newExpenseAmount;
    this.newExpensePaidBy = snapshot.newExpensePaidBy;
    this.splitMode = snapshot.splitMode;
    this.selectedParticipants = [...snapshot.selectedParticipants];
    this.nextExpenseId = snapshot.nextExpenseId;
    this.totalExpense = snapshot.totalExpense;
    this.averageSpent = snapshot.averageSpent;
    this.results = snapshot.results.map((result) => ({ ...result }));
  }

  private initializeLanguage(): void {
    const savedLanguage = localStorage.getItem(this.languageStorageKey);

    if (savedLanguage === 'es' || savedLanguage === 'en') {
      this.currentLanguage = savedLanguage;
      return;
    }

    this.currentLanguage = this.detectDeviceLanguage();
  }

  private detectDeviceLanguage(): LanguageCode {
    const browserLanguage = (navigator.languages?.[0] ?? navigator.language ?? 'es').toLowerCase();
    return browserLanguage.startsWith('es') ? 'es' : 'en';
  }
}
