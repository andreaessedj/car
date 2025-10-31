import React, { createContext, useContext, ReactNode, useCallback } from 'react';

const it = {
  appName: "ADULT-MEET",
  map: {
    unknownLocation: "Luogo sconosciuto",
    notSpecified: "Non specificato",
    comment: "Commenta",
    navigate: "Naviga",
    viewVenue: "Vedi Locale"
  },
  genders: {
    All: "Tutti",
    M: "Uomo",
    F: "Donna",
    Trav: "Trav",
    Trans: "Trans",
    Coppia: "Coppia"
  },
  searchUsersPlaceholder: "Cerca utenti...",
  filterGender: "Filtra per genere",
  filterCity: "Filtra per città",
  vipOnlyFilter: "Solo VIP",
  usersOnline: "utenti online",
  newCheckin: "Nuovo Check-in",
  header: {
    isVip: "VIP",
    comingSoonTitle: "Diventa VIP (Prossimamente)",
    becomeVipComingSoon: "Diventa VIP"
  },
  logout: "Esci",
  loginRegister: "Accedi / Registrati",
  auth: {
    loginSuccess: "Accesso effettuato con successo!",
    displayNameRequired: "Il nome visualizzato è obbligatorio.",
    venueNameRequired: "Il nome del locale è obbligatorio.",
    genderRequired: "Il genere è obbligatorio.",
    bioRequired: "La bio è obbligatoria.",
    locationRequired: "La posizione è obbligatoria.",
    venueCreationError: "Errore durante la creazione del locale.",
    registerSuccess: "Registrazione avvenuta! Controlla la tua email per la conferma.",
    userExists: "Un utente con questa email esiste già.",
    resetError: "Errore durante il reset della password.",
    resetSuccess: "Link per il reset inviato! Controlla la tua email.",
    chooseAccountType: "Scegli il tipo di account",
    chooseAccountTypeSubtitle: "Come vuoi usare la nostra piattaforma?",
    privateUser: "Utente Privato",
    privateUserDescription: "Crea un profilo personale per fare check-in, chattare ed esplorare la mappa.",
    venue: "Locale / Club",
    venueDescription: "Registra il tuo locale per pubblicare eventi e farti trovare da nuovi clienti.",
    back: "Indietro",
    createAccountUser: "Crea il tuo Account",
    createAccountVenue: "Registra il tuo Locale",
    displayName: "Nome Visualizzato",
    gender: "Genere",
    bio: "La tua bio",
    bioPlaceholder: "Racconta qualcosa di te...",
    venueName: "Nome del Locale",
    venueNamePlaceholder: "Es: 'Paradise Club'",
    venueDescriptionLabel: "Descrizione",
    venueDescriptionPlaceholder: "Descrivi il tuo locale, l'atmosfera, il tipo di serate...",
    venueAddressLabel: "Indrizzo",
    venueAddressPlaceholder: "Es: Via Roma 1, 00100 Roma, Italia",
    venueLogoLabel: "URL Logo (opzionale)",
    venueLogoPlaceholder: "https://.../logo.png",
    venueLocationLabel: "Posizione sulla Mappa",
    venueOpeningHoursLabel: "Orari di Apertura",
    venueDays: {
        monday: "Lunedì",
        tuesday: "Martedì",
        wednesday: "Mercoledì",
        thursday: "Giovedì",
        friday: "Venerdì",
        saturday: "Sabato",
        sunday: "Domenica"
    },
    venueHoursPlaceholder: "Es: 22:00 - 04:00 o Chiuso",
    email: "Email",
    password: "Password",
    processing: "In elaborazione...",
    register: "Registrati",
    login: "Accedi",
    welcomeBack: "Bentornato!",
    forgotPassword: "Password dimenticata?",
    resetPasswordTitle: "Reimposta Password",
    resetPasswordInstructions: "Inserisci la tua email per ricevere un link di reset.",
    sendResetLink: "Invia Link",
    backToLogin: "Torna al Login",
  },
  checkinModal: {
    select: "Seleziona...",
    locationError: "Impossibile ottenere la posizione. Assicurati di aver dato i permessi e riprova.",
    locationRequired: "La posizione sulla mappa è obbligatoria.",
    creating: "Creazione check-in...",
    title: "Crea un nuovo Check-in",
    acquiringLocation: "Acquisizione posizione...",
    tryAgain: "Riprova",
    locationFound: "Posizione trovata a: {{city}}",
    adjustLocationMap: "Clicca sulla mappa per aggiustare la posizione",
    nickname: "Nickname",
    description: "Descrizione (cosa cerchi?)",
    gender: "Genere",
    status: "Stato",
    single: "Single",
    couple: "Coppia",
    photoOptional: "Foto (opzionale)",
    checkinNow: "Fai Check-in Ora",
  },
  toasts: {
    checkinSuccess: "Check-in creato con successo!",
    checkinFailed: "Creazione check-in fallita.",
    commentsLoadError: "Errore nel caricamento dei commenti.",
    messageLimitReached: "Hai raggiunto il limite di messaggi giornalieri. Diventa VIP per messaggi illimitati!",
  },
  checkinDetail: {
    notAvailable: "N/D",
    directions: "Indicazioni",
    comments: "Commenti",
    noComments: "Nessun commento ancora. Sii il primo!",
    addComment: "Aggiungi un commento...",
  },
  dashboard: {
      noBio: "Nessuna biografia impostata.",
      gender: "Genere",
      status: "Stato",
      couple: "Coppia",
      single: "Single",
      backToMessages: "Tutti i messaggi",
      cancel: "Annulla",
      saving: "Salvataggio...",
      saveChanges: "Salva Modifiche",
      profileTab: "Profilo",
      messagesTab: "Messaggi",
      profileUpdated: "Profilo aggiornato!",
      changePhoto: "Cambia Foto",
      displayName: "Nome Visualizzato",
      bio: "Bio",
      select: "Seleziona...",
      improveWithAI: "Migliora con AI",
      improving: "Miglioro...",
      bioSuggestionError: "Scrivi prima qualcosa nella bio per usare il suggerimento AI.",
      bioSuggestionErrorAPI: "Errore dall'AI. Riprova.",
      bioSuggestionSuccess: "Bio aggiornata con i suggerimenti dell'AI!",
      loadingMessages: "Caricamento messaggi...",
      noMessages: "Nessun messaggio. Inizia tu una conversazione!",
      startConversation: "Inizia la conversazione!",
      isTyping: "sta scrivendo...",
      typeMessagePlaceholder: "Scrivi un messaggio...",
      newMessageFrom: "Nuovo messaggio da"
  },
  recentCheckins: {
    title: "Ultimi Check-in"
  },
  recentUsers: {
    title: "Ultimi Utenti"
  },
  userProfile: {
    title: "Profilo Utente",
    sendMessage: "Invia Messaggio",
  },
  messageModal: {
    sending: "Invio in corso...",
    success: "Messaggio inviato!",
    error: "Errore nell'invio del messaggio.",
    title: "Invia un messaggio a {{name}}",
    placeholder: "Scrivi il tuo messaggio...",
    send: "Invia",
  },
  timeAgo: {
    year: "a",
    years: "a",
    month: "m",
    months: "m",
    day: "g",
    days: "g",
    hour: "o",
    hours: "o",
    minute: "m",
    minutes: "m",
    justNow: "adesso"
  },
  guestbook: {
    title: "Guestbook",
    success: "Messaggio firmato!",
    noMessages: "Nessun messaggio. Lascia il primo!",
    signTitle: "Lascia un messaggio",
    nickname: "Nickname",
    message: "Messaggio",
    signing: "Invio...",
    sign: "Firma",
  },
  disclaimer: {
    title: "Benvenuto su ADULT-MEET",
    intro: "Prima di continuare, leggi e accetta le nostre condizioni.",
    declarationTitle: "Accedendo dichiari di:",
    declaration1: "Avere più di 18 anni.",
    declaration2: "Accettare i nostri Termini di Servizio e il Regolamento.",
    declaration3: "Essere consapevole che questa è una community per adulti e potresti vedere contenuti e interagire con persone in contesti di incontri.",
    declaration4: "Utilizzare la piattaforma in modo responsabile e rispettoso.",
    exit: "Se non accetti queste condizioni, esci dal sito.",
    acceptButton: "Ho più di 18 anni e accetto"
  },
  vipPromo: {
    title: "Diventa un Utente VIP!",
    subtitle: "Ottieni il massimo da ADULT-MEET con i vantaggi esclusivi.",
    feature1: "Messaggi privati illimitati",
    feature2: "Check-in in evidenza sulla mappa",
    feature3: "Profilo in cima alle liste",
    feature4: "Filtro per vedere solo i VIP",
    footer: "Funzionalità VIP in arrivo prossimamente!"
  },
  vipInvitation: {
    title: "Sblocca il Tuo Potenziale!",
    subtitle: "Passa a VIP per solo 1€ e goditi 30 giorni di vantaggi esclusivi.",
    feature1: "Messaggi privati illimitati",
    feature2: "Check-in in evidenza sulla mappa",
    feature3: "Badge VIP esclusivo sul profilo",
    feature4: "Filtra la mappa per vedere solo i VIP",
    acceptButton: "Diventa VIP Ora a 1€",
    declineButton: "Forse più tardi",
    mustRegister: "Per diventare VIP devi prima creare un account gratuito.",
    registerNow: "Registrati Ora"
  },
  vip: {
    active: "Utente VIP",
    expired: "VIP Scaduto"
  },
  venueDetail: {
    closed: "Chiuso",
    openingHours: "Orari di Apertura",
    today: "Oggi",
    weeklySchedule: "Programma Settimanale",
    dressCode: "Dress Code",
    costs: "Costi d'ingresso",
    moreInfo: "Più Info / Prenota",
    noEvent: "Nessun evento programmato per questo giorno.",
    directions: "Indicazioni stradali"
  },
  venueDashboard: {
    previousWeek: "Settimana Prec.",
    nextWeek: "Settimana Succ.",
    title: "Pannello di Controllo Locale",
    detailsTab: "Dettagli Locale",
    eventsTab: "Gestione Eventi",
    deleteVenueAccount: "Elimina il mio account",
    dangerZoneTitle: "Zona Pericolosa",
    dangerZoneDescription: "Questa azione è permanente.",
    noEventScheduled: "Nessun evento programmato.",
    addEvent: "Aggiungi",
    editEvent: "Modifica",
    futureWeekMessage: "Puoi programmare gli eventi per questa settimana a partire da Lunedì."
  },
  eventEditor: {
    title: "Gestisci Evento per il {{date}}",
    eventName: "Nome Evento",
    description: "Descrizione",
    image: "Immagine Evento",
    targetAudience: "Target (es. Coppie, Single M/F, Over 40)",
    dressCode: "Abbigliamento (es. Elegante, Casual, Fetish)",
    externalLink: "Link Esterno (es. per prenotazioni)",
    costs: "Costi di Ingresso",
    costSingleMale: "Uomo Single",
    costSingleFemale: "Donna Single",
    costCouple: "Coppia",
    save: "Salva Evento",
    saving: "Salvataggio...",
    backToSchedule: "Torna alla programmazione",
    uploading: "Caricamento immagine..."
  }
};

type Translations = typeof it;

const I18nContext = createContext({
    language: 'it',
    t: (key: string, options?: { [key: string]: string | number }): string => key,
});

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const language = 'it'; // Hardcoded to Italian for now

    const t = useCallback((key: string, options?: { [key: string]: string | number }): string => {
        const keyParts = key.split('.');
        let translation: any = translations;
        for (const part of keyParts) {
            if (translation && typeof translation === 'object' && part in translation) {
                translation = translation[part];
            } else {
                return key; // Return key if not found
            }
        }
        
        if (typeof translation === 'string' && options) {
            return Object.entries(options).reduce((str, [k, v]) => str.replace(`{{${k}}}`, String(v)), translation);
        }

        return typeof translation === 'string' ? translation : key;
    }, []);

    return (
        <I18nContext.Provider value={{ language, t }}>
            {children}
        </I18nContext.Provider>
    );
};

export const useTranslation = () => {
    return useContext(I18nContext);
};

const translations: Translations = it;