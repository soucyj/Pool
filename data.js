// Source de données du pool. Modifier ce fichier puis faire un push pour mettre le site à jour.
// Ordre des sièges : caq, plq, pq, qs, pcq, other. Chaque ligne doit totaliser 127.
// "source" : "qc125", "radioCanada" ou "final". "at" : heure locale du Québec (EDT, -04:00).
window.POOL_DATA = {
  predictions: [
    { name: "JS", seats: { caq: 0, plq: 37, pq: 69, qs: 6, pcq: 15, other: 0 } },
    { name: "JH", seats: { caq: 1, plq: 40, pq: 66, qs: 10, pcq: 10, other: 0 } },
  ],
  updates: [
    { source: "qc125", at: "2026-10-05T16:03:00-04:00", seats: { caq: 0, plq: 37, pq: 63, qs: 9, pcq: 18, other: 0 } },
  ],
};
