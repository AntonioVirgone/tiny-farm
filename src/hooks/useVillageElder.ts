import { useState } from 'react';
import type { Inventory, QuestDefinition } from '../types/game.types';

interface Params {
  inventory: Inventory;
  totalFarmers: number;
  availableShips: number;
  totalPorts: number;
  dayCount: number;
  allQuests: QuestDefinition[];
  completedQuests: string[];
}

export const useVillageElder = () => {
  const [showElderModal, setShowElderModal] = useState(false);
  const [elderMessage, setElderMessage] = useState('');
  const [isElderThinking, setIsElderThinking] = useState(false);

  const askVillageElder = async (params: Params) => {
    setElderMessage('');
    setIsElderThinking(true);
    setShowElderModal(true);

    const apiKey = "AIzaSyBlIySSRdHR413ApOqUuzVL02C93bghKis";

    const systemPrompt =
      "Sei il saggio e antico Anziano del villaggio in un videogioco gestionale di agricoltura e costruzione città. " +
      "Il giocatore è il capo del villaggio che ha bisogno di un consiglio su cosa fare dopo. " +
      "Parla in prima persona, con un tono calmo, misterioso e molto immersivo (come in un gioco di ruolo). " +
      "Sii breve e conciso, massimo 2 o 3 frasi. Usa 1 o 2 emoji adatte.";

    const activeQuestIndex = params.allQuests.findIndex(q => !params.completedQuests.includes(q.id));
    const currentQuestStr = activeQuestIndex !== -1 ? params.allQuests[activeQuestIndex].title : 'Dominio totale';

    const userQuery =
      `Giorno: ${params.dayCount}. Popolazione: ${params.totalFarmers}. ` +
      `Inventario: Monete:${params.inventory.coins}, Legna:${params.inventory.wood}, Pietra:${params.inventory.stone}. ` +
      `Obiettivo attuale: ${currentQuestStr}. ` +
      `Dammi un consiglio.`;

    const payload = {
      contents: [{ parts: [{ text: userQuery }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
    };

    const fetchWithRetry = async (retries = 5, delay = 1000): Promise<string> => {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) },
        );
        if (!response.ok) throw new Error('API Error');
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Mmm... I venti non portano notizie oggi.';
      } catch (err) {
        if (retries > 0) {
          await new Promise(res => setTimeout(res, delay));
          return fetchWithRetry(retries - 1, delay * 2);
        }
        throw err;
      }
    };

    try {
      const text = await fetchWithRetry();
      setElderMessage(text);
    } catch {
      setElderMessage('Hmm... le nebbie del fato sono troppo fitte oggi. Riprova più tardi, giovane capo.');
    } finally {
      setIsElderThinking(false);
    }
  };

  return { showElderModal, setShowElderModal, elderMessage, isElderThinking, askVillageElder };
};