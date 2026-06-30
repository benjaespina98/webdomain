import { Component, HostListener, OnInit } from '@angular/core';
import { PersistenceService, AppState } from '../services/persistence.service';
import { ShareService, SharePayload } from '../services/share.service';
import { AnalyticsService } from '../services/analytics.service';

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
  addPersonLabel: string;
  addButton: string;
  personPlaceholder: string;
  noParticipantsYet: string;
  expenseDescriptionLabel: string;
  expenseDescriptionPlaceholder: string;
  totalAmountLabel: string;
  amountPlaceholder: string;
  whoPaidLabel: string;
  selectPlaceholder: string;
  whoParticipates: string;
  selectAll: string;
  clearSelection: string;
  payerNotIncluded: string;
  addExpenseButton: string;
  clearAll: string;
  clearAllTitle: string;
  shareWhatsapp: string;
  registeredExpenses: string;
  description: string;
  amount: string;
  paidBy: string;
  participantsColumn: string;
  allParticipants: string;
  actions: string;
  deleteExpense: string;
  deleteParticipantTitle: string;
  deleteExpenseTitle: string;
  results: string;
  info: string;
  totalExpense: string;
  averagePerPerson: string;
  allSettled: string;
  enterValidName: string;
  personAlreadyExists: string;
  noExpensesToShare: string;
  enterExpenseDescription: string;
  enterValidAmount: string;
  selectWhoPaid: string;
  addParticipantsToSplit: string;
  shareTotal: string;
  shareTransfersTitle: string;
  shareAllSettled: string;
  shareGeneratedWith: string;
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
  dismissNotice: string;
  undoApplied: string;
  confirmClearAll: string;
  confirmRemovePerson: string;
  confirmRemoveExpense: string;
  nothingToClear: string;
  whatsappOpened: string;
  copyLink: string;
  copyDone: string;
  linkCopied: string;
  clipboardUnavailable: string;
  splitModeAll: string;
  splitModeCustom: string;
  splitAllHelp: string;
  splitCustomHelp: string;
  workflowStepParticipants: string;
  workflowStepExpenses: string;
  workflowStepResults: string;
  continueToExpenses: string;
  backToParticipants: string;
  backToExpenses: string;
  viewResults: string;
  readyToCalculate: string;
  addExpenseToContinue: string;
  confirmAction: string;
  cancelAction: string;
  editingExpenseBanner: string;
  saveChangesButton: string;
  editExpense: string;
  expenseEdited: string;
  sharePays: string;
  shareTo: string;
  sharePaymentsHeader: string;
  showExpenseDetail: string;
  hideExpenseDetail: string;
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
export class SplitComponent implements OnInit {
  private readonly languageStorageKey = 'split-language';
  private readonly publicAppUrl = 'https://dividimos.vercel.app/';
  private readonly translations: Record<LanguageCode, TranslationMap> = {
    es: {
      detail: 'Detalle',
      appSubtitle: 'sumá personas, cargá gastos y resolvé quién le paga a quién en un toque.',
      participants: 'Personas',
      addPersonLabel: 'Agregar personas:',
      addButton: 'Agregar',
      personPlaceholder: 'Ej: Juan',
      noParticipantsYet: 'todavía no sumaste personas.',
      expenseDescriptionLabel: 'Descripción del gasto:',
      expenseDescriptionPlaceholder: 'Ej: Cena, Nafta, Uber',
      totalAmountLabel: 'Monto total:',
      amountPlaceholder: 'Ej: $ 15000',
      whoPaidLabel: '¿Quién pagó?',
      selectPlaceholder: 'Seleccionar...',
      whoParticipates: '¿Quiénes entran en este gasto?',
      selectAll: 'Seleccionar todos',
      clearSelection: 'Borrar selección',
      payerNotIncluded: 'pagó, pero no está incluido en el reparto.',
      addExpenseButton: 'Sumar gasto',
      clearAll: 'Limpiar todo',
      clearAllTitle: 'Borra participantes y gastos',
      shareWhatsapp: 'Compartir por WhatsApp',
      registeredExpenses: 'Gastos cargados',
      description: 'Descripción',
      amount: 'Monto',
      paidBy: 'Pagado por',
      participantsColumn: 'Participantes',
      allParticipants: 'Todos',
      actions: 'Acciones',
      deleteExpense: 'Eliminar',
      deleteParticipantTitle: 'Eliminar participante',
      deleteExpenseTitle: 'Eliminar gasto',
      results: 'Resultados',
      info: 'Información',
      totalExpense: 'Gasto Total:',
      averagePerPerson: 'Promedio por persona:',
      allSettled: '✅ Todo saldado. No hay pagos pendientes.',
      enterValidName: 'por favor, ingresá un nombre válido',
      personAlreadyExists: 'Esta persona ya está en la lista',
      noExpensesToShare: 'No hay gastos para compartir',
      enterExpenseDescription: 'Por favor, ingresa una descripción del gasto',
      enterValidAmount: 'Por favor, ingresa un monto válido',
      selectWhoPaid: 'por favor, seleccioná quién pagó',
      addParticipantsToSplit: 'por favor, sumá personas para dividir el gasto',
      shareTotal: 'Total',
      shareTransfersTitle: 'Pagos sugeridos',
      shareAllSettled: 'Todo saldado, no quedan pagos pendientes.',
      shareGeneratedWith: 'Calculado con dividimos?',
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
      dismissNotice: 'Cerrar aviso',
      undoApplied: 'Cambio deshecho',
      confirmClearAll: '¿Seguro que querés borrar participantes y gastos?',
      confirmRemovePerson: '¿Eliminar este participante y sus gastos relacionados?',
      confirmRemoveExpense: '¿Eliminar este gasto?',
      nothingToClear: 'No hay datos para limpiar',
      whatsappOpened: 'WhatsApp abierto',
      copyLink: 'Copiar enlace',
      copyDone: 'Copiado',
      linkCopied: 'Enlace copiado al portapapeles',
      clipboardUnavailable: 'No se pudo copiar automáticamente. Copiá el texto manualmente.',
      splitModeAll: 'Dividir entre todos',
      splitModeCustom: 'Elegir personas',
      splitAllHelp: 'este gasto se divide en partes iguales entre todas las personas cargadas.',
      splitCustomHelp: 'elegí quiénes entran en este gasto.',
      workflowStepParticipants: 'Paso 1: Personas',
      workflowStepExpenses: 'Paso 2: Gastos',
      workflowStepResults: 'Paso 3: Resultados',
      continueToExpenses: 'Seguir a gastos',
      backToParticipants: 'Volver a personas',
      backToExpenses: 'Volver a gastos',
      viewResults: 'Calcular / Ver resultados',
      readyToCalculate: 'Ya podés calcular el resultado.',
      addExpenseToContinue: 'Cargá al menos un gasto para pasar al paso 3.',
      confirmAction: 'Confirmar',
      cancelAction: 'Cancelar',
      editingExpenseBanner: 'Editando gasto',
      saveChangesButton: 'Guardar cambios',
      editExpense: 'Editar',
      expenseEdited: 'Gasto modificado',
      sharePays: 'le paga',
      shareTo: 'a',
      sharePaymentsHeader: 'Así queda:',
      showExpenseDetail: 'Ver detalle de gastos',
      hideExpenseDetail: 'Ocultar detalle'
    },
    en: {
      detail: 'Detail',
      appSubtitle: 'Add people, enter expenses, and quickly see who owes whom.',
      participants: 'people',
      addPersonLabel: 'Add person:',
      addButton: 'Add',
      personPlaceholder: 'Ex: John',
      noParticipantsYet: 'You have not added participants yet.',
      expenseDescriptionLabel: 'Expense description:',
      expenseDescriptionPlaceholder: 'Ex: Dinner, Fuel, Uber',
      totalAmountLabel: 'Total amount:',
      amountPlaceholder: 'Ex: $ 15000',
      whoPaidLabel: 'Who paid?',
      selectPlaceholder: 'Select...',
      whoParticipates: 'Who is included in this expense?',
      selectAll: 'Select all',
      clearSelection: 'Clear selection',
      payerNotIncluded: 'paid, but is not included in the split.',
      addExpenseButton: 'Add Expense',
      clearAll: 'Clear All',
      clearAllTitle: 'Deletes participants and expenses',
      shareWhatsapp: 'Share on WhatsApp',
      registeredExpenses: 'Registered Expenses',
      description: 'Description',
      amount: 'Amount',
      paidBy: 'Paid by',
      participantsColumn: 'Participants',
      allParticipants: 'All',
      actions: 'Actions',
      deleteExpense: 'Delete',
      deleteParticipantTitle: 'Delete participant',
      deleteExpenseTitle: 'Delete expense',
      results: 'Results',
      info: 'Information',
      totalExpense: 'Total Expense:',
      averagePerPerson: 'Average per person:',
      allSettled: '✅ All settled. No pending payments.',
      enterValidName: 'Please enter a valid name',
      personAlreadyExists: 'This person is already in the list',
      noExpensesToShare: 'There are no expenses to share',
      enterExpenseDescription: 'Please enter an expense description',
      enterValidAmount: 'Please enter a valid amount',
      selectWhoPaid: 'Please select who paid',
      addParticipantsToSplit: 'Please add participants to split the expense',
      shareTotal: 'Total',
      shareTransfersTitle: 'Suggested payments',
      shareAllSettled: 'Everything is settled, no pending payments.',
      shareGeneratedWith: 'Calculated with dividimos?',
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
      dismissNotice: 'Dismiss notification',
      undoApplied: 'Change undone',
      confirmClearAll: 'Are you sure you want to delete participants and expenses?',
      confirmRemovePerson: 'Delete this participant and related expenses?',
      confirmRemoveExpense: 'Delete this expense?',
      nothingToClear: 'There is no data to clear',
      whatsappOpened: 'WhatsApp opened',
      copyLink: 'Copy link',
      copyDone: 'Copied',
      linkCopied: 'Link copied to clipboard',
      clipboardUnavailable: 'Could not copy automatically. Please copy the text manually.',
      splitModeAll: 'Split equally',
      splitModeCustom: 'Choose people',
      splitAllHelp: 'The expense will be divided equally among all registered participants.',
      splitCustomHelp: 'Choose who takes part in this expense.',
      workflowStepParticipants: 'Step 1: Participants',
      workflowStepExpenses: 'Step 2: Expenses',
      workflowStepResults: 'Step 3: Results',
      continueToExpenses: 'Continue to expenses',
      backToParticipants: 'Back to participants',
      backToExpenses: 'Back to expenses',
      viewResults: 'Calculate / View results',
      readyToCalculate: 'You can now calculate the result.',
      addExpenseToContinue: 'Add at least one expense to continue to step 3.',
      confirmAction: 'Confirm',
      cancelAction: 'Cancel',
      editingExpenseBanner: 'Editing expense',
      saveChangesButton: 'Save changes',
      editExpense: 'Edit',
      expenseEdited: 'Expense updated',
      sharePays: 'pays',
      shareTo: 'to',
      sharePaymentsHeader: 'Payments:',
      showExpenseDetail: 'View expense detail',
      hideExpenseDetail: 'Hide detail'
    }
  };

