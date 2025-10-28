import React, { useState } from 'react';
import { XMarkIcon } from './icons';
import { sendContactMessage } from '../src/services/contactService';
import { toast } from 'react-hot-toast';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sentOk, setSentOk] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !message.trim()) {
      toast.error('Per favore compila email e messaggio');
      return;
    }

    setSending(true);
    try {
      await sendContactMessage({ email, subject, message });
      setSentOk(true);
      toast.success('Messaggio inviato ✅');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err: any) {
      console.error(err);
      toast.error('Errore durante l\'invio');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-0 right-0 top-0 md:top-auto md:left-1/2 md:right-auto md:transform md:-translate-x-1/2 md:bottom-10 md:w-full md:max-w-md bg-gray-800 text-white rounded-t-lg md:rounded-lg shadow-xl z-50 flex flex-col">
        <div className="flex items-start justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-bold text-red-500">Contatti</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
            aria-label="Chiudi"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <p className="text-sm text-gray-300">
            Hai bisogno di segnalarci un problema, abuso o richiesta di supporto?
            Scrivici qui sotto e ti risponderemo via email.
          </p>

          {sentOk && (
            <div className="text-sm text-green-400 font-semibold bg-green-900/30 rounded-md p-3">
              Messaggio inviato correttamente. Ti risponderemo via email.
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">
                La tua email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="tu@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">
                Oggetto
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Segnalazione profilo fake / Problema tecnico / Altro"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">
                Messaggio
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="w-full bg-gray-700 text-white rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Descrivi il problema o la richiesta..."
                required
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md disabled:bg-gray-600"
            >
              {sending ? 'Invio…' : 'Invia messaggio'}
            </button>
          </form>
        </div>

        <div className="p-3 text-center text-[10px] text-gray-500 border-t border-gray-700">
          Questo form è per richieste di assistenza/moderazione.
          Non usare per messaggi personali verso altri utenti.
        </div>
      </div>
    </>
  );
};

export default ContactModal;
