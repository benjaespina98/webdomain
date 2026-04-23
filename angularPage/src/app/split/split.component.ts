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
  detail: string;
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
  owesToInline: string;
  allSettled: string;
  enterValidName: string;
  personAlreadyExists: string;
  noExpensesToShare: string;
  enterExpenseDescription: string;
  enterValidAmount: string;
  selectWhoPaid: string;
  addParticipantsToSplit: string;
  shareHeader: string;
  shareTotal: string;
  shareDetailTitle: string;
  sharePaidBy: string;
  shareAndMoreExpenses: string;
  shareTransfersTitle: string;
  shareAndMoreTransfers: string;
  shareAllSettled: string;
  shareNoTransfers: string;
  shareTransferConnector: string;
  shareFooter: string;
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
  whatsappOpened: string;
  summaryCopied: string;
  copySummary: string;
  copySummaryDone: string;
  clipboardUnavailable: string;
  splitModeAll: string;
  splitModeCustom: string;
  splitAllHelp: string;
  splitCustomHelp: string;
  workflowStepParticipants: string;
  workflowStepExpenses: string;
  workflowStepResults: string;
  workflowParticipantsHelp: string;
  workflowExpensesHelp: string;
  workflowResultsHelp: string;
  continueToExpenses: string;
  backToParticipants: string;
  showStepGuide: string;
  hideStepGuide: string;
  currentStepLabel: string;
  viewResults: string;
  reviewExpenses: string;
  readyToCalculate: string;
  addExpenseToContinue: string;
  debtorLabel: string;
  creditorLabel: string;
  paymentLabel: string;
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
  workflowStage: 'participants' | 'expenses' | 'results';
  hasUnlockedExpenses: boolean;
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
  private readonly publicAppUrl = 'https://dividimos.vercel.app/';
  private readonly translations: Record<LanguageCode, TranslationMap> = {
    es: {
      detail: 'Detalle',
      appSubtitle: 'sumá personas, cargá gastos y resolvé quién le paga a quién en un toque.',
      participants: 'Personas',
      participantsHelp: 'sumalas una sola vez y listo; después elegís quién entra en cada gasto.',
      addPersonLabel: 'Agregar personas:',
      addButton: 'Agregar',
      personPlaceholder: 'Ej: Juan',
      noParticipantsYet: 'todavía no sumaste personas.',
      addExpense: 'Sumar gasto',
      addExpenseHelp: 'completá los datos y marcá quiénes comparten ese gasto.',
      needPersonFirst: 'primero sumá al menos una persona para empezar.',
      expenseDescriptionLabel: 'Descripción del gasto:',
      expenseDescriptionPlaceholder: 'Ej: Cena, Nafta, Uber',
      totalAmountLabel: 'Monto total:',
      amountPlaceholder: 'Ej: $ 15000',
      whoPaidLabel: '¿Quién pagó?',
      selectPlaceholder: 'Seleccionar...',
      whoParticipates: '¿Quiénes entran en este gasto?',
      participantHint: 'tocá cada nombre para sumarlo o sacarlo de este gasto.',
      selectAll: 'Seleccionar todos',
      clearSelection: 'Borrar selección',
      selected: 'seleccionados',
      selectedFirstHint: '(los seleccionados aparecen primero)',
      payerNotIncluded: 'pagó, pero no está incluido en el reparto.',
      ready: 'Listo',
      includedParticipants: 'persona(s) incluidas.',
      addExpenseButton: 'Sumar gasto',
      clearAll: 'Limpiar todo',
      clearAllTitle: 'Borra participantes y gastos',
      shareWhatsapp: 'Compartir por WhatsApp',
      registeredExpenses: 'Gastos cargados',
      description: 'Descripción',
      amount: 'Monto',
      paidBy: 'Pagado por',
      participantsColumn: 'personas',
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
      owesToInline: 'le debe a',
      allSettled: '✅ Todo saldado. No hay pagos pendientes.',
      enterValidName: 'por favor, ingresá un nombre válido',
      personAlreadyExists: 'Esta persona ya está en la lista',
      noExpensesToShare: 'No hay gastos para compartir',
      enterExpenseDescription: 'Por favor, ingresa una descripción del gasto',
      enterValidAmount: 'Por favor, ingresa un monto válido',
      selectWhoPaid: 'por favor, seleccioná quién pagó',
      addParticipantsToSplit: 'por favor, sumá personas para dividir el gasto',
      shareHeader: 'dividimos? | Resumen',
      shareTotal: 'Total',
      shareDetailTitle: 'Detalle de gastos',
      sharePaidBy: 'Pagó',
      shareAndMoreExpenses: '… y {count} gasto(s) más',
      shareTransfersTitle: 'Pagos sugeridos',
      shareAndMoreTransfers: '… y {count} transferencia(s) más',
      shareAllSettled: 'Todo saldado',
      shareNoTransfers: 'No hay transferencias pendientes.',
      shareTransferConnector: 'd/.',
      shareFooter: 'Hecho con dividimos?',
      languageAria: 'cambiar idioma',
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
      whatsappOpened: 'WhatsApp abierto',
      summaryCopied: 'Resumen copiado al portapapeles',
      copySummary: 'Copiar resumen',
      copySummaryDone: 'Copiado',
      clipboardUnavailable: 'No se pudo copiar automáticamente. Copiá el texto manualmente.',
      splitModeAll: 'Dividir entre todos',
      splitModeCustom: 'Elegir personas',
      splitAllHelp: 'este gasto se divide en partes iguales entre todas las personas cargadas.',
      splitCustomHelp: 'elegí quiénes entran en este gasto.',
      workflowStepParticipants: 'Paso 1: Personas',
      workflowStepExpenses: 'Paso 2: Gastos',
      workflowStepResults: 'Paso 3: Resultados',
      workflowParticipantsHelp: 'agregá solo los nombres de las personas.',
      workflowExpensesHelp: 'cargá gasto, monto y quién pagó. Elegí personas solo si no participan todos.',
      workflowResultsHelp: 'revisá cuánto paga cada persona y compartí el resumen.',
      continueToExpenses: 'Seguir a gastos',
      backToParticipants: 'Volver a personas',
      showStepGuide: 'ver guía de pasos',
      hideStepGuide: 'ocultar guía de pasos',
      currentStepLabel: 'paso actual',
      viewResults: 'Calcular / Ver resultados',
      reviewExpenses: 'Seguir cargando gastos',
      readyToCalculate: 'Ya podés calcular el resultado.',
      addExpenseToContinue: 'Cargá al menos un gasto para pasar al paso 3.',
      debtorLabel: 'Debe',
      creditorLabel: 'Recibe',
      paymentLabel: 'Monto'
    },
    en: {
      detail: 'Detail',
      appSubtitle: 'Add people, enter expenses, and quickly see who owes whom.',
      participants: 'people',
      participantsHelp: 'Add them once and you are done. Then choose who is included in each expense.',
      addPersonLabel: 'Add person:',
      addButton: 'Add',
      personPlaceholder: 'Ex: John',
      noParticipantsYet: 'You have not added participants yet.',
      addExpense: 'Add expense',
      addExpenseHelp: 'Fill in the details and mark who shares this expense.',
      needPersonFirst: 'Add at least one person first to start.',
      expenseDescriptionLabel: 'Expense description:',
      expenseDescriptionPlaceholder: 'Ex: Dinner, Fuel, Uber',
      totalAmountLabel: 'Total amount:',
      amountPlaceholder: 'Ex: $ 15000',
      whoPaidLabel: 'Who paid?',
      selectPlaceholder: 'Select...',
      whoParticipates: 'Who is included in this expense?',
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
      participantsColumn: 'people',
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
      owesToInline: 'owes',
      allSettled: '✅ All settled. No pending payments.',
      enterValidName: 'Please enter a valid name',
      personAlreadyExists: 'This person is already in the list',
      noExpensesToShare: 'There are no expenses to share',
      enterExpenseDescription: 'Please enter an expense description',
      enterValidAmount: 'Please enter a valid amount',
      selectWhoPaid: 'Please select who paid',
      addParticipantsToSplit: 'Please add participants to split the expense',
      shareHeader: 'dividimos? | Summary',
      shareTotal: 'Total',
      shareDetailTitle: 'Expense details',
      sharePaidBy: 'Paid by',
      shareAndMoreExpenses: '… and {count} more expense(s)',
      shareTransfersTitle: 'Suggested payments',
      shareAndMoreTransfers: '… and {count} more transfer(s)',
      shareAllSettled: 'All settled',
      shareNoTransfers: 'There are no pending transfers.',
      shareTransferConnector: 'to',
      shareFooter: 'Built with dividimos?',
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
      whatsappOpened: 'WhatsApp opened',
      summaryCopied: 'Summary copied to clipboard',
      copySummary: 'Copy summary',
      copySummaryDone: 'Copied',
      clipboardUnavailable: 'Could not copy automatically. Please copy the text manually.',
      splitModeAll: 'Split equally',
      splitModeCustom: 'Choose people',
      splitAllHelp: 'The expense will be divided equally among all registered participants.',
      splitCustomHelp: 'Choose who takes part in this expense.',
      workflowStepParticipants: 'Step 1: Participants',
      workflowStepExpenses: 'Step 2: Expenses',
      workflowStepResults: 'Step 3: Results',
      workflowParticipantsHelp: 'Add only the people names.',
      workflowExpensesHelp: 'Add expense, amount, and who paid. Pick people only if not everyone is included.',
      workflowResultsHelp: 'Review who pays whom and share the summary.',
      continueToExpenses: 'Continue to expenses',
      backToParticipants: 'Back to participants',
      showStepGuide: 'Show step guide',
      hideStepGuide: 'Hide step guide',
      currentStepLabel: 'Current step',
      viewResults: 'Calculate / View results',
      reviewExpenses: 'Keep adding expenses',
      readyToCalculate: 'You can now calculate the result.',
      addExpenseToContinue: 'Add at least one expense to continue to step 3.',
      debtorLabel: 'Pays',
      creditorLabel: 'Receives',
      paymentLabel: 'Amount'
    }
  };

  currentLanguage: LanguageCode = 'es';
  uiNotice = '';
  uiNoticeType: 'success' | 'info' | 'warning' = 'info';
  canUndoLastAction = false;
  isCopySummaryDone = false;
  private lastSnapshot: AppSnapshot | null = null;
  private noticeTimer: ReturnType<typeof setTimeout> | null = null;
  private copyFeedbackTimer: ReturnType<typeof setTimeout> | null = null;

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
  workflowStage: 'participants' | 'expenses' | 'results' = 'participants';
  hasUnlockedExpenses = false;
  showWorkflowGuide = false;

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

    if (!this.canSubmitExpense()) {
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
    this.workflowStage = 'participants';
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
    this.selectedParticipants = this.selectedParticipants.filter((participant) => participant !== person);
    if (this.newExpensePaidBy === person) {
      this.newExpensePaidBy = '';
    }
    this.expenseItems = this.expenseItems.filter((item) =>
      item.paidBy !== person && !item.participants.includes(person)
    );
    this.calculateAdvancedShares();

    if (this.people.length === 0) {
      this.workflowStage = 'participants';
      this.hasUnlockedExpenses = false;
    }

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

  setSplitMode(mode: 'all' | 'custom'): void {
    this.splitMode = mode;

    if (this.people.length === 0) {
      return;
    }

    // Keep custom mode easy to use by starting from everyone selected.
    if (mode === 'all' || this.selectedParticipants.length === 0) {
      this.selectAllParticipants();
    }
  }

  setWorkflowStage(stage: 'participants' | 'expenses' | 'results'): void {
    if (stage !== 'participants' && this.people.length === 0) {
      return;
    }

    if (stage === 'expenses' && !this.canAccessExpenses()) {
      return;
    }

    if (stage === 'results' && !this.canAccessResults()) {
      return;
    }

    this.workflowStage = stage;
  }

  continueToExpenses(): void {
    if (this.people.length === 0) {
      return;
    }

    this.hasUnlockedExpenses = true;
    this.setWorkflowStage('expenses');
  }

  continueToResults(): void {
    if (!this.canAccessResults()) {
      return;
    }

    this.calculateAdvancedShares();
    this.setWorkflowStage('results');
  }

  toggleWorkflowGuide(): void {
    this.showWorkflowGuide = !this.showWorkflowGuide;
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
    const message = this.buildShareMessage();

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
    this.showNotice(this.t('whatsappOpened'), 'success');
  }

  async copySummary(): Promise<void> {
    if (this.expenseItems.length === 0) {
      alert(this.t('noExpensesToShare'));
      return;
    }

    const message = this.buildShareMessage();

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(message);
        this.triggerCopyFeedback();
        this.showNotice(this.t('summaryCopied'), 'success');
        return;
      }

      throw new Error('Clipboard API unavailable');
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = message;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      try {
        textArea.focus({ preventScroll: true });
      } catch {
        textArea.focus();
      }
      textArea.select();

      const copied = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (copied) {
        this.triggerCopyFeedback();
        this.showNotice(this.t('summaryCopied'), 'success');
      } else {
        alert(this.t('clipboardUnavailable'));
      }
    }
  }

  private triggerCopyFeedback(): void {
    this.isCopySummaryDone = true;
    if (this.copyFeedbackTimer) {
      clearTimeout(this.copyFeedbackTimer);
    }

    this.copyFeedbackTimer = setTimeout(() => {
      this.isCopySummaryDone = false;
      this.copyFeedbackTimer = null;
    }, 1800);
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
    this.hasUnlockedExpenses = true;
    this.showNotice(this.t('expenseAdded'), 'success');
  }

  removeExpenseItem(expenseId: number): void {
    if (!confirm(this.t('confirmRemoveExpense'))) {
      return;
    }

    this.saveSnapshotForUndo();
    this.expenseItems = this.expenseItems.filter((item) => item.id !== expenseId);
    this.calculateAdvancedShares();

    if (this.expenseItems.length === 0) {
      this.workflowStage = this.people.length > 0 ? 'expenses' : 'participants';
    }

    this.showNotice(this.t('expenseRemoved'), 'warning', true);
  }

  calculateAdvancedShares(): void {
    if (this.people.length === 0 || this.expenseItems.length === 0) {
      this.resetResults();
      return;
    }

    const balancesInCents = this.createZeroBalances(this.people);
    let totalExpenseInCents = 0;

    this.expenseItems.forEach((expense) => {
      const validParticipants = expense.participants.filter((participant) => this.people.includes(participant));
      if (validParticipants.length === 0 || !this.people.includes(expense.paidBy)) {
        return;
      }

      const amountInCents = this.toCents(expense.amount);
      totalExpenseInCents += amountInCents;
      balancesInCents[expense.paidBy] += amountInCents;

      const baseShare = Math.floor(amountInCents / validParticipants.length);
      const remainder = amountInCents % validParticipants.length;

      validParticipants.forEach((participant, index) => {
        const participantShare = baseShare + (index < remainder ? 1 : 0);
        balancesInCents[participant] -= participantShare;
      });
    });

    const { debts, credits } = this.splitBalances(balancesInCents);
    this.results = this.buildTransfers(debts, credits);
    this.totalExpense = this.fromCents(totalExpenseInCents);
    this.averageSpent = this.people.length > 0 ? this.fromCents(Math.round(totalExpenseInCents / this.people.length)) : 0;
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
    this.workflowStage = 'participants';
    this.hasUnlockedExpenses = false;

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

  canSubmitExpense(): boolean {
    if (!this.isExpenseFormValid()) {
      return false;
    }

    return this.splitMode === 'all' || this.selectedParticipants.length > 0;
  }

  isStageActive(stage: 'participants' | 'expenses' | 'results'): boolean {
    return this.workflowStage === stage;
  }

  isStageDone(stage: 'participants' | 'expenses' | 'results'): boolean {
    if (stage === 'participants') {
      return this.people.length > 0;
    }

    if (stage === 'expenses') {
      return this.expenseItems.length > 0;
    }

    return this.results.length > 0 || this.expenseItems.length > 0;
  }

  canAccessExpenses(): boolean {
    return this.people.length > 0 && this.hasUnlockedExpenses;
  }

  canAccessResults(): boolean {
    return this.expenseItems.length > 0 && this.hasUnlockedExpenses;
  }

  getCurrentStepTitle(): string {
    if (this.workflowStage === 'participants') {
      return this.t('workflowStepParticipants');
    }

    if (this.workflowStage === 'expenses') {
      return this.t('workflowStepExpenses');
    }

    return this.t('workflowStepResults');
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

  private buildTransfers(debts: BalanceMap, credits: BalanceMap): SettlementResult[] {
    const transferResults: SettlementResult[] = [];

    const remainingDebts: BalanceMap = { ...debts };
    const remainingCredits: BalanceMap = { ...credits };

    for (const debtor in remainingDebts) {
      for (const creditor in remainingCredits) {
        if (debtor !== creditor && remainingDebts[debtor] > 0 && remainingCredits[creditor] > 0) {
          const amount = Math.min(remainingDebts[debtor], remainingCredits[creditor]);
          if (amount > 0) {
            transferResults.push({ debtor, creditor, amount: this.fromCents(amount) });
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

  private toCents(amount: number): number {
    return Math.round(amount * 100);
  }

  private fromCents(cents: number): number {
    return Number((cents / 100).toFixed(2));
  }

  private buildShareMessage(): string {
    const appLink = this.getShareAppLink();
    const expenseLines = this.expenseItems.map((item) =>
      `• ${item.description}: ${this.formatCurrency(item.amount)} (${this.t('sharePaidBy')}: ${item.paidBy})`
    );

    const lines: string[] = [
      'dividimos? 💸',
      '',
      `👥 ${this.people.length} ${this.t('participants')}`,
      '🧾 Gastos:',
      ...expenseLines,
      `💰 ${this.t('shareTotal')}: ${this.formatCurrency(this.totalExpense)}`,
      `🧮 ${this.t('averagePerPerson')} ${this.formatCurrency(this.averageSpent)}`,
      '',
      '🔁 Transferencias:'
    ];

    if (this.results.length > 0) {
      this.results.forEach((result) => {
        lines.push(`• ${result.debtor} ${this.t('owesToInline')} ${result.creditor}: ${this.formatCurrency(result.amount)}`);
      });
    } else {
      lines.push(this.t('shareAllSettled'));
    }

    lines.push('');
    lines.push(`Hecho con --> ${appLink}`);

    return lines.join('\n');
  }

  private getShareAppLink(): string {
    return this.publicAppUrl;
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
      workflowStage: this.workflowStage,
      hasUnlockedExpenses: this.hasUnlockedExpenses,
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
    this.workflowStage = snapshot.workflowStage;
    this.hasUnlockedExpenses = snapshot.hasUnlockedExpenses;
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
