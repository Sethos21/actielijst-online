# BVC Webapp — Projectinstructie
*Gebruik dit document aan het begin van elke nieuwe chatsessie*

---

## Hoe deze sessie te starten

Upload bij het begin van een nieuwe sessie de volgende bestanden:
1. **BVC_INSTRUCTIE_vXX.md** — laatste versie van dit document (geeft Claude de werkinstructies)
2. **BVC_WEBAPP_PROJECT_vXX.md** — laatste versie van het projectdocument (geeft Claude de actuele stand van zaken)
3. **De laatste versie van de app** — bijv. bvc_actielijst_v16.html (zodat Claude de bestaande code kent)

Alle documenten staan in Google Drive: gebruik altijd het hoogste versienummer.

Zeg daarna: *"Lees de instructie en het projectdocument en vertel me waar we staan."*

---

## Wie is de gebruiker

Vastgoedbeheerder bij BVC Vastgoed Consultants. Beheert dagelijks storingsmeldingen, vastgoedinspecties, administratie en financiële inzichten voor meerdere klanten. Niet technisch — wil resultaten zien, geen uitleg over code.

---

## Wat bouwen we

Een webbased app als vervanger voor Excel-actielijsten per klant. De app bestaat uit twee modules:

**Module 1 — Actielijsten (hoogste prioriteit)**
Per klant een actielijst bijhouden tijdens vergaderingen. Inline bewerken zoals in Excel. Dashboard per teamlid. Versiebeheer per vergadering.

**Module 2 — Huurdersmutaties (lagere prioriteit)**
Chronologisch overzicht van ingaande en vertrekkende huurders per maand. Links ingaand, rechts vertrekkend. Inline invoer met autocomplete.

---

## Technische regels

- **Single-file HTML** — alles (CSS, JS, data) in één bestand
- **localStorage** voor dataopslag — geen server, geen backend
- **SheetJS via cdnjs** voor Excel-export client-side
- **Geen React, geen build tools** — gewone HTML/CSS/JS
- **Versienummering:** bvc_actielijst_v01.html, v02.html, v03.html etc. — zelfde principe voor BVC_INSTRUCTIE en BVC_WEBAPP_PROJECT (_v02.md, _v03.md, ...)
- **Nooit** een bestaande versie overschrijven — altijd een nieuwe versie aanmaken
- **Alle bestanden (HTML én documenten) direct bijwerken in Google Drive** via de create_file tool, met het versienummer in de bestandsnaam
- Huisstijlkleuren: navy `#1a3a5c`, gold `#c8a84b`

---

## Werkwijze

1. **Altijd het projectdocument lezen** voordat je iets bouwt
2. **Nooit zomaar beginnen** — eerst bevestigen wat de sprint inhoudt
3. **Mockup eerst** bij nieuwe schermen of grote wijzigingen, daarna bouwen
4. **Eén sprint per sessie** — niet alles tegelijk
5. **Na elke sprint** het projectdocument updaten (afgevinkt wat klaar is, volgende sprint beschrijven) én als nieuwe versie naar Drive uploaden
6. **Versie opleveren** via present_files zodat de gebruiker het bestand kan downloaden, én naar Drive uploaden
7. **Kort en bondig communiceren** — de gebruiker wil geen lange uitleg, wel duidelijke keuzes voorleggen

---

## Prioriteiten (volgorde)

1. Actielijst Excel-import (bestaande lijsten inladen)
2. Huurdersmutaties module
3. Export + print mutaties
4. Firebase + login (toekomst, niet nu)

---

## Wat niet te doen

- Niet beginnen aan huurdersmutaties zolang de actielijst nog openstaande punten heeft
- Niet Firebase of login aanraken — dat is toekomstwerk
- Niet de huisstijl veranderen zonder expliciete goedkeuring
- Niet meer dan één grote feature per sprint
- Niet vragen om uitleg van technische keuzes tenzij de gebruiker ernaar vraagt

---

## Teamleden en afkortingen

Vaste namen, uitbreidbaar via ⚙-icoon in de app zelf: **Ton, Seth, Gertjan, Marjan, Eigenaar**
Meerdere verantwoordelijken per actie mogelijk (multi-select).
Margriet is eigenaar en maakt geen deel uit van de BVC-organisatie — niet opnemen als teamlid.

