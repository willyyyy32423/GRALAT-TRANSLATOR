// script.js - Motore AI Professionale (Versione Vercel + IA Generativa)

// --- 1. GESTIONE TEMA (Ottimizzata) ---
const htmlElement = document.documentElement;
const themeToggleBtn = document.getElementById('themeToggle');

// Funzione per aggiornare l'icona in base al tema attivo
function aggiornaIconaTema(isDark) {
    themeToggleBtn.innerText = isDark ? '☀️' : '🌙';
}

// Inizializzazione al caricamento
const temaSalvato = localStorage.getItem('gralat-tema');
if (temaSalvato === 'dark') {
    htmlElement.setAttribute('data-theme', 'dark');
    aggiornaIconaTema(true);
} else {
    aggiornaIconaTema(false);
}

function cambiaTema() {
    const isDark = htmlElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
        htmlElement.removeAttribute('data-theme');
        localStorage.setItem('gralat-tema', 'light');
        aggiornaIconaTema(false);
    } else {
        htmlElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('gralat-tema', 'dark');
        aggiornaIconaTema(true);
    }
}

// --- 2. GESTIONE DIREZIONE TRADUZIONE ---
let daItalianoAAntico = true;

function invertiDirezione() {
    daItalianoAAntico = !daItalianoAAntico;
    const btn = document.getElementById('btnDirezione');
    const input = document.getElementById('inputText');
    const btnLatino = document.getElementById('btnLatino');
    const btnGreco = document.getElementById('btnGreco');
    const output = document.getElementById('outputText');
    
    output.innerText = "La traduzione apparirà qui...";
    output.className = "placeholder-text";
    document.getElementById('extraActions').style.display = 'none';

    const swapIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-left:8px;"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>`;

    if (daItalianoAAntico) {
        btn.innerHTML = `🇮🇹 Italiano ➔ 🏛️ Antico ${swapIcon}`;
        input.placeholder = "Scrivi qui la frase in italiano...";
        btnLatino.innerText = "Traduci in Latino";
        btnGreco.innerText = "Traduci in Greco";
    } else {
        btn.innerHTML = `🏛️ Antico ➔ 🇮🇹 Italiano ${swapIcon}`;
        input.placeholder = "Scrivi qui la frase in latino o greco...";
        btnLatino.innerText = "Traduci dal Latino";
        btnGreco.innerText = "Traduci dal Greco";
    }
}

