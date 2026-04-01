# Chart & Insight Ideen — Honcho Dashboard

## Sofort machbar (Daten vorhanden)

### 1. Memory-Wachstumskurve ✅ In Arbeit
Conclusions haben `created_at`. Kumulative Linie: wie viele Conclusions über Zeit gesammelt wurden.
Zeigt den Lernfortschritt von Honcho. Steile Phasen = viel gelernt, Plateaus = Stillstand.

### 2. GitHub-Style Aktivitäts-Heatmap ✅ In Arbeit
Kalender-Grid, jeder Tag ein Kästchen, Farbe = Intensität (Messages/Conclusions).
Sofort sichtbar: wann bist du aktiv, wann nicht? Muster erkennen (Wochenenden, Sprints).

### 3. Conclusion Freshness Donut
Wie alt ist dein Honcho-Wissen? Segmente: <24h, <1 Woche, <1 Monat, >1 Monat.
Zeigt ob das Gedächtnis aktuell oder veraltet ist.

### 4. Session-Tiefe Histogramm
Wie lang sind deine Sessions? Verteilung: Quickies (1-5 Messages) vs. Deep-Dives (50+).
Zeigt Nutzungsmuster — kurze Fragen oder ausgedehnte Arbeitssessions?

### 5. Peer Aktivitäts-Timeline
Horizontale Swimlanes pro Peer (andre, claude-code, hermes, Assistant).
Jeder Punkt = eine Session. Zeigt wer wann aktiv war.

### 6. Conclusion-Wolke / Top-Themen
Aus Conclusion-Texten häufigste Begriffe extrahieren. Einfache Wortfrequenz, Stoppwörter raus.
Zeigt worum sich das Honcho-Wissen dreht.

## Etwas aufwändiger (aber cool)

### 7. Peer-Netzwerk-Graph
Knoten = Peers, Kanten = gemeinsame Sessions.
Force-directed Layout zeigt welche Agents miteinander interagieren.

### 8. Wissens-Radar pro Peer
Spider/Radar Chart: Achsen = Themen-Cluster aus Conclusions.
Zeigt pro Peer, wo das Wissen liegt.

### 9. Dream Impact Vergleich
Vorher/Nachher: Conclusions vor dem Dream vs. nach dem Dream.
Bar Chart mit zwei Farben. Zeigt den "Lernsprung" pro Dream-Zyklus.

### 10. Activity Streak & Gamification
Streak-Counter, längster Streak, Conclusions pro Woche.
Motivation, das System aktiv zu füttern.

## Experimentell (um die Ecke)

### 11. Conversation Replay / Scroll
Mini-Timeline einer Session. Klickbar: zeigt Messages als Chat-Bubbles.
Gut zum Debuggen und Nachvollziehen.

### 12. Semantic Similarity Map
Conclusions als 2D-Punktwolke (t-SNE/UMAP). Cluster = Themengruppen.
Braucht Backend-Endpoint für Embeddings.

### 13. Cross-Agent Knowledge Transfer
Zeigt ob Wissen von Agent A Agent B beeinflusst.
Conclusion → Personalization Insight Pfeil-Diagramm.
