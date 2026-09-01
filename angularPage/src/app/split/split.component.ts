import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, effect } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { PersistenceService } from '../services/persistence.service';
import { ShareService, SharePayload } from '../services/share.service';
import { AnalyticsService } from '../services/analytics.service';
import { LanguageService, LanguageCode } from '../services/language.service';
import { VoiceInputService } from '../services/voice-input.service';
import { SplitStateService } from '../services/split-state.service';
import { CURRENCY_OPTIONS, CurrencySymbol, ExpenseItem, SettlementResult, SplitMode } from '../models/expense.model';

type NoticeType = 'success' | 'info' | 'warning';

interface TranslationMap {
  peopleTitle: string;
  personPlaceholder: string;
  addPerson: string;
  addButton: string;
  emptyPeople: string;
  removePerson: string;
  expenseTitle: string;
  expensePlaceholder: string;
  amountPlaceholder: string;
  paidBy: string;
  selectPlaceholder: string;
  splitBetween: string;
  splitModeAll: string;
  splitModeCustom: string;
  selectAll: string;
  selectNone: string;
  payerNotIncluded: string;
  addExpense: string;
  saveChanges: string;
  cancel: string;
  edit: string;
  remove: string;
  expensesTitle: string;
  emptyExpenses: string;
  editingExpense: string;
  everyone: string;
  paidByShort: string;
  resultsTitle: string;
  totalSpent: string;
  perPerson: string;
  allSettled: string;
  settlementsTitle: string;
  clearAll: string;
  currencyAria: string;
  copyLink: string;
  copied: string;
  linkCopied: string;
  clipboardUnavailable: string;
  shareWhatsapp: string;
  whatsappOpened: string;
  noExpensesToShare: string;
  shareTotal: string;
  shareAllSettled: string;
  shareGeneratedWith: string;
  shareLinkHint: string;
  sharePays: string;
  shareTo: string;
  sharePaymentsHeader: string;
  shareLinkError: string;
  enterValidName: string;
  personAlreadyExists: string;
  enterExpenseDescription: string;
  enterValidAmount: string;
  selectWhoPaid: string;
  addParticipantsToSplit: string;
  personAdded: string;
  personRemoved: string;
  expenseAdded: string;
  expenseRemoved: string;
  expenseEdited: string;
  allCleared: string;
  nothingToClear: string;
  undo: string;
  undoApplied: string;
  dismissNotice: string;
  confirmTitle: string;
  confirmClearAll: string;
  confirmClear: string;
  confirmImportTitle: string;
  confirmImportMessage: string;
  confirmImportAccept: string;
  shareImported: string;
  languageAria: string;
  homeAria: string;
  sharedViewBanner: string;
  importAndEdit: string;
  staleSessionBanner: string;
  staleSessionContinue: string;
  staleSessionDiscard: string;
  voiceStart: string;
  voiceListening: string;
  voiceHint: string;
  voiceNotUnderstood: string;
  voiceDenied: string;
  voiceError: string;
  voiceFilled: string;
  peopleFirst: string;
}

interface PendingConfirm {
  title: string;
  message: string;
  acceptLabel: string;
  action: () => void;
}

interface AppSnapshot {
  people: string[];
  expenseItems: ExpenseItem[];
  newExpenseDescription: string;
  newExpenseAmount: number | null;
  newExpensePaidBy: string;
  splitMode: SplitMode;
  selectedParticipants: string[];
  nextExpenseId: number;
  editingExpenseId: number | null;
  currency: CurrencySymbol;
}

