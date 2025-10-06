# Grid Conquest

Grid Conquest è una Progressive Web App strategica a turni in cui ti confronti con una IA per il controllo di una griglia modulabile. La partita si svolge completamente lato client ed è pronta per l'uso offline e la pubblicazione su GitHub Pages.

## Caratteristiche principali

- **Gameplay a turni**: seleziona le tue basi, sposta le unità verso celle adiacenti e conquista risorse o insediamenti nemici.
- **Generatore di mappe casuali**: ogni nuova partita crea una griglia 8×8 (o di dimensione personalizzata) con basi e risorse distribuite in modo procedurale.
- **Produzione di unità basata sulle risorse**: più zone risorsa controlli, più velocemente cresceranno le tue truppe.
- **IA locale con priorità**: l'avversario valuta difesa, conquista di risorse e attacchi ravvicinati seguendo strategie determinate.
- **Salvataggio automatico**: lo stato della partita viene memorizzato in IndexedDB tramite Dexie e ripristinato al riavvio.
- **PWA offline-first**: service worker Workbox generato via `vite-plugin-pwa`, manifest dedicato e icone per l'installazione su desktop/mobile.
- **UI responsive**: interfaccia ottimizzata per desktop e dispositivi mobili con tema scuro automatico e animazioni leggere per movimenti e conquiste.

## Requisiti

- Node.js 18+
- npm 9+

## Comandi principali

```bash
# Installazione delle dipendenze
npm install

# Ambiente di sviluppo con HMR
npm run dev

# Build di produzione (genera artefatti PWA in dist/)
npm run build

# Anteprima della build
npm run preview
```

## Distribuzione su GitHub Pages

1. Esegui `npm run build`.
2. Pubblica il contenuto della cartella `dist/` sul branch GitHub Pages (ad esempio `gh-pages`).
3. Assicurati che la repository utilizzi il percorso `/` oppure configura Pages per servire dal root della build; la configurazione Vite utilizza `base: './'` per garantire percorsi relativi compatibili.

## Struttura principale del progetto

- `src/state/` – store Zustand con logica di gioco e gestione turni.
- `src/game/` – utilità per generare mappe, calcolare statistiche e gestire l'IA.
- `src/hooks/` – persistenza Dexie con caricamento/salvataggio automatico della partita.
- `src/components/` – componenti UI (griglia, pannello statistiche, controlli, banner di fine partita).
- `public/manifest.webmanifest` – manifest PWA con icone dedicate.

Buon divertimento e buona conquista della griglia!