  currentLanguage: LanguageCode = 'es';
  uiNotice = '';
  uiNoticeType: 'success' | 'info' | 'warning' = 'info';
  canUndoLastAction = false;
  isCopyLinkDone = false;
  private lastSnapshot: AppSnapshot | null = null;
  private noticeTimer: ReturnType<typeof setTimeout> | null = null;
  private copyLinkFeedbackTimer: ReturnType<typeof setTimeout> | null = null;

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
  editingExpenseId: number | null = null;
  pendingConfirm: { message: string; action: () => void } | null = null;
  showExpenseDetail = false;

  constructor(
    private readonly persistenceService: PersistenceService,
    private readonly shareService: ShareService,
    private readonly analyticsService: AnalyticsService
  ) {
    this.initializeLanguage();
  }

  ngOnInit(): void {
    this.restorePersistedState();
  }

  private restorePersistedState(): void {
    const saved = this.persistenceService.loadState();
    if (!saved) {
      return;
    }

    this.people = [...saved.people];
    this.expenseItems = [...saved.expenseItems];
    this.newPersonName = saved.newPersonName;
    this.newExpenseDescription = saved.newExpenseDescription;
    this.newExpenseAmount = saved.newExpenseAmount;
    this.newExpensePaidBy = saved.newExpensePaidBy;
    this.splitMode = saved.splitMode;
    this.selectedParticipants = [...saved.selectedParticipants];
    this.nextExpenseId = saved.nextExpenseId;
    this.workflowStage = saved.workflowStage;
    this.hasUnlockedExpenses = saved.hasUnlockedExpenses;

    if (saved.currentLanguage === 'es' || saved.currentLanguage === 'en') {
      this.currentLanguage = saved.currentLanguage;
      localStorage.setItem(this.languageStorageKey, this.currentLanguage);
      document.documentElement.setAttribute('lang', this.currentLanguage);
    }

    this.calculateAdvancedShares();
  }

