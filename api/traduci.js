export default async function handler(req, res) {
    // Semplifichiamo al massimo i permessi
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const { testo, linguaOrigine, linguaDestinazione } = req.body;
        const API_KEY = "AIzaSyBew8ibyTclpJNvnWPZbhsZJmibGYtpiQQ";

        if (!API_KEY) {
            return res.status(500).json({ errore: "Manca GEMINI_API_KEY su Vercel" });
        }

        const prompt = `Traduci dal ${linguaOrigine} al ${linguaDestinazione}: "${testo}". Rispondi solo con la traduzione.`;

        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();

        if (data.error) {
            return res.status(500).json({ errore: data.error.message });
        }

        const traduzione = data.candidates[0].content.parts[0].text;
        return res.status(200).json({ traduzione: traduzione.trim() });

    } catch (err) {
        return res.status(500).json({ errore: "Errore interno: " + err.message });
    }
}
