import { LanguageCode } from '../services/language.service';

export interface TranslationMap {
  peopleTitle: string;
  personPlaceholder: string;
  addPerson: string;
  addButton: string;
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
  splitModeAmounts: string;
  amountsMissing: string;
  amountsOver: string;
  amountsOk: string;
  splitEvenly: string;
  shareOf: string;
  amountsMismatch: string;
  editPerson: string;
  personNameLabel: string;
  aliasLabel: string;
  aliasPlaceholder: string;
  aliasHint: string;
  savePerson: string;
  personUpdated: string;
  aliasShort: string;
  hasAlias: string;
  addExpense: string;
  saveChanges: string;
  cancel: string;
  edit: string;
  remove: string;
  expensesTitle: string;
  editingExpense: string;
  everyone: string;
  paidByShort: string;
  resultsTitle: string;
  totalSpent: string;
  perPerson: string;
  allSettled: string;
  settlementsTitle: string;
  clearAll: string;
  clearAllFull: string;
  aboutLink: string;
  currencyAria: string;
  copyLink: string;
  copied: string;
  clipboardUnavailable: string;
  shareWhatsapp: string;
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
  personRemoved: string;
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
  personBalancesTitle: string;
  paidTotal: string;
  consumedTotal: string;
  netBalance: string;
  downloadImage: string;
  categoryTitle: string;
  imageDownloaded: string;
}

