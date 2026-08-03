# BVC Webapp — Projectdocument
*BVC Vastgoed Consultants | Laatste update: 17 juli 2026*

---

## Doel

Webbased vervanger voor Excel-actielijsten per klant. Single-file HTML met localStorage, zelfde aanpak als de VastgoedInspectie PWA. Later Firebase + login.

Het team werkt nu met losse Excel-bestanden per klant per vergadering. Probleem: altijd de verkeerde versie openen, geen centraal overzicht, geen dashboard per teamlid.

---

## Team

Vaste namen in de app: **Ton, Seth, Gertjan, Marjan, Eigenaar** (uitbreidbaar via ⚙-icoon in de app zelf).
Margriet is eigenaar en maakt geen deel uit van de BVC-organisatie — niet opnemen als teamlid.

---

## Applicatie — structuur

**Startscherm** — twee keuzes: Actielijsten of Huurdersmutaties.

**Actielijsten-tak:**
Startscherm → Klantoverzicht (lijst van alle klanten, sorteerbaar op naam en laatste versie, zoekbalk, filter "met due") → Actielijst van geselecteerde klant (huidige app met zijbalk, Mijn acties, Dashboard, Versiebeheer).

**Huurdersmutaties-tak:**
Startscherm → direct het maandoverzicht (geen tussenscherm).

---

## Module 1: Actielijsten (HOOFD — hoogste prioriteit)

**Wat het moet doen:**
- Actielijsten per klant bijhouden
- Inline bewerken direct in de lijst (zoals Excel)
- Acties worden automatisch **Due** als de due date verstreken is (zie datastructuur)
- Uitstellen met 1/2/3/4 weken of 1–6 maanden
- Nieuwe actielijst aanmaken bij nieuwe klant (modal met naam, vergadering, datum, aanwezigen)
- Versiebeheer: bij afsluiten vergadering → snapshot opslaan (naam, datum, aanwezigen, read-only)
- Excel-import van bestaande actielijsten (kolomherkenning op headernamen)
- Print (nette opmaak, BVC-koptekst)
- Excel-export met SheetJS (kolombreedtes, bevroren header)

**Datastructuur acties:**
```
id, klantId, ref, onderwerp, vestiging, actie, verantw (array van namen, multi-select),
aangemaaktOp (= invoerdatum, handmatig wijzigbaar), doorlooptijd (1w/2w/3w/4w/1m/2m/3m/4m/5m/6m),
dueDateOverride (handmatige due date, overschrijft berekening), postponedTot (via uitstel-knop, wint van override),
status (open/done/hold, uitbreidbaar via ⚙), opmerking, vergadering_id
```

**Due date berekening:** postponedTot (indien gezet) → dueDateOverride (indien gezet) → anders aangemaaktOp + doorlooptijd

**Bedrijfsregel Due:** status=open EN due date verstreken. **On hold negeert Due-status altijd.**

**Kolomnamen** (Onderwerp/Vestiging/Actiepunt/Opmerking) zijn hernoembaar via klik-op-kolomkop → ballon → bevestigen.
**Verantwoordelijken en statussen** zijn uitbreidbaar via ⚙-icoon in kolomkop.
**Alle kolommen zijn sorteerbaar** door op de kolomkop te klikken (nogmaals klikken keert de richting om).

**Schermen:**
- Klantoverzicht (nieuw in v17) — lijst van alle klanten, sorteerbaar op naam en laatste versiedatum
- Actielijst per klant
- Mijn acties (per teamlid, over alle klanten)
- Dashboard (totaalcijfers + per klant + per teamlid)
- Versiebeheer (sidebar panel)

**Bron Excel:** Actielijst_Malcon_-_BVC_6_mei_2026.xls
Kolommen: Ref · Datum · Onderwerp · Bedrijf · Vestiging · Actiepunt · Verantw. · Gereed op · Status · Informant · Opmerking

---

## Module 2: Huurdersmutaties (v17 — nieuw gebouwd)

**Wat het doet:**
- Chronologische lijst van ingaande en vertrekkende huurders, nieuwste maand bovenaan
- Per maand: links ingaand (groen), rechts vertrekkend (rood) — zoals de Excel-sheet
- Inline invoer via "+ Ingaand toevoegen" / "+ Vertrekkend toevoegen" per maand
- Autocomplete op locatie en administratie (groeit mee met ingevoerde waarden, typt mee vanaf eerste letter)
- Jaar toevoegen via "+ Jaar" knop
- Filter op jaar + zoekbalk (naam, locatie, administratie)
- Dubbelklik op een mutatie-kaart om te bewerken
- Stats bovenin: ingaand, vertrekkend, netto, totaal (voor het geselecteerde jaar/filter)