@Component({
  selector: 'app-split',
  templateUrl: './split.component.html',
  styleUrls: ['./split.component.scss']
})
export class SplitComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly publicAppUrl = 'https://dividimos.vercel.app/';
  private readonly staleSessionDaysThreshold = 7;
  /** Duración de la transición de salida en la lista de personas/gastos (ver `.removing` en el SCSS). */
  private readonly removeAnimationMs = 180;

  private readonly translations: Record<LanguageCode, TranslationMap> = {
    es: {
      peopleTitle: 'Personas',
      personPlaceholder: 'Sumar persona',
      addPerson: 'Agregar persona',
      addButton: 'Agregar',
      emptyPeople: 'Empezá sumando a las personas del grupo',
      removePerson: 'Quitar',
      expenseTitle: 'Nuevo gasto',
      expensePlaceholder: 'Cena, nafta, Uber…',
      amountPlaceholder: 'Monto',
      paidBy: 'Pagó',
      selectPlaceholder: '¿Quién pagó?',
      splitBetween: 'Se divide entre',
      splitModeAll: 'Todos',
      splitModeCustom: 'Elegir',
      selectAll: 'Marcar todos',
      selectNone: 'Limpiar',
      payerNotIncluded: 'pagó pero no entra en el reparto',
      addExpense: 'Sumar gasto',
      saveChanges: 'Guardar',
      cancel: 'Cancelar',
      edit: 'Editar',
      remove: 'Eliminar',
      expensesTitle: 'Gastos',
      emptyExpenses: 'Todavía no cargaste gastos',
      editingExpense: 'Editando gasto',
      everyone: 'Todos',
      paidByShort: 'Pagó',
      resultsTitle: 'Resultados',
      totalSpent: 'Gasto total',
      perPerson: 'Promedio por persona',
      allSettled: 'Todo saldado, no hay pagos pendientes',
      settlementsTitle: 'Quién le paga a quién',
      clearAll: 'Empezar de nuevo',
      currencyAria: 'Elegir moneda',
      copyLink: 'Copiar enlace',
      copied: 'Copiado',
      linkCopied: 'Enlace copiado',
      clipboardUnavailable: 'No se pudo copiar. Copiá el enlace manualmente.',
      shareWhatsapp: 'Compartir por WhatsApp',
      whatsappOpened: 'WhatsApp abierto',
      noExpensesToShare: 'No hay gastos para compartir',
      shareTotal: 'Total',
      shareAllSettled: 'Todo saldado 😎 no quedan cuentas pendientes.',
      shareGeneratedWith: 'Hecho con dividimos? 🤙',
      shareLinkHint: 'Tocá el link para ver todos los gastos 👆',
      sharePays: 'le paga',
      shareTo: 'a',
      sharePaymentsHeader: 'quién le paga a quién 👇',
      shareLinkError: 'Ese enlace no es válido o es de una versión anterior',
      enterValidName: 'Escribí un nombre',
      personAlreadyExists: 'Esa persona ya está en la lista',
      enterExpenseDescription: 'Falta el nombre del gasto',
      enterValidAmount: 'Falta un monto válido',
      selectWhoPaid: 'Falta indicar quién pagó',
      addParticipantsToSplit: 'Elegí al menos una persona',
      personAdded: 'Persona agregada',
      personRemoved: 'Persona eliminada',
      expenseAdded: 'Gasto agregado',
      expenseRemoved: 'Gasto eliminado',
      expenseEdited: 'Gasto modificado',
      allCleared: 'Se borró todo',
      nothingToClear: 'No hay nada para borrar',
      undo: 'Deshacer',
      undoApplied: 'Cambio deshecho',
      dismissNotice: 'Cerrar aviso',
      confirmTitle: '¿Empezar un evento nuevo?',
      confirmClearAll: 'Se van a borrar todos los participantes y gastos de esta sesión. Esta acción no se puede deshacer.',
      confirmClear: 'Sí, empezar de nuevo',
      confirmImportTitle: 'Reemplazar tu sesión',
      confirmImportMessage: 'Abriste un enlace compartido, pero ya tenés datos cargados. Si continuás, se reemplaza todo lo actual por la información compartida.',
      confirmImportAccept: 'Sí, reemplazar',
      shareImported: 'Sesión compartida importada',
      languageAria: 'Cambiar idioma',
      homeAria: 'Ir al inicio',
      sharedViewBanner: 'Estás viendo una sesión compartida',
      importAndEdit: 'Editar una copia',
      staleSessionBanner: 'Retomaste una sesión de hace {{days}} días.',
      staleSessionContinue: 'Continuar',
      staleSessionDiscard: 'Empezar de nuevo',
      voiceStart: 'Dictar gasto',
      voiceListening: 'Escuchando…',
      voiceHint: 'Probá: «Ana pagó 12500 de cena»',
      voiceNotUnderstood: 'No entendí el gasto. Probá: «Ana pagó 12500 de cena»',
      voiceDenied: 'Necesito permiso del micrófono para dictar',
      voiceError: 'No se pudo usar el micrófono',
      voiceFilled: 'Listo, revisá y confirmá',
      peopleFirst: 'Sumá personas antes de dictar'
    },
    en: {
      peopleTitle: 'People',
      personPlaceholder: 'Add person',
      addPerson: 'Add person',
      addButton: 'Add',
      emptyPeople: 'Start by adding the people in the group',
      removePerson: 'Remove',
      expenseTitle: 'New expense',
      expensePlaceholder: 'Dinner, fuel, Uber…',
      amountPlaceholder: 'Amount',
      paidBy: 'Paid by',
      selectPlaceholder: 'Who paid?',
      splitBetween: 'Split between',
      splitModeAll: 'Everyone',
      splitModeCustom: 'Pick',
      selectAll: 'Select all',
      selectNone: 'Clear',
      payerNotIncluded: 'paid but is not part of the split',
      addExpense: 'Add expense',
      saveChanges: 'Save',
      cancel: 'Cancel',
      edit: 'Edit',
      remove: 'Delete',
      expensesTitle: 'Expenses',
      emptyExpenses: 'No expenses added yet',
      editingExpense: 'Editing expense',
      everyone: 'Everyone',
      paidByShort: 'Paid by',
      resultsTitle: 'Results',
      totalSpent: 'Total spent',
      perPerson: 'Average per person',
      allSettled: 'All settled, no pending payments',
      settlementsTitle: 'Who pays whom',
      clearAll: 'Start over',
      currencyAria: 'Choose currency',
      copyLink: 'Copy link',
      copied: 'Copied',
      linkCopied: 'Link copied',
      clipboardUnavailable: 'Could not copy. Please copy the link manually.',
      shareWhatsapp: 'Share on WhatsApp',
      whatsappOpened: 'WhatsApp opened',
      noExpensesToShare: 'There are no expenses to share',
      shareTotal: 'Total',
      shareAllSettled: 'All settled 😎 no pending payments.',
      shareGeneratedWith: 'Made with dividimos? 🤙',
      shareLinkHint: 'Tap the link to see all expenses 👆',
      sharePays: 'pays',
      shareTo: 'to',
      sharePaymentsHeader: 'who pays whom 👇',
      shareLinkError: 'That link is invalid or from an older version',
      enterValidName: 'Type a name',
      personAlreadyExists: 'That person is already on the list',
      enterExpenseDescription: 'The expense name is missing',
      enterValidAmount: 'A valid amount is missing',
      selectWhoPaid: 'Select who paid',
      addParticipantsToSplit: 'Pick at least one person',
      personAdded: 'Person added',
      personRemoved: 'Person removed',
      expenseAdded: 'Expense added',
      expenseRemoved: 'Expense deleted',
      expenseEdited: 'Expense updated',
      allCleared: 'Everything was cleared',
      nothingToClear: 'There is nothing to clear',
      undo: 'Undo',
      undoApplied: 'Change undone',
      dismissNotice: 'Dismiss',
      confirmTitle: 'Start a new event?',
      confirmClearAll: 'This will delete every person and expense in this session. This action cannot be undone.',
      confirmClear: 'Yes, start over',
      confirmImportTitle: 'Replace your session',
      confirmImportMessage: 'You opened a shared link, but you already have data loaded. Continuing will replace everything current with the shared info.',
      confirmImportAccept: 'Yes, replace',
      shareImported: 'Shared session imported',
      languageAria: 'Change language',
      homeAria: 'Go to home',
      sharedViewBanner: "You're viewing a shared session",
      importAndEdit: 'Edit a copy',
      staleSessionBanner: 'You picked up a session from {{days}} days ago.',
      staleSessionContinue: 'Continue',
      staleSessionDiscard: 'Start fresh',
      voiceStart: 'Dictate expense',
      voiceListening: 'Listening…',
      voiceHint: 'Try: "Ana paid 120 for dinner"',
      voiceNotUnderstood: 'I did not catch the expense. Try: "Ana paid 120 for dinner"',
      voiceDenied: 'I need microphone permission to dictate',
      voiceError: 'Could not use the microphone',
      voiceFilled: 'Done, review and confirm',
      peopleFirst: 'Add people before dictating'
    }
  };

  @ViewChild('newPersonInput') private newPersonInput?: ElementRef<HTMLInputElement>;
  @ViewChild('expenseDescriptionInput') private expenseDescriptionInput?: ElementRef<HTMLInputElement>;

  readonly currencyOptions = CURRENCY_OPTIONS;

  editingExpenseId: number | null = null;

  uiNotice = '';
  uiNoticeType: NoticeType = 'info';
  canUndoLastAction = false;
  isCopyLinkDone = false;
  pendingConfirm: PendingConfirm | null = null;
  showStaleSessionBanner = false;
  staleSessionDays = 0;

  isListening = false;
  voiceTranscript = '';

  /** Personas/gastos en pleno fade-out: el template les agrega `.removing` mientras el array real todavía no cambió. */
  readonly removingPeople = new Set<string>();
  readonly removingExpenseIds = new Set<number>();

  private lastSnapshot: AppSnapshot | null = null;
  private noticeTimer: ReturnType<typeof setTimeout> | null = null;
  private copyLinkFeedbackTimer: ReturnType<typeof setTimeout> | null = null;
  private voiceSubscription: Subscription | null = null;
  private hasTrackedResults = false;

  constructor(
    private readonly stateService: SplitStateService,
    private readonly persistenceService: PersistenceService,
    private readonly shareService: ShareService,
    private readonly analyticsService: AnalyticsService,
    private readonly languageService: LanguageService,
    private readonly voiceInputService: VoiceInputService,
    private readonly changeDetector: ChangeDetectorRef,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {
    // El motor de liquidación vive en SplitStateService como un `computed()`: se
    // recalcula solo cuando cambian personas o gastos. Este effect solo se ocupa
    // de disparar el evento de analítica la primera vez que hay resultados.
    effect(() => {
      if (!this.hasTrackedResults && this.stateService.settlement().results.length > 0) {
        this.hasTrackedResults = true;
        this.analyticsService.track('results_generated');
      }
    });
  }

  // -------------------------------------------------------- puente con signals
  //
  // El resto del componente (y el template, incluidos los [(ngModel)]) sigue
  // leyendo/escribiendo estas propiedades como campos comunes. Cada asignación
  // termina escribiendo en una signal de SplitStateService, lo que dispara su
  // `effect` de persistencia automática: ya no hace falta llamar a
  // `persistenceService.saveState()` a mano en cada mutador.

  get people(): string[] { return this.stateService.people(); }
  set people(value: string[]) { this.stateService.people.set(value); }

  get expenseItems(): ExpenseItem[] { return this.stateService.expenseItems(); }
  set expenseItems(value: ExpenseItem[]) { this.stateService.expenseItems.set(value); }

  get newPersonName(): string { return this.stateService.newPersonName(); }
  set newPersonName(value: string) { this.stateService.newPersonName.set(value); }

  get newExpenseDescription(): string { return this.stateService.newExpenseDescription(); }
  set newExpenseDescription(value: string) { this.stateService.newExpenseDescription.set(value); }

  get newExpenseAmount(): number | null { return this.stateService.newExpenseAmount(); }
  set newExpenseAmount(value: number | null) { this.stateService.newExpenseAmount.set(value); }

  get newExpensePaidBy(): string { return this.stateService.newExpensePaidBy(); }
  set newExpensePaidBy(value: string) { this.stateService.newExpensePaidBy.set(value); }

  get splitMode(): SplitMode { return this.stateService.splitMode(); }
  set splitMode(value: SplitMode) { this.stateService.splitMode.set(value); }

  get selectedParticipants(): string[] { return this.stateService.selectedParticipants(); }
  set selectedParticipants(value: string[]) { this.stateService.selectedParticipants.set(value); }

  get nextExpenseId(): number { return this.stateService.nextExpenseId(); }
  set nextExpenseId(value: number) { this.stateService.nextExpenseId.set(value); }

  get isSharedView(): boolean { return this.stateService.isSharedView(); }
  set isSharedView(value: boolean) { this.stateService.isSharedView.set(value); }

  get currency(): CurrencySymbol { return this.stateService.currency(); }
  set currency(value: CurrencySymbol) { this.stateService.currency.set(value); }

  /** Derivados del motor de liquidación (`computed()` en SplitStateService): se recalculan solos. */
  get results(): SettlementResult[] { return this.stateService.settlement().results; }
  get totalExpense(): number { return this.stateService.settlement().totalExpense; }
  get averageSpent(): number { return this.stateService.settlement().averageSpent; }

  get currentLanguage(): LanguageCode {
    return this.languageService.current;
  }

  get isVoiceSupported(): boolean {
    return this.voiceInputService.isSupported;
  }

  get hasData(): boolean {
    return this.people.length > 0 || this.expenseItems.length > 0;
  }

  ngOnInit(): void {
    this.restorePersistedState();
    this.handleIncomingShareQueryParams();
  }

  ngAfterViewInit(): void {
    if (!this.isSharedView && this.people.length === 0) {
      setTimeout(() => this.newPersonInput?.nativeElement.focus({ preventScroll: true }));
    }
  }

  ngOnDestroy(): void {
    this.clearTimer(this.noticeTimer);
    this.clearTimer(this.copyLinkFeedbackTimer);
    this.voiceSubscription?.unsubscribe();
  }

  // ---------------------------------------------------------------- i18n

  t(key: keyof TranslationMap): string {
    return this.translations[this.currentLanguage][key];
  }

  setLanguage(language: LanguageCode): void {
    if (language === this.currentLanguage) {
      return;
    }

    this.languageService.set(language);
    this.stateService.currentLanguage.set(language);
  }

  formatCurrency(amount: number): string {
    return this.languageService.formatCurrency(amount, this.currency);
  }

  // ---------------------------------------------------------- persistencia

  private restorePersistedState(): void {
    const saved = this.persistenceService.loadState();
    this.stateService.initialize(saved);

    if (!saved) {
      return;
    }

    if (saved.currentLanguage === 'es' || saved.currentLanguage === 'en') {
      this.languageService.set(saved.currentLanguage);
    }

    // Una sesión vacía (recién abierta, sin datos) no cuenta como "sesión vieja".
    const hasRestoredData = saved.people.length > 0 || saved.expenseItems.length > 0;
    if (saved.savedAt && !saved.isSharedView && hasRestoredData) {
      const days = Math.floor((Date.now() - saved.savedAt) / 86_400_000);
      if (days >= this.staleSessionDaysThreshold) {
        this.staleSessionDays = days;
        this.showStaleSessionBanner = true;
      }
    }
  }

  /**
   * Si venimos de un enlace compartido que entraba en conflicto con una sesión local
   * con datos (ver ShareComponent), acá se pide confirmación explícita antes de
   * aplicar nada: mientras el usuario no acepta, no se toca el estado ni el storage.
   */
  private handleIncomingShareQueryParams(): void {
    const params = this.route.snapshot.queryParamMap;

    if (!params.has('shareError') && !params.has('shareConflict')) {
      return;
    }

    const hadConflict = params.has('shareConflict');
    const conflictData = params.get('data');
    const conflictVersion = Number.parseInt(params.get('v') ?? '0', 10);

    // Limpiamos la URL para que un refresh no repita el aviso ni la importación.
    void this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });

    if (!hadConflict) {
      this.showNotice(this.t('shareLinkError'), 'warning');
      return;
    }

    const payload = conflictData ? this.shareService.parseShareLink(conflictData, conflictVersion) : null;
    if (!payload) {
      this.showNotice(this.t('shareLinkError'), 'warning');
      return;
    }

    this.showConfirm(
      this.t('confirmImportMessage'),
      () => {
        this.stateService.applyState(this.shareService.buildImportedState(payload, this.currentLanguage));
        this.showNotice(this.t('shareImported'), 'success');
      },
      { title: this.t('confirmImportTitle'), acceptLabel: this.t('confirmImportAccept') }
    );
  }

  // ------------------------------------------------------------- personas

  addPerson(): void {
    const cleanPersonName = this.newPersonName.trim().replace(/\s+/g, ' ');

    if (!cleanPersonName) {
      this.showNotice(this.t('enterValidName'), 'warning');
      return;
    }

    if (this.people.some((person) => person.toLocaleLowerCase() === cleanPersonName.toLocaleLowerCase())) {
      this.showNotice(this.t('personAlreadyExists'), 'warning');
      return;
    }

    this.people = [...this.people, cleanPersonName];
    this.newPersonName = '';

    if (this.splitMode === 'all') {
      this.selectAllParticipants();
    }

    this.showNotice(this.t('personAdded'), 'success');
    this.analyticsService.track('participant_added');
    this.newPersonInput?.nativeElement.focus({ preventScroll: true });
  }

  /** Dispara el fade-out del chip; la mutación real de datos se hace en `commitRemovePerson`. */
  removePerson(person: string): void {
    if (this.removingPeople.has(person)) {
      return;
    }

    this.removingPeople.add(person);
    setTimeout(() => {
      this.removingPeople.delete(person);
      this.commitRemovePerson(person);
    }, this.removeAnimationMs);
  }

  /**
   * Quitar a alguien no debería destruir gastos ajenos: el gasto sólo desaparece
   * si esa persona lo pagó o si era el único participante.
   */
  private commitRemovePerson(person: string): void {
    this.saveSnapshotForUndo();

    this.people = this.people.filter((currentPerson) => currentPerson !== person);
    this.selectedParticipants = this.selectedParticipants.filter((participant) => participant !== person);

    if (this.newExpensePaidBy === person) {
      this.newExpensePaidBy = '';
    }

    this.expenseItems = this.expenseItems
      .filter((item) => item.paidBy !== person)
      .map((item) => ({ ...item, participants: item.participants.filter((p) => p !== person) }))
      .filter((item) => item.participants.length > 0);

    if (this.editingExpenseId !== null && !this.expenseItems.some((item) => item.id === this.editingExpenseId)) {
      this.cancelExpenseEdit();
    }

    this.showNotice(this.t('personRemoved'), 'warning', true);
  }

  // -------------------------------------------------------------- reparto

  toggleParticipant(person: string): void {
    this.selectedParticipants = this.isParticipantSelected(person)
      ? this.selectedParticipants.filter((participant) => participant !== person)
      : [...this.selectedParticipants, person];
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
    if (this.newExpensePaidBy && !this.selectedParticipants.includes(this.newExpensePaidBy)) {
      this.selectedParticipants = [...this.selectedParticipants, this.newExpensePaidBy];
    }
  }

  setSplitMode(mode: SplitMode): void {
    this.splitMode = mode;

    if (this.people.length > 0 && (mode === 'all' || this.selectedParticipants.length === 0)) {
      this.selectAllParticipants();
    }
  }

  isPayerIncludedInParticipants(): boolean {
    return !this.newExpensePaidBy || this.selectedParticipants.includes(this.newExpensePaidBy);
  }

  // --------------------------------------------------------------- gastos

  addExpenseItem(): void {
    if (!this.newExpenseDescription.trim()) {
      this.showNotice(this.t('enterExpenseDescription'), 'warning');
      this.expenseDescriptionInput?.nativeElement.focus({ preventScroll: true });
      return;
    }

    if (this.newExpenseAmount === null || !(this.newExpenseAmount > 0)) {
      this.showNotice(this.t('enterValidAmount'), 'warning');
      return;
    }

    if (!this.newExpensePaidBy) {
      this.showNotice(this.t('selectWhoPaid'), 'warning');
      return;
    }

    if (this.splitMode === 'all') {
      this.selectAllParticipants();
    } else if (this.selectedParticipants.length === 0) {
      this.showNotice(this.t('addParticipantsToSplit'), 'warning');
      return;
    }

    const draft = {
      description: this.newExpenseDescription.trim(),
      amount: Math.round(this.newExpenseAmount * 100) / 100,
      paidBy: this.newExpensePaidBy,
      participants: [...this.selectedParticipants]
    };

    if (this.editingExpenseId !== null) {
      this.saveSnapshotForUndo();
      const editingId = this.editingExpenseId;
      this.expenseItems = this.expenseItems.map((item) => (item.id === editingId ? { id: editingId, ...draft } : item));
      this.showNotice(this.t('expenseEdited'), 'success', true);
      this.editingExpenseId = null;
    } else {
      this.expenseItems = [...this.expenseItems, { id: this.nextExpenseId++, ...draft }];
      this.showNotice(this.t('expenseAdded'), 'success');
      this.analyticsService.track('expense_added');
    }

    this.resetExpenseForm();
    this.expenseDescriptionInput?.nativeElement.focus({ preventScroll: true });
  }

  /** Dispara el fade-out del ítem; la mutación real de datos se hace en `commitRemoveExpenseItem`. */
  removeExpenseItem(expenseId: number): void {
    if (this.removingExpenseIds.has(expenseId)) {
      return;
    }

    this.removingExpenseIds.add(expenseId);
    setTimeout(() => {
      this.removingExpenseIds.delete(expenseId);
      this.commitRemoveExpenseItem(expenseId);
    }, this.removeAnimationMs);
  }

  private commitRemoveExpenseItem(expenseId: number): void {
    this.saveSnapshotForUndo();

    this.expenseItems = this.expenseItems.filter((item) => item.id !== expenseId);

    if (this.editingExpenseId === expenseId) {
      this.editingExpenseId = null;
      this.resetExpenseForm();
    }

    this.showNotice(this.t('expenseRemoved'), 'warning', true);
  }

  startExpenseEdit(item: ExpenseItem): void {
    this.editingExpenseId = item.id;
    this.newExpenseDescription = item.description;
    this.newExpenseAmount = item.amount;
    this.newExpensePaidBy = item.paidBy;
    this.selectedParticipants = [...item.participants];
    this.splitMode = this.areAllPeopleIncluded(item.participants) ? 'all' : 'custom';

    setTimeout(() => {
      const input = this.expenseDescriptionInput?.nativeElement;
      input?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      input?.focus({ preventScroll: true });
    });
  }

  cancelExpenseEdit(): void {
    this.editingExpenseId = null;
    this.resetExpenseForm();
  }

  private resetExpenseForm(): void {
    this.newExpenseDescription = '';
    this.newExpenseAmount = null;
    this.newExpensePaidBy = '';
    this.splitMode = 'all';
    this.selectAllParticipants();
  }

  canSubmitExpense(): boolean {
    return this.people.length > 0
      && !!this.newExpenseDescription.trim()
      && this.newExpenseAmount !== null
      && this.newExpenseAmount > 0
      && !!this.newExpensePaidBy
      && (this.splitMode === 'all' || this.selectedParticipants.length > 0);
  }

  formatExpenseParticipants(expenseItem: ExpenseItem): string {
    if (expenseItem.participants.length === 0) {
      return '—';
    }

    if (this.areAllPeopleIncluded(expenseItem.participants)) {
      return this.t('everyone');
    }

    return expenseItem.participants.join(', ');
  }

  private areAllPeopleIncluded(participants: string[]): boolean {
    return this.people.length > 0
      && participants.length === this.people.length
      && this.people.every((person) => participants.includes(person));
  }

  clearAll(): void {
    if (!this.hasData) {
      this.showNotice(this.t('nothingToClear'), 'info');
      return;
    }

    this.showConfirm(this.t('confirmClearAll'), () => {
      this.saveSnapshotForUndo();

      this.people = [];
      this.expenseItems = [];
      this.newPersonName = '';
      this.selectedParticipants = [];
      this.nextExpenseId = 1;
      this.editingExpenseId = null;
      this.isSharedView = false;
      this.resetExpenseForm();

      this.showNotice(this.t('allCleared'), 'warning', true);
      this.analyticsService.track('session_cleared');
      setTimeout(() => this.newPersonInput?.nativeElement.focus({ preventScroll: true }));
    });
  }

  // ------------------------------------------------------------------ voz

  toggleVoiceInput(): void {
    if (this.isListening) {
      this.voiceInputService.stop();
      return;
    }

    if (this.people.length === 0) {
      this.showNotice(this.t('peopleFirst'), 'warning');
      this.newPersonInput?.nativeElement.focus({ preventScroll: true });
      return;
    }

    this.isListening = true;
    this.voiceTranscript = '';

    this.voiceSubscription?.unsubscribe();
    this.voiceSubscription = this.voiceInputService.listen(this.currentLanguage).subscribe({
      next: ({ transcript, isFinal }) => {
        this.voiceTranscript = transcript;
        if (isFinal) {
          this.applyVoiceTranscript(transcript);
        }
      },
      error: (error: Error) => {
        this.isListening = false;
        this.voiceTranscript = '';
        const reason = error?.message ?? '';

        if (reason === 'not-allowed' || reason === 'service-not-allowed') {
          this.showNotice(this.t('voiceDenied'), 'warning');
        } else if (reason !== 'aborted' && reason !== 'no-speech') {
          this.showNotice(this.t('voiceError'), 'warning');
        }

        this.changeDetector.markForCheck();
      },
      complete: () => {
        this.isListening = false;
        this.voiceTranscript = '';
      }
    });
  }

  private applyVoiceTranscript(transcript: string): void {
    const parsed = this.voiceInputService.parseExpense(transcript, this.people, this.currentLanguage);

    if (!parsed.amount && !parsed.description) {
      this.showNotice(this.t('voiceNotUnderstood'), 'warning');
      return;
    }

    if (parsed.description) {
      this.newExpenseDescription = parsed.description;
    }

    if (parsed.amount) {
      this.newExpenseAmount = Math.round(parsed.amount * 100) / 100;
    }

    if (parsed.paidBy) {
      this.newExpensePaidBy = parsed.paidBy;
    }

    if (parsed.participants?.length) {
      this.selectedParticipants = parsed.participants;
      this.splitMode = this.areAllPeopleIncluded(parsed.participants) ? 'all' : 'custom';
    } else if (this.splitMode === 'all') {
      this.selectAllParticipants();
    }

    this.onPaidByChange();
    this.showNotice(this.t('voiceFilled'), 'success');
    this.analyticsService.track('voice_expense_dictated');
  }

  // ---------------------------------------------------------------- undo

  undoLastAction(): void {
    if (!this.lastSnapshot) {
      return;
    }

    const snapshot = this.lastSnapshot;
    this.people = [...snapshot.people];
    this.expenseItems = snapshot.expenseItems.map((item) => ({ ...item, participants: [...item.participants] }));
    this.newExpenseDescription = snapshot.newExpenseDescription;
    this.newExpenseAmount = snapshot.newExpenseAmount;
    this.newExpensePaidBy = snapshot.newExpensePaidBy;
    this.splitMode = snapshot.splitMode;
    this.selectedParticipants = [...snapshot.selectedParticipants];
    this.nextExpenseId = snapshot.nextExpenseId;
    this.editingExpenseId = snapshot.editingExpenseId;
    this.currency = snapshot.currency;

    this.lastSnapshot = null;
    this.canUndoLastAction = false;
    this.showNotice(this.t('undoApplied'), 'info');
  }

  private saveSnapshotForUndo(): void {
    this.lastSnapshot = {
      people: [...this.people],
      expenseItems: this.expenseItems.map((item) => ({ ...item, participants: [...item.participants] })),
      newExpenseDescription: this.newExpenseDescription,
      newExpenseAmount: this.newExpenseAmount,
      newExpensePaidBy: this.newExpensePaidBy,
      splitMode: this.splitMode,
      selectedParticipants: [...this.selectedParticipants],
      nextExpenseId: this.nextExpenseId,
      editingExpenseId: this.editingExpenseId,
      currency: this.currency
    };
  }

  // -------------------------------------------------------------- avisos

  private showNotice(message: string, type: NoticeType, enableUndo = false): void {
    this.uiNotice = message;
    this.uiNoticeType = type;
    this.canUndoLastAction = enableUndo && !!this.lastSnapshot;

    this.clearTimer(this.noticeTimer);
    this.noticeTimer = setTimeout(() => {
      this.uiNotice = '';
      this.canUndoLastAction = false;
      this.noticeTimer = null;
    }, this.canUndoLastAction ? 6000 : 3000);
  }

  dismissNotice(): void {
    this.uiNotice = '';
    this.canUndoLastAction = false;
    this.clearTimer(this.noticeTimer);
    this.noticeTimer = null;
  }

  private clearTimer(timer: ReturnType<typeof setTimeout> | null): void {
    if (timer) {
      clearTimeout(timer);
    }
  }

  // ------------------------------------------------------------- confirm

  /**
   * Modal de confirmación genérico: además de "borrar todo" (con los textos por
   * defecto), lo reutiliza el flujo de import de un enlace compartido en conflicto
   * pasándole su propio título y etiqueta de aceptar.
   */
  showConfirm(message: string, action: () => void, options?: { title?: string; acceptLabel?: string }): void {
    this.pendingConfirm = {
      title: options?.title ?? this.t('confirmTitle'),
      message,
      acceptLabel: options?.acceptLabel ?? this.t('confirmClear'),
      action
    };
  }

  acceptConfirm(): void {
    const pending = this.pendingConfirm;
    this.pendingConfirm = null;
    pending?.action();
  }

  cancelConfirm(): void {
    this.pendingConfirm = null;
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      if (this.pendingConfirm) {
        event.preventDefault();
        this.cancelConfirm();
      } else if (this.isListening) {
        event.preventDefault();
        this.voiceInputService.stop();
      } else if (this.editingExpenseId !== null) {
        event.preventDefault();
        this.cancelExpenseEdit();
      } else if (this.uiNotice) {
        this.dismissNotice();
      }
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && this.canSubmitExpense()) {
      event.preventDefault();
      this.addExpenseItem();
    }
  }

  // ------------------------------------------------------------ compartir

  shareWhatsApp(): void {
    if (this.expenseItems.length === 0) {
      this.showNotice(this.t('noExpensesToShare'), 'warning');
      return;
    }

    window.open(`https://wa.me/?text=${encodeURIComponent(this.buildShareMessage())}`, '_blank', 'noopener');
    this.showNotice(this.t('whatsappOpened'), 'success');
    this.analyticsService.track('share_clicked');
  }

  async copyShareLink(): Promise<void> {
    if (this.expenseItems.length === 0) {
      this.showNotice(this.t('noExpensesToShare'), 'warning');
      return;
    }

    if (await this.copyTextToClipboard(this.getShareAppLink())) {
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
    } catch {
      // Sin permiso de portapapeles: probamos el método legacy.
    }

    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.setAttribute('readonly', '');
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();

    let copied = false;
    try {
      copied = document.execCommand('copy');
    } catch {
      copied = false;
    }

    document.body.removeChild(textArea);
    return copied;
  }

  private triggerCopyFeedback(): void {
    this.isCopyLinkDone = true;
    this.clearTimer(this.copyLinkFeedbackTimer);
    this.copyLinkFeedbackTimer = setTimeout(() => {
      this.isCopyLinkDone = false;
      this.copyLinkFeedbackTimer = null;
    }, 1800);
  }

  private buildShareMessage(): string {
    const lines: string[] = [
      '🧾 *dividimos?*',
      '',
      `👥 ${this.people.join(', ')}`,
      `💰 ${this.t('shareTotal')}: ${this.formatCurrency(this.totalExpense)}`,
      `🙋 ${this.t('perPerson')}: ${this.formatCurrency(this.averageSpent)}`,
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

    lines.push('', `📲 ${this.t('shareGeneratedWith')}`, this.t('shareLinkHint'), this.getShareAppLink());

    return lines.join('\n');
  }

  private getShareAppLink(): string {
    const payload: SharePayload = {
      p: this.people,
      e: this.expenseItems.map((item) => ({
        d: item.description,
        a: item.amount,
        b: Math.max(0, this.people.indexOf(item.paidBy)),
        ...(this.areAllPeopleIncluded(item.participants)
          ? {}
          : { r: item.participants.map((p) => this.people.indexOf(p)).filter((i) => i >= 0) })
      })),
      c: this.currency
    };

    try {
      return this.shareService.buildShareUrl(payload);
    } catch {
      return this.publicAppUrl;
    }
  }

  // ---------------------------------------------------------- vista shared

  importAndEdit(): void {
    this.isSharedView = false;
  }

  dismissStaleBanner(): void {
    this.showStaleSessionBanner = false;
  }

  discardStaleSession(): void {
    this.showStaleSessionBanner = false;
    this.clearAll();
  }

  getStaleSessionText(): string {
    return this.t('staleSessionBanner').replace('{{days}}', String(this.staleSessionDays));
  }

  // ------------------------------------------------------------- trackBy

  trackByPerson(_index: number, person: string): string {
    return person;
  }

  trackByExpenseItem(_index: number, expenseItem: ExpenseItem): number {
    return expenseItem.id;
  }

  trackByResult(_index: number, result: SettlementResult): string {
    return `${result.debtor}→${result.creditor}`;
  }
}
