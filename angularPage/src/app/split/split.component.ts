import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, effect } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { PersistenceService } from '../services/persistence.service';
import { ShareService, SharePayload } from '../services/share.service';
import { AnalyticsService } from '../services/analytics.service';
import { LanguageService, LanguageCode } from '../services/language.service';
import { VoiceInputService } from '../services/voice-input.service';
import { SplitStateService } from '../services/split-state.service';
import { CURRENCY_OPTIONS, CategoryOption, CurrencySymbol, EXPENSE_CATEGORIES, ExpenseCategory, ExpenseItem, SettlementResult, SplitMode, cloneExpense } from '../models/expense.model';
import { PersonBalance } from '../utils/settlement.util';
import { TRANSLATIONS, TranslationMap } from '../i18n/translations';
import { buildShareMessage } from '../utils/share-message.util';
import { SummaryView } from '../utils/summary-view';
import { renderSummaryCanvas } from '../utils/summary-image.util';

type NoticeType = 'success' | 'info' | 'warning';


interface PendingConfirm {
  title: string;
  message: string;
  acceptLabel: string;
  action: () => void;
}

/** Copia `record` sin la clave `key`. */
function omitKey<T>(record: Record<string, T>, key: string): Record<string, T> {
  return Object.fromEntries(Object.entries(record).filter(([entryKey]) => entryKey !== key));
}