/** Textos de la interfaz por idioma. Para agregar un texto: sumarlo a `TranslationMap` y a ambos idiomas. */
export const TRANSLATIONS: Record<LanguageCode, TranslationMap> = {
  es: {
    peopleTitle: 'Personas',
    personPlaceholder: 'Agregar persona. Ej: Ana',
    addPerson: 'Agregar persona',
    addButton: 'Agregar',
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
    splitModeAmounts: 'Personalizado',
    amountsMissing: 'Faltan',
    amountsOver: 'Te pasaste por',
    amountsOk: 'El total cierra',
    splitEvenly: 'Repartir parejo',
    shareOf: 'Monto de',
    amountsMismatch: 'Los montos tienen que sumar el total',
    editPerson: 'Editar a',
    personNameLabel: 'Nombre',
    aliasLabel: 'Alias o CBU (opcional)',
    aliasPlaceholder: 'Ej: ana.mp o CBU',
    aliasHint: 'Se ve en los resultados y en WhatsApp. No viaja en el enlace.',
    savePerson: 'Guardar',
    personUpdated: 'Datos actualizados',
    aliasShort: 'alias',
    hasAlias: 'Tiene alias cargado',
    addExpense: 'Sumar gasto',
    saveChanges: 'Guardar',
    cancel: 'Cancelar',
    edit: 'Editar',
    remove: 'Eliminar',
    expensesTitle: 'Gastos',
    editingExpense: 'Editando gasto',
    everyone: 'Todos',
    paidByShort: 'Pagó',
    resultsTitle: 'Resultados',
    totalSpent: 'Gasto total',
    perPerson: 'Promedio por persona',
    allSettled: 'Todo saldado 🎉',
    settlementsTitle: 'Quién le paga a quién',
    clearAll: 'Borrar todo',
    clearAllFull: 'Borrar todo y empezar de nuevo',
    aboutLink: '¿Qué es dividimos?',
    currencyAria: 'Elegir moneda',
    copyLink: 'Copiar enlace',
    copied: 'Copiado',
    clipboardUnavailable: 'No se pudo copiar. Copiá el enlace manualmente.',
    shareWhatsapp: 'Compartir por WhatsApp',
    noExpensesToShare: 'No hay gastos para compartir',
    shareTotal: 'Total',
    shareAllSettled: 'Todo saldado 😎 no quedan cuentas pendientes.',
    shareGeneratedWith: 'Hecho con dividimos? 🤙',
    shareLinkHint: 'Tocá el link para ver todos los gastos 👇',
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
    personRemoved: 'Persona eliminada',
    expenseRemoved: 'Gasto eliminado',
    expenseEdited: 'Gasto modificado',
    allCleared: 'Se borró todo',
    nothingToClear: 'No hay nada para borrar',
    undo: 'Deshacer',
    undoApplied: 'Cambio deshecho',
    dismissNotice: 'Cerrar aviso',
    confirmTitle: '¿Borrar todo?',
    confirmClearAll: 'Se borran las personas y los gastos. Podés deshacerlo enseguida.',
    confirmClear: 'Sí, borrar',
    confirmImportTitle: 'Reemplazar tu sesión',
    confirmImportMessage: 'Ya tenés datos cargados. Si abrís este enlace, se reemplazan por los compartidos.',
    confirmImportAccept: 'Sí, reemplazar',
    shareImported: 'Sesión compartida importada',
    languageAria: 'Cambiar idioma',
    homeAria: 'Ir al inicio',
    sharedViewBanner: 'Sesión compartida',
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
    peopleFirst: 'Sumá personas antes de dictar',
    personBalancesTitle: 'Resumen por persona',
    paidTotal: 'Pagó',
    consumedTotal: 'Consumió',
    netBalance: 'Saldo neto',
    downloadImage: 'Descargar imagen',
    categoryTitle: 'Categoría',
    imageDownloaded: 'Imagen descargada'
  },
  en: {
    peopleTitle: 'People',
    personPlaceholder: 'Add person. E.g. Ana',
    addPerson: 'Add person',
    addButton: 'Add',
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
    splitModeAmounts: 'Custom',
    amountsMissing: 'Missing',
    amountsOver: 'Over by',
    amountsOk: 'The total adds up',
    splitEvenly: 'Split evenly',
    shareOf: 'Amount for',
    amountsMismatch: 'Amounts must add up to the total',
    editPerson: 'Edit',
    personNameLabel: 'Name',
    aliasLabel: 'Alias or bank ID (optional)',
    aliasPlaceholder: 'E.g. ana.mp or account number',
    aliasHint: 'Shown in the results and on WhatsApp. Not included in the link.',
    savePerson: 'Save',
    personUpdated: 'Details updated',
    aliasShort: 'alias',
    hasAlias: 'Has an alias saved',
    addExpense: 'Add expense',
    saveChanges: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    remove: 'Delete',
    expensesTitle: 'Expenses',
    editingExpense: 'Editing expense',
    everyone: 'Everyone',
    paidByShort: 'Paid by',
    resultsTitle: 'Results',
    totalSpent: 'Total spent',
    perPerson: 'Average per person',
    allSettled: 'All settled 🎉',
    settlementsTitle: 'Who pays whom',
    clearAll: 'Delete all',
    clearAllFull: 'Delete everything and start over',
    aboutLink: 'What is dividimos?',
    currencyAria: 'Choose currency',
    copyLink: 'Copy link',
    copied: 'Copied',
    clipboardUnavailable: 'Could not copy. Please copy the link manually.',
    shareWhatsapp: 'Share on WhatsApp',
    noExpensesToShare: 'There are no expenses to share',
    shareTotal: 'Total',
    shareAllSettled: 'All settled 😎 no pending payments.',
    shareGeneratedWith: 'Made with dividimos? 🤙',
    shareLinkHint: 'Tap the link to see all expenses 👇',
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
    personRemoved: 'Person removed',
    expenseRemoved: 'Expense deleted',
    expenseEdited: 'Expense updated',
    allCleared: 'Everything was cleared',
    nothingToClear: 'There is nothing to clear',
    undo: 'Undo',
    undoApplied: 'Change undone',
    dismissNotice: 'Dismiss',
    confirmTitle: 'Delete everything?',
    confirmClearAll: 'People and expenses will be deleted. You can undo it right after.',
    confirmClear: 'Yes, delete',
    confirmImportTitle: 'Replace your session',
    confirmImportMessage: 'You already have data. Opening this link will replace it with the shared data.',
    confirmImportAccept: 'Yes, replace',
    shareImported: 'Shared session imported',
    languageAria: 'Change language',
    homeAria: 'Go to home',
    sharedViewBanner: 'Shared session',
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
    peopleFirst: 'Add people before dictating',
    personBalancesTitle: 'Balances per person',
    paidTotal: 'Paid',
    consumedTotal: 'Consumed',
    netBalance: 'Net balance',
    downloadImage: 'Download image',
    categoryTitle: 'Category',
    imageDownloaded: 'Image downloaded'
  }
};