// --- 3. OTTIMIZZATORE TESTO ---
function ottimizzaTesto(testoGrezzo, lingua) {
    if (!testoGrezzo) return "";
    let testoPulito = testoGrezzo
        .trim()
        .replace(/[\r\n]+/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .replace(/[‘’`´]/g, "'")
        .replace(/[“”«»]/g, '"')
        .replace(/\[\d+\]/g, '')
        .replace(/\(\d+\)/g, '');

    if (lingua === 'el') {
        testoPulito = testoPulito.replace(/;/g, '?').replace(/·/g, ':');
    }
    return testoPulito;
}

// --- 4. TRADUZIONE VIA BACKEND (IA GENERATIVA) ---
const cacheTraduzioni = new Map();
let ultimaLinguaTarget = 'la';

async function eseguiTraduzione(lingua) {
    const output = document.getElementById('outputText');
    const extraActions = document.getElementById('extraActions');
    const bottoni = document.querySelectorAll('.action-btn');
    const inputField = document.getElementById('inputText');

    const sl = daItalianoAAntico ? 'it' : lingua;
    const tl = daItalianoAAntico ? lingua : 'it';
    ultimaLinguaTarget = tl;

    const testoGrezzo = inputField.value;
    const testo = ottimizzaTesto(testoGrezzo, sl); 

    if (!testo) {
        mostraErrore("Per favore, inserisci prima il testo da tradurre.");
        return;
    }

    const chiaveCache = `${testo.toLowerCase()}_${sl}_to_${tl}`;
    if (cacheTraduzioni.has(chiaveCache)) {
        mostraRisultato(cacheTraduzioni.get(chiaveCache));
        return;
    }

    // UI Loading
    extraActions.style.display = 'none';
    output.style.color = "var(--text-muted)";
    output.className = "placeholder-text";
    output.innerText = "L'IA sta elaborando una traduzione filologica...";
    bottoni.forEach(btn => btn.disabled = true);

    try {
        // CHIAMATA AL TUO BACKEND SU VERCEL
        const risposta = await fetch('/api/traduci', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                testo: testo,
                linguaOrigine: sl,
                linguaDestinazione: tl
            })
        });
        
        if (!risposta.ok) throw new Error(`Errore Server: ${risposta.status}`);
        
        const dati = await risposta.json();
        const testoTradotto = dati.traduzione;

        if (testoTradotto) {
            cacheTraduzioni.set(chiaveCache, testoTradotto);
            mostraRisultato(testoTradotto);
            salvaInCronologia(testoGrezzo.trim(), testoTradotto, lingua, daItalianoAAntico);
        } else {
            throw new Error("Risposta IA vuota");
        }

    } catch (errore) {
        console.error("Errore:", errore);
        mostraErrore("Impossibile connettersi all'IA. Controlla la tua GEMINI_API_KEY su Vercel.");
    } finally {
        bottoni.forEach(btn => btn.disabled = false);
    }
}

function mostraRisultato(testoTradotto) {
    const output = document.getElementById('outputText');
    output.style.color = "var(--text-main)";
    output.className = ""; 
    output.innerText = testoTradotto;
    document.getElementById('extraActions').style.display = 'flex';
}

function mostraErrore(messaggio) {
    const output = document.getElementById('outputText');
    output.style.color = "#D32F2F";
    output.innerText = messaggio;
}

// --- 5. AZIONI EXTRA ---
async function copiaTesto() {
    const testo = document.getElementById('outputText').innerText;
    try {
        await navigator.clipboard.writeText(testo);
        const btnCopia = document.querySelector('.extra-actions .icon-btn');
        const iconaDefault = btnCopia.innerHTML;
        btnCopia.innerHTML = '✓ Copiato';
        setTimeout(() => { btnCopia.innerHTML = iconaDefault; }, 2000);
    } catch (e) { alert("Errore nella copia."); }
}

function ascoltaTesto() {
    const testo = document.getElementById('outputText').innerText;
    if (!testo || !window.speechSynthesis) return;
    window.speechSynthesis.cancel(); 
    const utterance = new SpeechSynthesisUtterance(testo);
    utterance.lang = ultimaLinguaTarget === 'it' ? 'it-IT' : (ultimaLinguaTarget === 'la' ? 'it-IT' : 'el-GR');
    window.speechSynthesis.speak(utterance);
}

function condividiSito() {
    const testo = document.getElementById('outputText').innerText;
    if (navigator.share) {
        navigator.share({
            title: 'Gralat - Traduttore IA',
            text: `Traduzione: "${testo}"`,
            url: window.location.href 
        });
    } else { alert("Copia il link per condividere!"); }
}

// --- 6. CRONOLOGIA ---
function salvaInCronologia(originale, tradotto, lingua, daItAAntico) {
    let history = JSON.parse(localStorage.getItem('gralat-history')) || [];
    const etichettaLingua = lingua === 'la' ? 'Latino' : 'Greco';
    const direzioneTxt = daItAAntico ? `IT ➔ ${etichettaLingua}` : `${etichettaLingua} ➔ IT`;

    history.unshift({ originale, tradotto, direzioneTxt });
    if (history.length > 5) history.pop(); 
    localStorage.setItem('gralat-history', JSON.stringify(history));
    caricaCronologia();
}

function caricaCronologia() {
    const historyList = document.getElementById('historyList');
    if (!historyList) return;
    let history = JSON.parse(localStorage.getItem('gralat-history')) || [];
    historyList.innerHTML = history.length === 0 ? '<li class="placeholder-text">Nessuna ricerca recente.</li>' : '';

    history.forEach(item => {
        const li = document.createElement('li');
        li.className = 'history-item';
        li.innerHTML = `<strong>[${item.direzioneTxt}]</strong> <span class="h-orig"></span><br><em class="h-trad"></em>`;
        li.querySelector('.h-orig').textContent = item.originale;
        li.querySelector('.h-trad').textContent = item.tradotto;
        historyList.appendChild(li);
    });
}

window.addEventListener('DOMContentLoaded', caricaCronologia);