**Datastructuur mutaties:**
```
id, richting (in/uit), jaar, maand (1-12), datum (ISO, optioneel), naam, locatie, administratie, opmerking
```

**Nog niet gebouwd (Sprint 6):** Print + Excel-export voor mutaties, toekomstige mutaties expliciet visueel onderscheiden (2027+).

**Bron Excel:** Huurders_mutaties_BVC.xlsx
- Sheet "2022": alle jaren 2022 t/m 2026+ op één sheet
- Twee kolomblokken naast elkaar: Ingaand (datum, jaar, naam, locatie, administratie, opmerking) + Vertrekkend (idem)
- Sheet "Kandidaat huurders": vervalt, niet opgenomen

---

## Technische aanpak

- **Single-file HTML** met alle CSS en JS erin
- **localStorage** voor data (geen server nodig)
- **SheetJS** (cdnjs) voor Excel-export/import client-side
- **Versienummering:** bvc_actielijst_v01.html, v02.html, etc. — zelfde principe voor de .md documenten (v02, v03, ...)
- **Later:** Firebase + login (niet in scope huidige sprints)
- **Werkwijze:** mockup goedkeuren → bouwen → versie opleveren, direct naar Google Drive geüpload

---

## Huisstijl / design tokens

```
--navy:       #1a3a5c   (primaire kleur, sidebar, headers, startscherm-achtergrond)
--navy-light: #1e4a7a
--gold:       #c8a84b   (accent, CTA knoppen)
--gold-light: #f0e4b8
```

Statuskleurcodering:
- Open → rood
- Done → groen
- On hold → amber/geel
- Due → oranje
- Huurdersmutaties: ingaand → groen, vertrekkend → rood

---

## Sprint planning

### Afgerond
- [x] v01 — Actielijst basismodule
- [x] v02 — Nieuwe actielijst aanmaken (modal), Print, Excel-export
- [x] v03–v13 — Opmerking-kolom, multi-select verantwoordelijke, doorlooptijd/due date, sortering, kolommen hernoembaar, uitbreidbare statussen/teamleden
- [x] v14–v16 — Excel-import met automatische kolomherkenning, klantenteller-bugfix, combineerbare filters (status + verantwoordelijke)
- [x] v17 — Startscherm, Klantoverzicht (sorteerbaar op naam + laatste versie), volledige Huurdersmutaties module (maandweergave, inline invoer, autocomplete, jaar toevoegen, filters)

**Huidige werkversie: bvc_actielijst_v17.html — dit is de vaste basis voor de volgende sprint.**

### Sprint 6 — Huurdersmutaties afwerken
- [ ] Print + Excel export voor mutaties
- [ ] Toekomstige mutaties (2027+) visueel onderscheiden
- [ ] Eventuele verbeteringen na gebruikstest v17

### Sprint 7 — Polish
- [ ] Algehele bugfixes na gebruik door team
- [ ] Firebase + login verkennen (nog niet gepland)

---

## Bestanden

| Bestand | Beschrijving |
|---|---|
| bvc_actielijst_v17.html | **Huidige werkversie** — startscherm, klantoverzicht, volledige huurdersmutaties module |
| BVC_WEBAPP_PROJECT_v03.md | Dit document |
| BVC_INSTRUCTIE_v02.md | Werkinstructie (ongewijzigd sinds v02, zie Drive) |

**Belangrijk:** blijf werken vanuit hetzelfde geopende HTML-bestand — elk los bestand heeft zijn eigen localStorage-opslag. Nieuwe versies starten met lege/demo-data.

**Versiebeheer documenten:** elke bijwerking van dit document en de instructie krijgt een nieuw versienummer (v02, v03, ...) — nooit overschrijven, altijd nieuw bestand aanmaken in Google Drive. Oude versies mag de gebruiker zelf verwijderen.

Drive-map: https://drive.google.com/drive/folders/1Ep3WFddh1vqk_C-gZRizX2Bb3zt4jLjU

---

## Openstaande vragen / beslissingen

- Excel-import: automatische kolomherkenning werkt, nog niet getest met meerdere klantbestanden tegelijk
- Huurdersmutaties Excel-import: nog niet gebouwd — bron-Excel is al wel geanalyseerd
- Administratie huurdersmutaties: vrij typen, autocomplete op eerder ingevoerde waarden (bevestigd)