  private persistCurrentState(): void {
    const state: Omit<AppState, 'schemaVersion'> = {
      people: this.people,
      expenseItems: this.expenseItems,
      newPersonName: this.newPersonName,
      newExpenseDescription: this.newExpenseDescription,
      newExpenseAmount: this.newExpenseAmount,
      newExpensePaidBy: this.newExpensePaidBy,
      splitMode: this.splitMode,
      selectedParticipants: this.selectedParticipants,
      nextExpenseId: this.nextExpenseId,
      workflowStage: this.workflowStage,
      hasUnlockedExpenses: this.hasUnlockedExpenses,
      currentLanguage: this.currentLanguage
    };

    this.persistenceService.saveState(state);
  }

  t(key: keyof TranslationMap): string {
    return this.translations[this.currentLanguage][key];
  }

  setLanguage(language: LanguageCode): void {
    this.currentLanguage = language;
    localStorage.setItem(this.languageStorageKey, language);
    document.documentElement.setAttribute('lang', language);
    const languageMessage = language === 'es' ? this.t('languageChangedEs') : this.t('languageChangedEn');
    this.showNotice(languageMessage, 'info');
    this.persistCurrentState();
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
      this.showNotice(this.t('enterValidName'), 'warning');
      return;
    }

    if (this.people.includes(cleanPersonName)) {
      this.showNotice(this.t('personAlreadyExists'), 'warning');
      return;
    }