---

## Datastructuur acties

```
id            – uniek nummer
klantId       – koppeling aan klant
ref           – referentienummer (vrij)
onderwerp     – categorie/onderwerp (kolomnaam hernoembaar)
vestiging     – locatie/object (kolomnaam hernoembaar)
actie         – omschrijving van het actiepunt (kolomnaam hernoembaar)
verantw       – array van namen (multi-select), lijst uitbreidbaar
aangemaaktOp  – invoerdatum (ISO), handmatig wijzigbaar
doorlooptijd  – 1w/2w/3w/4w/1m/2m/3m/4m/5m/6m
dueDateOverride – handmatige due date (ISO), overschrijft berekening
postponedTot  – via uitstel-knop gezet (ISO), wint van dueDateOverride
status        – open / done / hold, uitbreidbaar via ⚙
opmerking     – vrij tekstveld, scrollbaar (kolomnaam hernoembaar)
vergadering_id – koppeling aan versie/snapshot
```

**Due date berekening (prioriteit):** postponedTot → dueDateOverride → aangemaaktOp + doorlooptijd

**Due-regel:** status=open EN due date verstreken. **On hold-acties worden nooit als Due getoond**, ongeacht due date.

**Sorteren:** alle kolommen sorteerbaar door op kolomkop te klikken; nogmaals klikken keert richting om.

---

## Datastructuur huurdersmutaties

```
id            – uniek nummer
richting      – in / uit
maand         – jan/feb/mrt/apr/mei/jun/jul/aug/sep/okt/nov/dec
jaar          – 2022, 2023, etc.
datum         – specifieke datum (optioneel)
naam          – naam huurder (autocomplete)
locatie       – adres/object (autocomplete)
administratie – portefeuille/beheerder (autocomplete)
opmerking     – vrij tekstveld
```

**Autocomplete-regel:** alle eerder ingevoerde waarden per veld worden onthouden en als suggestie getoond bij typen (eerste letter al).

---

## Bronbestanden

| Bestand | Inhoud |
|---|---|
| Actielijst_Malcon_-_BVC_6_mei_2026.xls | Voorbeeld actielijst Malcon. Kolommen: Ref, Datum, Onderwerp, Bedrijf, Vestiging, Actiepunt, Verantw., Gereed op, Status, Informant, Opmerking |
| Huurders_mutaties_BVC.xlsx | Huurdersmutaties 2022–2026+. Één sheet, twee blokken naast elkaar: ingaand + vertrekkend per maand |

---

## Sprint overzicht

| Sprint | Inhoud | Status |
|---|---|---|
| 1 | Actielijst basismodule | ✅ Klaar (v01) |
| 2 | Nieuwe klant modal, Print, Excel-export | ✅ Klaar (v02) |
| 3 | Opmerking-kolom, multi-verantw, doorlooptijd/due date, sortering, kolommen hernoembaar | ✅ Klaar (v13) |
| 4 | Excel-import, klantenteller-bugfix, combineerbare filters (status + verantw.) | ✅ Klaar (v16) |
| 5 | Huurdersmutaties module | 🔲 Volgende |
| 6 | Export/print mutaties, polish | 🔲 Gepland |

---

## Belangrijke technische waarschuwing

**Elk los HTML-bestand heeft zijn eigen localStorage-opslag.** Als de gebruiker een nieuwe versie opent terwijl hij al klanten/acties had aangemaakt in de vorige versie, lijkt die data "verdwenen" — die staat nog gewoon in het oude bestand. Blijf zoveel mogelijk werken vanuit hetzelfde geopende bestand tijdens een sessie. Meld dit expliciet bij het opleveren van een nieuwe versie.

---

## Versiebeheer documenten (Google Drive)

Zowel BVC_INSTRUCTIE als BVC_WEBAPP_PROJECT worden bijgehouden met versienummers in Google Drive: `_v02.md`, `_v03.md`, enz. Nooit een bestaand Drive-bestand overschrijven — altijd een nieuw bestand met hoger versienummer aanmaken via de create_file tool. De gebruiker kan oude versies zelf verwijderen in Drive.

Drive-map: https://drive.google.com/drive/folders/1Ep3WFddh1vqk_C-gZRizX2Bb3zt4jLjU
