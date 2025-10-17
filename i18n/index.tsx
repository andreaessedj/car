import React, { createContext, useContext, ReactNode, useCallback } from 'react';

// The JSON import was causing syntax errors in some environments.
// By embedding the JSON content directly, we avoid module resolution issues.
const itTranslations = {
  "appName": "ADULT-MEET",
  "filterGender": "Filtra per genere",
  "filterCity": "Filtra per città",
  "newCheckin": "Nuovo Check-in",
  "logout": "Logout",
  "loginRegister": "Login / Registrati",
  "usersOnline": "utenti online",
  "searchUsersPlaceholder": "Cerca utenti...",
  "genders": {
    "All": "Tutti",
    "M": "Uomo",
    "F": "Donna",
    "Trav": "Trav",
    "Trans": "Trans",
    "Coppia": "Coppia"
  },
  "auth": {
    "login": "Login",
    "register": "Registrati",
    "welcomeBack": "Bentornato!",
    "createAccount": "Crea un Account",
    "displayName": "Nome Visualizzato",
    "email": "Email",
    "password": "Password",
    "processing": "Caricamento...",
    "loginSuccess": "Login effettuato con successo!",
    "registerSuccess": "Registrazione completata! Controlla la tua email per confermare.",
    "userExists": "Esiste già un utente con questa email.",
    "displayNameRequired": "Il nome visualizzato è obbligatorio."
  },
  "checkinModal": {
    "title": "Crea Nuovo Check-in",
    "acquiringLocation": "Acquisizione della posizione in corso...",
    "locationError": "Impossibile ottenere la posizione. Per favore, concedi l'autorizzazione e riprova.",
    "tryAgain": "Riprova",
    "locationFound": "Posizione trovata: {{city}}",
    "locationRequired": "La posizione è necessaria per il check-in.",
    "nickname": "Nickname",
    "description": "Descrizione (cosa stai cercando?)",
    "gender": "Sono",
    "select": "Seleziona...",
    "status": "Stato",
    "single": "Single",
    "couple": "Coppia",
    "photoOptional": "Foto (Opzionale)",
    "creating": "Creazione...",
    "checkinNow": "Fai Check-in Ora",
    "adjustLocationMap": "Clicca sulla mappa per posizionare il puntatore"
  },
  "map": {
    "unknownLocation": "Posizione Sconosciuta",
    "notSpecified": "Non specificato",
    "comment": "Commenta",
    "navigate": "Naviga"
  },
  "toasts": {
    "commentsLoadError": "Impossibile caricare i commenti.",
    "loginRequired": "Devi essere loggato per inviare un messaggio.",
    "savingProfile": "Salvataggio del profilo in corso...",
    "checkinSuccess": "Check-in creato con successo!",
    "checkinFailed": "Creazione del check-in fallita.",
    "messagesLoadError": "Caricamento messaggi fallito.",
    "vipExtended": "Abbonamento VIP esteso con successo!",
    "vipExtensionFailed": "Impossibile estendere l'abbonamento VIP.",
    "processing": "Elaborazione...",
    "messageLimitReached": "Hai raggiunto il limite giornaliero di 30 messaggi privati. Gli utenti VIP hanno messaggi illimitati."
  },
  "checkinDetail": {
    "notAvailable": "N/D",
    "directions": "Indicazioni",
    "comments": "Commenti",
    "noComments": "Nessun commento. Sii il primo!",
    "addComment": "Aggiungi un commento..."
  },
  "dashboard": {
    "profileUpdated": "Profilo aggiornato con successo!",
    "profileUpdateFailed": "Aggiornamento del profilo fallito.",
    "noBio": "Nessuna biografia fornita.",
    "gender": "Genere",
    "status": "Stato",
    "single": "Single",
    "couple": "Coppia",
    "displayName": "Nome Visualizzato",
    "bio": "Bio",
    "select": "Seleziona...",
    "cancel": "Annulla",
    "saving": "Salvataggio...",
    "saveChanges": "Salva Modifiche",
    "editProfile": "Modifica Profilo",
    "profileTab": "Profilo",
    "messagesTab": "Messaggi",
    "noMessages": "Nessun messaggio ancora. Cerca un utente e inizia una conversazione!",
    "selectConversation": "Seleziona una conversazione per vedere i messaggi.",
    "chatWith": "Chat con {{name}}",
    "typeMessagePlaceholder": "Scrivi il tuo messaggio...",
    "you": "Tu",
    "yesterday": "Ieri",
    "vipStatusTitle": "Stato VIP",
    "vipActiveUntil": "Attivo fino al {{date}}",
    "vipExpiredOn": "Scaduto il {{date}}",
    "notVip": "Non sei un membro VIP.",
    "extendVip": "Estendi VIP (30 giorni)",
    "extendVipComingSoon": "Estendi VIP (Presto Disponibile)"
  },
  "recentCheckins": {
    "title": "Ultimi Check-in"
  },
  "recentUsers": {
    "title": "Ultimi Utenti",
    "noCheckins": "Questo utente non ha ancora effettuato check-in."
  },
  "userProfile": {
    "title": "Profilo Utente",
    "sendMessage": "Invia Messaggio Privato"
  },
  "messageModal": {
    "title": "Messaggio a {{name}}",
    "placeholder": "Scrivi il tuo messaggio...",
    "send": "Invia",
    "sending": "Invio in corso...",
    "success": "Messaggio inviato con successo!",
    "error": "Impossibile inviare il messaggio."
  },
  "guestbook": {
    "title": "Guestbook",
    "signTitle": "Firma il guestbook",
    "nickname": "Nickname",
    "message": "Il tuo messaggio",
    "sign": "Firma",
    "signing": "Invio...",
    "noMessages": "Nessun messaggio. Sii il primo a firmare!",
    "success": "Guestbook firmato con successo!"
  },
  "timeAgo": {
    "year": "a",
    "years": "a",
    "month": "m",
    "months": "m",
    "day": "g",
    "days": "g",
    "hour": "o",
    "hours": "o",
    "minute": "m",
    "minutes": "m",
    "justNow": "adesso"
  },
  "disclaimer": {
    "title": "Avviso Importante – Contenuti per un Pubblico Adulto",
    "intro": "Il sito che stai per visitare potrebbe contenere testi, immagini, descrizioni o riferimenti a situazioni di natura erotica, sensuale o comunque destinati a un pubblico maggiorenne. L’accesso è pertanto consentito esclusivamente a persone di età pari o superiore ai 18 anni (oppure all’età minima prevista dalle leggi vigenti nel Paese da cui si effettua l’accesso).",
    "rules": "Questo portale non promuove comportamenti illegali, offensivi o non consenzienti. Tutti i contenuti eventualmente a carattere adulto hanno scopo informativo, educativo o di intrattenimento e sono rivolti a un pubblico consapevole e responsabile.",
    "declarationTitle": "Accedendo, dichiari di:",
    "declaration1": "avere almeno 18 anni (o la maggiore età prevista nel tuo Paese);",
    "declaration2": "comprendere la natura dei contenuti presenti nel sito;",
    "declaration3": "accettare che l’autore e i gestori del portale non siano responsabili per l’uso improprio o non conforme alle leggi dei materiali qui pubblicati;",
    "declaration4": "accettare l’informativa sulla privacy e le condizioni d’uso del sito.",
    "exit": "Se non desideri visualizzare materiali destinati a un pubblico adulto, ti invitiamo a lasciare immediatamente questa pagina.",
    "acceptButton": "Accetto - Entra nel sito"
  },
  "vipPromo": {
    "title": "Diventa VIP (presto disponibile) 🚀",
    "subtitle": "Sblocca vantaggi esclusivi per incontrare più persone e muoverti con discrezione:",
    "feature1": "Evidenza check-in",
    "feature2": "Boost profilo",
    "feature3": "Messaggi prioritari",
    "feature4": "Filtri avanzati",
    "feature5": "Invisibilità",
    "footer": "Naviga giornalmente e provalo per primo!"
  },
  "vip": {
    "active": "Utente VIP",
    "expired": "VIP Scaduto"
  },
  "vipOnlyFilter": "Solo VIP",
  "header": {
    "becomeVip": "Diventa VIP",
    "isVip": "Utente VIP",
    "becomeVipComingSoon": "Diventa VIP (Presto disp.)",
    "comingSoonTitle": "Funzionalità in arrivo"
  }
};

interface LanguageContextType {
    language: string;
    setLanguage: (language: string) => void;
    t: (key: string, options?: { [key: string]: string | number }) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
    it: itTranslations,
};

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const language = 'it';

    const getNestedTranslation = useCallback((lang: string, key: string): string | object | undefined => {
        const langData = translations[lang as keyof typeof translations];
        if (!langData) return undefined;

        return key.split('.').reduce((obj: any, k: string) => {
            return obj && obj[k];
        }, langData);
    }, []);


    const t = useCallback((key: string, options?: { [key: string]: string | number }): string => {
        let translation = getNestedTranslation(language, key) as string;

        if (!translation || typeof translation !== 'string') {
            console.warn(`Translation not found for key: ${key}`);
            return key;
        }

        if (options) {
            Object.keys(options).forEach(k => {
                const regex = new RegExp(`{{${k}}}`, 'g');
                translation = translation.replace(regex, String(options[k]));
            });
        }

        return translation;
    }, [language, getNestedTranslation]);

    // setLanguage is now a no-op function as the language is fixed to Italian.
    const setLanguage = () => {};

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useTranslation = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useTranslation must be used within an I18nProvider');
    }
    return context;
};