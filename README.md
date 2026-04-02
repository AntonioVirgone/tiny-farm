# 🚜 Fattoria Avanzata

Un simulatore gestionale web-based con elementi di city-building, esplorazione e sopravvivenza.

Fattoria Avanzata è un videogioco gestionale sviluppato in React. Giocato su una griglia interattiva 8x8, sfida il giocatore a bilanciare la raccolta di risorse, la crescita demografica e l'esplorazione territoriale, espandendo un piccolo insediamento fino a farlo diventare una prospera contea.

### 🌟 Caratteristiche Principali

Gestione Dinamica dei Cittadini: La tua forza lavoro non è infinita. Assegna i cittadini alle mansioni, ma attenzione ai rischi (es. incidenti di caccia).

Meccanica di Fusione (Merge 2x2): Combina gli edifici adiacenti per sbloccare insediamenti più grandi (Casa ➔ Villaggio ➔ Città ➔ Contea).

Nebbia di Guerra (Fog of War): Il mare nasconde terre inesplorate. Costruisci navi e porti per diradare la nebbia e scoprire nuove risorse.

Economia di Mercato: Compra semi e vendi le tue eccedenze, con meccaniche di salvaguardia per non decimare le tue scorte vitali (come il bestiame).

Eventi e Tempo Reale: Coltivazioni, estrazione mineraria e riproduzione degli animali progrediscono passivamente nel tempo.

### 🎮 Meccaniche di Gioco

#### 🎒 Risorse e Inventario

Il gioco simula un'economia stratificata che include:

Valuta base: Monete (🪙)

Materie prime: Legna, Pietra, Minerali (Ferro, Rame, Oro).

Materiali lavorati: Assi di legno, Mattoni.

Agricoltura e Cibo: Grano, Carote, Pomodori (con gestione dei semi), Pesce e Carne selvatica.

Bestiame: Animali allevati in fattoria.

#### 👥 Popolazione e Lavoro

Ogni azione (arare, costruire, raccogliere) "occupa" temporaneamente uno o più cittadini.

L'espansione demografica avviene migliorando le strutture abitative.

Rischio: Alcune azioni (come la caccia) hanno un tasso di mortalità (15%). I cittadini deceduti affrontano un periodo di respawn di 40 secondi prima di tornare disponibili.

#### 🌫️ Esplorazione Navale

La mappa iniziale è limitata dall'acqua. Costruendo un Porto, il giocatore sacrifica permanentemente parte dei cittadini per formare un equipaggio navale, ma sblocca la capacità di pescare e dissolve la nebbia che copre l'altra sponda del mare.

#### 🏢 Edifici e Strutture

Il gioco include diverse strutture produttive (Miniera, Segheria, Tagliapietre, Fattoria Animali).

Gli insediamenti seguono una meccanica di fusione spaziale 2x2:

Casa (+1 Cittadino)

Villaggio (+6 Cittadini) - Richiede 4 Case 2x2

Città (+30 Cittadini) - Richiede 4 Villaggi 2x2

Contea (+100 Cittadini) - Richiede 4 Città 2x2

#### ⚖️ Il Mercato Locale

Un'interfaccia dedicata per convertire le risorse in ricchezza. Include un sistema di Salvaguardia del Bestiame: il mercato impedisce la vendita accidentale degli ultimi 2 animali per garantire che la fattoria possa continuare a riprodursi.

### 🛠️ Tecnologie Utilizzate

React (Hooks: useState, useEffect, useMemo, useRef)

TypeScript (Tipizzazione rigorosa per entità e inventario)

Lucide React (Set di icone per l'interfaccia grafica e la mappa)

CSS-in-JS / Inline Styles (Gestione dinamica di progress bar e animazioni)
