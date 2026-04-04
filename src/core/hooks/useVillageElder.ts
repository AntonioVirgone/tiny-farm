// Hook consulente IA — usa fetch() (funziona sia in web che in RN) e React hooks.
// Copia portabile dell'originale senza dipendenze browser.

import { useState } from 'react';

const ELDER_API_KEY = (typeof process !== 'undefined' && process.env?.VITE_GEMINI_KEY) || '';
const ELDER_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export const useVillageElder = () => {
  const [showElderModal, setShowElderModal]   = useState(false);
  const [elderMessage, setElderMessage]       = useState('');
  const [isElderThinking, setIsElderThinking] = useState(false);

  const askVillageElder = async (context: string) => {
    if (!ELDER_API_KEY) {
      setElderMessage('Il saggio non può parlare senza una chiave API.');
      return;
    }
    setIsElderThinking(true);
    setElderMessage('');
    try {
      const res = await fetch(`${ELDER_ENDPOINT}?key=${ELDER_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Sei il saggio anziano del villaggio in un gioco gestionale medievale chiamato Tiny Farm.
Rispondi in italiano, in modo saggio ma conciso (max 3 frasi). Non usare markdown.
Contesto attuale del gioco: ${context}
Cosa consigli al giocatore?`,
            }],
          }],
        }),
      });
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Il saggio tace...';
      setElderMessage(text);
    } catch {
      setElderMessage('Il saggio è momentaneamente indisponibile...');
    } finally {
      setIsElderThinking(false);
    }
  };

  return { showElderModal, setShowElderModal, elderMessage, isElderThinking, askVillageElder };
};
