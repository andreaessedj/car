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
    "userExists": "Esiste già un utente con questa email."
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
    "messagesLoadError": "Caricamento messaggi fallito."
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
    "yesterday": "Ieri"
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