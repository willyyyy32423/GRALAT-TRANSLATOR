export default async function handler(req, res) {
    // Gestione CORS per evitare blocchi del browser
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ errore: 'Metodo non consentito' });
    }

    const { testo, linguaOrigine, linguaDestinazione } = req.body;

    if (!testo) {
        return res.status(400).json({ errore: 'Testo mancante' });
    }

    const API_KEY = process.env.GEMINI_API_KEY;

    const linguaNome = (linguaOrigine === 'it' ? linguaDestinazione : linguaOrigine) === 'la' ? 'Latino' : 'Greco Antico';
    const direzione = linguaOrigine === 'it' ? `dall'Italiano al ${linguaNome}` : `dal ${linguaNome} all'Italiano`;

    const promptDiSistema = `Sei un professore di filologia classica. Traduci ${direzione}: "${testo}". Restituisci SOLO la traduzione.`;

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
        
        const rispostaAi = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptDiSistema }] }]
            })
        });

        const datiAi = await rispostaAi.json();

        if (datiAi.candidates && datiAi.candidates[0].content) {
            const traduzione = datiAi.candidates[0].content.parts[0].text;
            return res.status(200).json({ traduzione: traduzione.trim() });
        } else {
            // Se Gemini risponde con errore (es. chiave non valida) lo vedremo nei log
            console.error("Errore Gemini:", datiAi);
            return res.status(500).json({ errore: 'L\'IA ha rifiutato la richiesta' });
        }

    } catch (error) {
        return res.status(500).json({ errore: error.message });
    }
}