    this.people.push(cleanPersonName);
    this.newPersonName = '';
    this.workflowStage = 'participants';
    this.showNotice(this.t('personAdded'), 'success');

    if (this.selectedParticipants.length === 0) {
      this.selectAllParticipants();
    }

    this.persistCurrentState();
    this.analyticsService.track('participant_added');
  }

  removePerson(person: string): void {
    this.showConfirm(this.t('confirmRemovePerson'), () => {
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
    });
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
    this.analyticsService.track('results_generated');
  }

  onStepClick(stage: 'participants' | 'expenses' | 'results'): void {
    if (stage === this.workflowStage) {
      return;
    }
    this.setWorkflowStage(stage);
    this.persistCurrentState();
  }

  toggleExpenseDetail(): void {
    this.showExpenseDetail = !this.showExpenseDetail;
  }

  isPayerIncludedInParticipants(): boolean {
    if (!this.newExpensePaidBy) {
      return true;
    }

    return this.selectedParticipants.includes(this.newExpensePaidBy);
  }

  shareWhatsApp(): void {
    if (this.expenseItems.length === 0) {
      this.showNotice(this.t('noExpensesToShare'), 'warning');
      return;
    }
    const message = this.buildShareMessage();

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;

    const link = document.createElement('a');
    link.href = whatsappUrl;
    link.target = '_blank';
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.showNotice(this.t('whatsappOpened'), 'success');
    this.analyticsService.track('share_clicked');
  }

  async copyShareLink(): Promise<void> {
    if (this.expenseItems.length === 0) {
      this.showNotice(this.t('noExpensesToShare'), 'warning');
      return;
    }

    const copied = await this.copyTextToClipboard(this.getShareAppLink());

    if (copied) {
      this.triggerCopyFeedback();
      this.showNotice(this.t('linkCopied'), 'success');
      this.analyticsService.track('summary_copied');
    } else {
      this.showNotice(this.t('clipboardUnavailable'), 'warning');
    }
  }

  private async copyTextToClipboard(text: string): Promise<boolean> {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }

      throw new Error('Clipboard API unavailable');
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = text;
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
      return copied;
    }
  }

  private triggerCopyFeedback(): void {
    this.isCopyLinkDone = true;
    if (this.copyLinkFeedbackTimer) {
      clearTimeout(this.copyLinkFeedbackTimer);
    }

    this.copyLinkFeedbackTimer = setTimeout(() => {
      this.isCopyLinkDone = false;
      this.copyLinkFeedbackTimer = null;
    }, 1800);
  }

  addExpenseItem(): void {
    if (!this.newExpenseDescription.trim()) {
      this.showNotice(this.t('enterExpenseDescription'), 'warning');
      return;
    }
    
    if (this.newExpenseAmount === null || this.newExpenseAmount <= 0) {
      this.showNotice(this.t('enterValidAmount'), 'warning');
      return;
    }

    if (!this.newExpensePaidBy) {
      this.showNotice(this.t('selectWhoPaid'), 'warning');
      return;
    }

    if (this.splitMode === 'all') {
      this.selectAllParticipants();
    } else if (this.splitMode === 'custom' && this.selectedParticipants.length === 0) {
      this.showNotice(this.t('addParticipantsToSplit'), 'warning');
      return;
    }

    if (this.editingExpenseId !== null) {
      this.saveSnapshotForUndo();
      const index = this.expenseItems.findIndex(item => item.id === this.editingExpenseId);
      if (index !== -1) {
        this.expenseItems[index] = {
          id: this.editingExpenseId,
          description: this.newExpenseDescription.trim(),
          amount: this.newExpenseAmount,
          paidBy: this.newExpensePaidBy,
          participants: [...this.selectedParticipants]
        };
        this.showNotice(this.t('expenseEdited'), 'success');
      }
      this.editingExpenseId = null;
    } else {
      const newExpense: ExpenseItem = {
        id: this.nextExpenseId++,
        description: this.newExpenseDescription.trim(),
        amount: this.newExpenseAmount,
        paidBy: this.newExpensePaidBy,
        participants: [...this.selectedParticipants]
      };
      this.expenseItems.push(newExpense);
      this.showNotice(this.t('expenseAdded'), 'success');
      this.analyticsService.track('expense_added');
    }

    this.newExpenseDescription = '';
    this.newExpenseAmount = null;
    this.newExpensePaidBy = '';
    this.selectAllParticipants();
    this.splitMode = 'all';

    this.calculateAdvancedShares();
    this.hasUnlockedExpenses = true;
  }

  removeExpenseItem(expenseId: number): void {
    this.showConfirm(this.t('confirmRemoveExpense'), () => {
      this.saveSnapshotForUndo();
      this.expenseItems = this.expenseItems.filter((item) => item.id !== expenseId);
      this.calculateAdvancedShares();

      if (this.expenseItems.length === 0) {
        this.workflowStage = this.people.length > 0 ? 'expenses' : 'participants';
      }

      if (this.editingExpenseId === expenseId) {
        this.cancelExpenseEdit();
      }

      this.showNotice(this.t('expenseRemoved'), 'warning', true);
    });
  }

  startExpenseEdit(item: ExpenseItem): void {
    this.editingExpenseId = item.id;
    this.newExpenseDescription = item.description;
    this.newExpenseAmount = item.amount;
    this.newExpensePaidBy = item.paidBy;
    this.selectedParticipants = [...item.participants];
    
    const areAllIncluded = this.people.length > 0 &&
      item.participants.length === this.people.length &&
      this.people.every(p => item.participants.includes(p));
    this.splitMode = areAllIncluded ? 'all' : 'custom';

    document.getElementById('expenseDescription')?.focus();
  }

  cancelExpenseEdit(): void {
    this.editingExpenseId = null;
    this.newExpenseDescription = '';
    this.newExpenseAmount = null;
    this.newExpensePaidBy = '';
    this.selectAllParticipants();
    this.splitMode = 'all';
  }

  showConfirm(message: string, action: () => void): void {
    this.pendingConfirm = { message, action };
  }

  acceptConfirm(): void {
    if (this.pendingConfirm) {
      this.pendingConfirm.action();
      this.pendingConfirm = null;
    }
  }

  cancelConfirm(): void {
    this.pendingConfirm = null;
  }

  calculateAdvancedShares(): void {
    if (this.people.length === 0 || this.expenseItems.length === 0) {
      this.resetResults();
      this.persistCurrentState();
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
    this.persistCurrentState();
  }

  clearAll(): void {
    if (this.people.length === 0 && this.expenseItems.length === 0) {
      this.showNotice(this.t('nothingToClear'), 'info');
      return;
    }

    this.showConfirm(this.t('confirmClearAll'), () => {
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
      this.editingExpenseId = null;

      this.resetResults();
      this.persistenceService.clearState();
      this.showNotice(this.t('allCleared'), 'warning', true);
      this.analyticsService.track('session_cleared');
    });
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

  formatExpenseParticipants(expenseItem: ExpenseItem): string {
    if (expenseItem.participants.length === 0) {
      return '-';
    }

    if (this.people.length > 0 && this.areAllPeopleIncluded(expenseItem.participants)) {
      return this.t('allParticipants');
    }

    return expenseItem.participants.join(', ');
  }

  private areAllPeopleIncluded(participants: string[]): boolean {
    return this.people.length > 0
      && participants.length === this.people.length
      && this.people.every((person) => participants.includes(person));
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
    const peopleList = this.people.join(', ');

    const lines: string[] = [
      '🧾 *dividimos?*',
      '',
      `👥 ${peopleList}`,
      `💰 ${this.t('shareTotal')}: ${this.formatCurrency(this.totalExpense)}`,
      ''
    ];

    if (this.results.length > 0) {
      lines.push(`💸 *${this.t('sharePaymentsHeader')}*`);
      this.results.forEach((result) => {
        lines.push(`• ${result.debtor} ${this.t('sharePays')} *${this.formatCurrency(result.amount)}* ${this.t('shareTo')} ${result.creditor}`);
      });
    } else {
      lines.push(`✅ *${this.t('shareAllSettled')}*`);
    }

    lines.push('');
    lines.push(`📲 ${this.t('shareGeneratedWith')}`);
    lines.push(appLink);

    return lines.join('\n');
  }

  private getShareAppLink(): string {
    const allPeople = new Set(this.people);
    const payload: SharePayload = {
      p: this.people,
      e: this.expenseItems.map((item) => {
        const isAllPeople =
          item.participants.length === this.people.length &&
          item.participants.every((p) => allPeople.has(p));
        return {
          i: item.id,
          d: item.description,
          a: item.amount,
          b: item.paidBy,
          ...(isAllPeople ? {} : { r: item.participants })
        };
      }),
      l: this.currentLanguage
    };

    try {
      return this.shareService.buildShareUrl(payload);
    } catch {
      return this.publicAppUrl;
    }
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
      document.documentElement.setAttribute('lang', savedLanguage);
      return;
    }

    this.currentLanguage = this.detectDeviceLanguage();
    document.documentElement.setAttribute('lang', this.currentLanguage);
  }

  private detectDeviceLanguage(): LanguageCode {
    const browserLanguage = (navigator.languages?.[0] ?? navigator.language ?? 'es').toLowerCase();
    return browserLanguage.startsWith('es') ? 'es' : 'en';
  }
}