/** Copia `record` aplicando `rename` a cada clave (para renombrar personas). */
function renameKeys<T>(record: Record<string, T>, rename: (key: string) => string): Record<string, T> {
  return Object.fromEntries(Object.entries(record).map(([key, value]) => [rename(key), value]));
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
  newExpenseShares: Record<string, number | null>;
  aliases: Record<string, string>;
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

  private readonly translations = TRANSLATIONS;

  @ViewChild('newPersonInput') private newPersonInput?: ElementRef<HTMLInputElement>;
  @ViewChild('expenseDescriptionInput') private expenseDescriptionInput?: ElementRef<HTMLInputElement>;
  @ViewChild('personNameInput') private personNameInput?: ElementRef<HTMLInputElement>;

  readonly currencyOptions = CURRENCY_OPTIONS;
  readonly expenseCategories = EXPENSE_CATEGORIES;

  selectedCategory: ExpenseCategory = 'other';
  editingExpenseId: number | null = null;

  /** Persona cuyo nombre/alias se está editando (null = editor cerrado). */
  editingPerson: string | null = null;
  personDraftName = '';
  personDraftAlias = '';

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

  get newExpenseShares(): Record<string, number | null> { return this.stateService.newExpenseShares(); }
  set newExpenseShares(value: Record<string, number | null>) { this.stateService.newExpenseShares.set(value); }

  get aliases(): Record<string, string> { return this.stateService.aliases(); }
  set aliases(value: Record<string, string>) { this.stateService.aliases.set(value); }

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
  get personBalances(): PersonBalance[] { return this.stateService.settlement().personBalances; }
  get totalExpense(): number { return this.stateService.settlement().totalExpense; }
  get averageSpent(): number { return this.stateService.settlement().averageSpent; }

  /** El "promedio por persona" solo tiene sentido si todos los gastos se dividieron entre todos. */
  get hasEvenSplit(): boolean {
    return this.expenseItems.every((item) => this.areAllPeopleIncluded(item.participants));
  }

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
    const fromFragment = this.shareService.parseFragment(this.route.snapshot.fragment);
    const conflictData = fromFragment?.data ?? params.get('data');
    const conflictVersion = fromFragment?.version ?? Number.parseInt(params.get('v') ?? '0', 10);

    // Limpiamos la URL para que un refresh no repita el aviso ni la importación.
    void this.router.navigate([], { relativeTo: this.route, queryParams: {}, fragment: undefined, replaceUrl: true });

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

    this.newExpenseShares = omitKey(this.newExpenseShares, person);
    this.aliases = omitKey(this.aliases, person);
    if (this.editingPerson === person) {
      this.editingPerson = null;
    }

    // Si la persona tenía un monto exacto en un gasto, ese reparto ya no cierra: el gasto
    // pasa a dividirse en partes iguales entre quienes quedan.
    this.expenseItems = this.expenseItems
      .filter((item) => item.paidBy !== person)
      .map((item) => {
        const { shares, ...rest } = item;
        const keepsShares = !!shares && !(person in shares);
        return { ...rest, participants: item.participants.filter((p) => p !== person), ...(keepsShares ? { shares } : {}) };
      })
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

    if (mode === 'amounts') {
      return;
    }

    if (this.people.length > 0 && (mode === 'all' || this.selectedParticipants.length === 0)) {
      this.selectAllParticipants();
    }
  }

  isPayerIncludedInParticipants(): boolean {
    return !this.newExpensePaidBy || this.selectedParticipants.includes(this.newExpensePaidBy);
  }

  // ------------------------------------------------- montos personalizados

  getShare(person: string): number | null {
    return this.newExpenseShares[person] ?? null;
  }

  setShare(person: string, value: number | string | null): void {
    const parsed = value === null || value === '' ? null : Number(value);
    this.newExpenseShares = {
      ...this.newExpenseShares,
      [person]: parsed !== null && Number.isFinite(parsed) && parsed >= 0 ? parsed : null
    };
  }

  /** Lo que falta (+) o sobra (−) para que los montos cierren con el total del gasto, en centavos. */
  private get sharesDifferenceInCents(): number {
    const totalInCents = Math.round((this.newExpenseAmount ?? 0) * 100);
    const assignedInCents = this.people.reduce((sum, person) => sum + Math.round((this.newExpenseShares[person] ?? 0) * 100), 0);
    return totalInCents - assignedInCents;
  }

  sharesAreValid(): boolean {
    const hasAmount = this.newExpenseAmount !== null && this.newExpenseAmount > 0;
    const someoneHasShare = this.people.some((person) => (this.newExpenseShares[person] ?? 0) > 0);
    return hasAmount && someoneHasShare && this.sharesDifferenceInCents === 0;
  }

  /** Texto de estado bajo la lista de montos: "Faltan $ 500", "Te pasaste por $ 20" o "El total cierra". */
  sharesStatus(): { text: string; ok: boolean } {
    if (!this.newExpenseAmount || this.newExpenseAmount <= 0) {
      return { text: '', ok: false };
    }

    const difference = this.sharesDifferenceInCents;
    if (difference === 0) {
      return { text: this.t('amountsOk'), ok: this.sharesAreValid() };
    }

    const label = difference > 0 ? this.t('amountsMissing') : this.t('amountsOver');
    return { text: `${label} ${this.formatCurrency(Math.abs(difference) / 100)}`, ok: false };
  }

  /** Reparte el total del gasto en partes iguales entre todas las personas, centavo por centavo. */
  fillSharesEqually(): void {
    const totalInCents = Math.round((this.newExpenseAmount ?? 0) * 100);
    if (totalInCents <= 0 || this.people.length === 0) {
      return;
    }

    const base = Math.floor(totalInCents / this.people.length);
    const remainder = totalInCents % this.people.length;
    this.newExpenseShares = Object.fromEntries(
      this.people.map((person, index) => [person, (base + (index < remainder ? 1 : 0)) / 100])
    );
  }

  // ------------------------------------------------- editar persona y alias

  aliasOf(person: string): string {
    return this.aliases[person] ?? '';
  }

  startPersonEdit(person: string): void {
    if (this.isSharedView) {
      return;
    }

    this.editingPerson = person;
    this.personDraftName = person;
    this.personDraftAlias = this.aliasOf(person);
    setTimeout(() => this.personNameInput?.nativeElement.focus());
  }

  cancelPersonEdit(): void {
    this.editingPerson = null;
  }

  /** Renombra a la persona en todos lados (gastos, reparto, montos) y guarda su alias; se puede deshacer. */
  savePersonEdit(): void {
    const oldName = this.editingPerson;
    if (oldName === null) {
      return;
    }

    const newName = this.personDraftName.trim().replace(/\s+/g, ' ');
    const alias = this.personDraftAlias.trim().slice(0, 40);

    if (!newName) {
      this.showNotice(this.t('enterValidName'), 'warning');
      return;
    }

    const isTaken = this.people.some((person) => person !== oldName && person.toLocaleLowerCase() === newName.toLocaleLowerCase());
    if (isTaken) {
      this.showNotice(this.t('personAlreadyExists'), 'warning');
      return;
    }

    if (newName === oldName && alias === this.aliasOf(oldName)) {
      this.editingPerson = null;
      return;
    }

    this.saveSnapshotForUndo();

    const rename = (name: string): string => (name === oldName ? newName : name);
    this.people = this.people.map(rename);
    this.selectedParticipants = this.selectedParticipants.map(rename);
    if (this.newExpensePaidBy === oldName) {
      this.newExpensePaidBy = newName;
    }
    this.expenseItems = this.expenseItems.map((item) => ({
      ...cloneExpense(item),
      paidBy: rename(item.paidBy),
      participants: item.participants.map(rename),
      ...(item.shares ? { shares: renameKeys(item.shares, rename) } : {})
    }));
    this.newExpenseShares = renameKeys(this.newExpenseShares, rename);

    const remainingAliases = omitKey(this.aliases, oldName);
    this.aliases = alias ? { ...remainingAliases, [newName]: alias } : remainingAliases;

    this.editingPerson = null;
    this.showNotice(this.t('personUpdated'), 'success', true);
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

    let shares: Record<string, number> | undefined;

    if (this.splitMode === 'amounts') {
      if (!this.sharesAreValid()) {
        this.showNotice(this.t('amountsMismatch'), 'warning');
        return;
      }

      shares = {};
      this.people.forEach((person) => {
        const value = this.newExpenseShares[person];
        if (value && value > 0) {
          shares![person] = Math.round(value * 100) / 100;
        }
      });
    } else if (this.splitMode === 'all') {
      this.selectAllParticipants();
    } else if (this.selectedParticipants.length === 0) {
      this.showNotice(this.t('addParticipantsToSplit'), 'warning');
      return;
    }

    const draft = {
      description: this.newExpenseDescription.trim(),
      amount: Math.round(this.newExpenseAmount * 100) / 100,
      paidBy: this.newExpensePaidBy,
      participants: shares ? Object.keys(shares) : [...this.selectedParticipants],
      category: this.selectedCategory,
      ...(shares ? { shares } : {})
    };

    if (this.editingExpenseId !== null) {
      this.saveSnapshotForUndo();
      const editingId = this.editingExpenseId;
      this.expenseItems = this.expenseItems.map((item) => (item.id === editingId ? { id: editingId, ...draft } : item));
      this.showNotice(this.t('expenseEdited'), 'success', true);
      this.editingExpenseId = null;
    } else {
      this.expenseItems = [...this.expenseItems, { id: this.nextExpenseId++, ...draft }];
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
    this.selectedCategory = item.category || 'other';
    this.selectedParticipants = [...item.participants];
    this.newExpenseShares = item.shares ? { ...item.shares } : {};
    this.splitMode = item.shares ? 'amounts' : this.areAllPeopleIncluded(item.participants) ? 'all' : 'custom';

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
    this.selectedCategory = 'other';
    this.newExpenseShares = {};
    this.splitMode = 'all';
    this.selectAllParticipants();
  }

  canSubmitExpense(): boolean {
    return this.people.length > 0
      && !!this.newExpenseDescription.trim()
      && this.newExpenseAmount !== null
      && this.newExpenseAmount > 0
      && !!this.newExpensePaidBy
      && (this.splitMode === 'amounts' ? this.sharesAreValid() : (this.splitMode === 'all' || this.selectedParticipants.length > 0));
  }

  formatExpenseParticipants(expenseItem: ExpenseItem): string {
    if (expenseItem.participants.length === 0) {
      return '—';
    }

    if (expenseItem.shares) {
      return Object.entries(expenseItem.shares).map(([person, amount]) => `${person} ${this.formatCurrency(amount)}`).join(' · ');
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
    this.expenseItems = snapshot.expenseItems.map(cloneExpense);
    this.newExpenseDescription = snapshot.newExpenseDescription;
    this.newExpenseAmount = snapshot.newExpenseAmount;
    this.newExpensePaidBy = snapshot.newExpensePaidBy;
    this.splitMode = snapshot.splitMode;
    this.selectedParticipants = [...snapshot.selectedParticipants];
    this.nextExpenseId = snapshot.nextExpenseId;
    this.editingExpenseId = snapshot.editingExpenseId;
    this.currency = snapshot.currency;
    this.newExpenseShares = { ...snapshot.newExpenseShares };
    this.aliases = { ...snapshot.aliases };
    this.editingPerson = null;

    this.lastSnapshot = null;
    this.canUndoLastAction = false;
    this.showNotice(this.t('undoApplied'), 'info');
  }

  private saveSnapshotForUndo(): void {
    this.lastSnapshot = {
      people: [...this.people],
      expenseItems: this.expenseItems.map(cloneExpense),
      newExpenseDescription: this.newExpenseDescription,
      newExpenseAmount: this.newExpenseAmount,
      newExpensePaidBy: this.newExpensePaidBy,
      splitMode: this.splitMode,
      selectedParticipants: [...this.selectedParticipants],
      nextExpenseId: this.nextExpenseId,
      editingExpenseId: this.editingExpenseId,
      currency: this.currency,
      newExpenseShares: { ...this.newExpenseShares },
      aliases: { ...this.aliases }
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
    this.analyticsService.track('share_clicked');
  }

  async copyShareLink(): Promise<void> {
    if (this.expenseItems.length === 0) {
      this.showNotice(this.t('noExpensesToShare'), 'warning');
      return;
    }

    if (await this.copyTextToClipboard(this.getShareAppLink())) {
      this.triggerCopyFeedback();
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
    return buildShareMessage(this.buildSummaryView(), (key) => this.t(key), (amount) => this.formatCurrency(amount), this.getShareAppLink());
  }

  /** Datos ya calculados que comparten el mensaje de WhatsApp y la imagen PNG. */
  private buildSummaryView(): SummaryView {
    return {
      people: this.people,
      expenses: this.expenseItems.map((item) => ({
        description: item.description,
        amount: item.amount,
        paidBy: item.paidBy,
        emoji: this.getCategoryOption(item.category).emoji
      })),
      totalExpense: this.totalExpense,
      averageSpent: this.hasEvenSplit ? this.averageSpent : null,
      personBalances: this.personBalances,
      results: this.results,
      aliases: Object.fromEntries(Object.entries(this.aliases).filter(([person, alias]) => this.people.includes(person) && !!alias))
    };
  }

  private getShareAppLink(): string {
    const payload: SharePayload = {
      p: this.people,
      e: this.expenseItems.map((item) => ({
        d: item.description,
        a: item.amount,
        b: Math.max(0, this.people.indexOf(item.paidBy)),
        ...(item.category ? { k: item.category } : {}),
        ...(item.shares
          ? { s: this.people.map((person) => item.shares?.[person] ?? 0) }
          : this.areAllPeopleIncluded(item.participants)
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

  // ----------------------------------------------------------- categorías

  getCategoryOption(cat?: ExpenseCategory): CategoryOption {
    return this.expenseCategories.find((c) => c.id === (cat || 'other')) || this.expenseCategories[5];
  }

  selectCategory(cat: ExpenseCategory): void {
    this.selectedCategory = cat;
  }

  onDescriptionChange(value: string): void {
    const clean = value.toLowerCase().trim();
    if (!clean) return;
    if (/cena|comida|almuerzo|pizza|burger|hamburguesa|restauran|asado|parrilla|mcdonald|empana|postre|sushi/i.test(clean)) {
      this.selectedCategory = 'food';
    } else if (/birra|cerveza|trago|bebida|vino|alcohol|bar|pub|café|cafe|coffee|tragos|gaseosa/i.test(clean)) {
      this.selectedCategory = 'drink';
    } else if (/super|mercado|compras|chinos|verduleria|carne|chino|coto|dia|carrefour|vea/i.test(clean)) {
      this.selectedCategory = 'supermarket';
    } else if (/uber|taxi|nafta|combustible|peaje|estacionamiento|colectivo|remis|gasolina|gasoil|cabify|didi|pasaje/i.test(clean)) {
      this.selectedCategory = 'transport';
    } else if (/hotel|airbnb|alquiler|hospedaje|cabaña|resort|depto|hostel|camping/i.test(clean)) {
      this.selectedCategory = 'stay';
    }
  }

  // ----------------------------------------------------- exportación png

  exportSummaryAsImage(): void {
    if (!this.hasData) {
      this.showNotice(this.t('noExpensesToShare'), 'warning');
      return;
    }

    const canvas = renderSummaryCanvas(this.buildSummaryView(), (key) => this.t(key), (amount) => this.formatCurrency(amount));
    if (!canvas) {
      return;
    }

    const link = document.createElement('a');
    link.download = 'dividimos-resumen.png';
    link.href = canvas.toDataURL('image/png');
    link.click();

    this.showNotice(this.t('imageDownloaded'), 'success');
    this.analyticsService.track('summary_image_downloaded');
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

