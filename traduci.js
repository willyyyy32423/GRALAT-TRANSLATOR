// api/traduci.js - Il tuo Server Segreto

export default async function handler(req, res) {
    // 1. Accettiamo solo richieste POST dal tuo script.js
    if (req.method !== 'POST') {
        return res.status(405).json({ errore: 'Metodo non consentito' });
    }

    // 2. Estraiamo i dati che ci ha mandato il frontend
    const { testo, linguaOrigine, linguaDestinazione } = req.body;

    if (!testo) {
        return res.status(400).json({ errore: 'Testo mancante' });
    }

    // 3. RECUPERIAMO LA CHIAVE SEGRETA (Vercel la nasconderà qui)
    const API_KEY = process.env.GEMINI_API_KEY;

    // 4. CREIAMO IL PROMPT DA "FILOLOGO"
    const linguaNome = (linguaOrigine === 'it' ? linguaDestinazione : linguaOrigine) === 'la' ? 'Latino' : 'Greco Antico';
    const direzione = linguaOrigine === 'it' ? `dall'Italiano al ${linguaNome}` : `dal ${linguaNome} all'Italiano`;

    const promptDiSistema = `Sei un professore universitario di filologia classica. 
    Traduci il seguente testo ${direzione}. 
    Regole tassative: 
    - Non fornire MAI spiegazioni, introduzioni o note.
    - Restituisci SOLO ed esclusivamente la traduzione finale.
    - Usa un italiano elegante, rispettando il contesto storico e la consecutio temporum.
    
    Testo da tradurre: "${testo}"`;

    try {
        // 5. CHIAMIAMO L'INTELLIGENZA ARTIFICIALE
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
        
        const rispostaAi = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptDiSistema }] }]
            })
        });

        const datiAi = await rispostaAi.json();

        // 6. ESTRAIAMO LA RISPOSTA E LA MANDIAMO AL TUO FRONTEND
        if (datiAi.candidates && datiAi.candidates.length > 0) {
            let traduzionePulita = datiAi.candidates[0].content.parts[0].text;
            // Invio la traduzione al tuo script.js!
            return res.status(200).json({ traduzione: traduzionePulita.trim() }); 
        } else {
            throw new Error("Risposta anomala dall'IA");
        }

    } catch (error) {
        console.error("Errore Backend:", error);
        return res.status(500).json({ errore: 'Errore interno del server' });
    }
}