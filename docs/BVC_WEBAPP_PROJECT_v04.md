# BVC Webapp — Projectdocument
*BVC Vastgoed Consultants | Laatste update: 5 augustus 2026*

**Dit is v04.** Vervangt v03: de bouw is halverwege v03 overgestapt van het single-file HTML/localStorage-prototype naar een echte React + Firebase-webapp op GitHub. Dit document beschrijft die nieuwe technische aanpak en de actuele sprintstatus. De functionele spec (wat de app moet doen) uit v03 blijft grotendeels overeind en is hieronder overgenomen/bijgewerkt.

---

## Doel

Webbased vervanger voor Excel-actielijsten per klant.

Het team werkte met losse Excel-bestanden per klant per vergadering. Probleem: altijd de verkeerde versie openen, geen centraal overzicht, geen dashboard per teamlid.

**Techniekkeuze (bijgewerkt in v04):** het single-file HTML/localStorage-prototype (`bvc_actielijst_v17.html`) diende als goedgekeurde functionele referentie/mockup. De daadwerkelijke bouw is een **React + Vite + TypeScript**-webapp met **Firebase** (Authentication + Firestore) als backend, in een GitHub-repository (`Sethos21/actielijst-online`) met CI/CD via GitHub Actions. `bvc_actielijst_v17.html` blijft in `docs/` staan als referentiemateriaal voor exact gedrag/opmaak, maar is geen levende code meer.

---

## Team

Vaste namen in de app: **Ton, Seth, Gertjan, Marjan, Eigenaar** (`src/features/team/teamleden.ts`).
Margriet is eigenaar en maakt geen deel uit van de BVC-organisatie — niet opnemen als teamlid.

Inloggen is gedeeld: één Firebase Auth-account per teamlid volstaat, alle Firestore-data is leesbaar/schrijfbaar voor elke ingelogde gebruiker (geen per-gebruiker scoping — het is één team dat dezelfde klanten deelt). Zelfregistratie is bewust **niet** mogelijk vanuit de inlogpagina; accounts worden buiten de app om aangemaakt.

---

## Applicatie — structuur

**Startscherm** — twee keuzes: Actielijsten of Huurdersmutaties.

**Actielijsten-tak:** persistente linker-sidebar (logo, menu **Actielijst / Mijn acties / Dashboard**, altijd-zichtbare klantenlijst met open-acties-teller). Binnen deze sidebar-shell wissel je van weergave zonder tussenscherm:
- **Actielijst** (= Klantoverzicht als geen klant geselecteerd is, anders de actielijst van de geselecteerde klant)
- **Mijn acties** — overzicht per teamlid, over alle klanten heen
- **Dashboard** — totaalcijfers + per klant + per teamlid, over alle klanten heen

**Huurdersmutaties-tak:** Startscherm → direct het maandoverzicht (geen tussenscherm, geen sidebar).

---

## Module 1: Actielijsten (HOOFD — hoogste prioriteit)

**Wat het moet doen:**
- Actielijsten per klant bijhouden
- Inline bewerken direct in de lijst (zoals Excel)
- Acties worden automatisch **Due** als de due date verstreken is (zie datastructuur)
- Uitstellen met 1/2/3/4 weken of 1–6 maanden
- Nieuwe actielijst aanmaken bij nieuwe klant
- Versiebeheer: bij afsluiten vergadering → snapshot opslaan (naam, datum, aanwezigen, read-only)
- Excel-import van bestaande actielijsten (kolomherkenning op headernamen)
- Print (nette opmaak, BVC-koptekst)
- Excel-export met SheetJS (kolombreedtes)

**Datastructuur acties** (`src/features/acties/types.ts`, Firestore-collectie `acties`):
```
id, klantId, ref, onderwerp, bedrijf, vestiging, actie, verantw (string[], multi-select),
aangemaaktOp (ISO-datum, handmatig wijzigbaar), doorlooptijd (1w/2w/3w/4w/1m/2m/3m/4m/5m/6m),
dueDateOverride? (handmatige due date, overschrijft berekening),
postponedTot? (via uitstel-knop, wint van dueDateOverride),
status (open/done/hold), opmerking, vergadering_id?
```

**Due date berekening** (`src/features/acties/dueDate.ts`): postponedTot (indien gezet) → dueDateOverride (indien gezet) → anders aangemaaktOp + doorlooptijd.

**Bedrijfsregel Due:** status=open EN due date verstreken. **On hold negeert Due-status altijd, ongeacht de datum** — dit is een expliciete regel, geen uitzondering die vergeten mag worden (zie `isDue()`).

### Versiebeheer

**Datamodel (Firestore):** `/klanten/{klantId}/versies/{versieId}` — `naam`, `datum`, `aanwezigen`, `snapshot` (kopie van alle acties op moment van afsluiten, geen referentie), `aangemaaktDoor`.

**Flow:** "Vergadering afsluiten" → modal (naam, datum, aanwezigen) → bij bevestigen worden alle huidige acties gekopieerd naar een nieuw `versies`-document. De actielijst zelf verandert niet — dit is een archief-moment, geen reset.

**Weergave:** zijpaneel vanuit de actielijst-tabel, lijst van eerdere versies (nieuwste boven), klik toont de snapshot read-only met een banner ("Je bekijkt de versie van ... — read-only") en een knop terug naar de actuele lijst.

**Schermen — status:**
- Klantoverzicht — **gebouwd**, sorteerbaar op naam en laatste versiedatum, zoekbalk
- Actielijst per klant — **gebouwd**
- Mijn acties (per teamlid, over alle klanten) — **gebouwd**
- Dashboard (totaalcijfers + per klant + per teamlid) — **gebouwd**
- Versiebeheer (sidebar panel) — **gebouwd**

**Bron Excel (referentie voor kolomherkenning bij import):** Actielijst_Malcon_-_BVC_6_mei_2026.xls
Kolommen: Ref · Datum · Onderwerp · Bedrijf · Vestiging · Actiepunt · Verantw. · Gereed op · Status · Informant · Opmerking

---

## Module 2: Huurdersmutaties

**Wat het doet:**
- Chronologische lijst van ingaande en vertrekkende huurders, nieuwste maand bovenaan
- Per maand: links ingaand (groen), rechts vertrekkend (rood)
- Inline invoer via "+ Ingaand toevoegen" / "+ Vertrekkend toevoegen" per maand
- Autocomplete op locatie en administratie
- Jaar toevoegen via "+ Jaar" knop (Firestore-doc `instellingen/mutatiesJaren`)
- Filter op jaar + zoekbalk (naam, locatie, administratie)
- Klik op een mutatie-kaart om te bewerken
- Stats bovenin: ingaand, vertrekkend, netto, totaal (voor het geselecteerde jaar/filter)
- **Print + Excel-export** — **gebouwd**: dezelfde print-header/no-print-CSS en SheetJS-aanpak als de Actielijst-module, export chronologisch gesorteerd, bestandsnaam bevat jaarlabel + datum

**Datastructuur mutaties** (Firestore-collectie `mutaties`):
```
id, richting (in/uit), jaar, maand (1-12), datum (ISO, optioneel), naam, locatie, administratie, opmerking
```

**Nog open:** toekomstige mutaties (2027+) visueel onderscheiden.

**Bron Excel:** Huurders_mutaties_BVC.xlsx (sheet "2022": alle jaren op één sheet, twee kolomblokken naast elkaar).

---

## Technische aanpak (bijgewerkt in v04)

- **Frontend:** React + Vite + TypeScript (`src/features/*` per domein, pure logica gescheiden van componenten en met eigen unit-tests)
- **Backend:** Firebase — Authentication (e-mail/wachtwoord, gedeeld teamaccount-model) + Firestore (collecties `klanten`, `acties`, `klanten/{id}/versies`, `mutaties`, `instellingen/mutatiesJaren`)
- **Firestore-rules:** gedeelde teamtoegang — `allow read, write: if request.auth != null` (geen per-gebruiker scoping, bewust)
- **Hosting:** Firebase Hosting
- **Excel-export/import:** SheetJS (`xlsx`-package), client-side
- **Repository:** GitHub, `Sethos21/actielijst-online`
- **CI/CD:** GitHub Actions — `build-and-test` (lint, unit-tests, `tsc -b && vite build`) op elke PR, `deploy-preview` (Firebase Hosting preview-URL per PR), deploy naar productie + Firestore-rules bij merge naar `main`
- **Werkwijze:** elke sprint/feature op een eigen branch vanaf de laatste `main`, draft PR, CI groen krijgen, pas mergen na (impliciete of expliciete) goedkeuring
- **Testen:** unit-tests (Vitest + Testing Library) voor elke wijziging; voor navigatie-/integratiegedrag dat niet met unit-tests te vangen is, handmatige verificatie met de Firebase Emulator Suite (Firestore + Auth) en Playwright, altijd gevolgd door opruimen van de tijdelijke test-infrastructuur

`bvc_actielijst_v17.html` blijft bestaan als goedgekeurde functionele/visuele referentie (met name voor Huurdersmutaties-gedrag), maar wordt niet meer uitgevoerd — de React-app is de enige levende code.

---

## Huisstijl / design tokens

Vastgelegd in `src/styles/tokens.css` (brontokens) en toegelicht in `BVC_UI_UX_DESIGN.md`:
```
--navy:       #1a3a5c   (primaire kleur, sidebar, headers)
--navy-light: #1e4a7a
--gold:       #c8a84b   (accent)
--red / --green / --amber / --yellow  (status- en Huurdersmutaties-kleuren)
```

Statuskleurcodering:
- Open → rood
- Done → groen
- On hold → grijs/neutraal
- Due → amber
- Huurdersmutaties: ingaand → groen, vertrekkend → rood

---

## Sprint planning (bijgewerkt in v04)

### Afgerond (React + Firebase-rebuild)
- [x] Scaffolding: React+Vite app, Firebase-integratie, CI/CD (GitHub Actions: build-and-test, deploy-preview, deploy-to-production)
- [x] Datamodel klanten/acties + due-date-logica, Actielijst-scherm per klant
- [x] Design tokens + basiscomponenten (Badge, avatar-chip, modal, toast)
- [x] Excel-import (kolomherkenning) + Excel-export + print voor Actielijst
- [x] Klantoverzicht-vernieuwing (sorteerbaar, zoekbalk)
- [x] Huurdersmutaties-module (maandweergave, inline invoer, autocomplete, jaar toevoegen, filters) + bugfixes na handmatig testen
- [x] Mijn acties — overzicht per teamlid over alle klanten heen
- [x] Huurdersmutaties: print + Excel-export
- [x] Dashboard — totaalcijfers + per klant + per teamlid

### Nog open
- [ ] Huurdersmutaties: toekomstige mutaties (2027+) visueel onderscheiden
- [ ] Algehele bugfixes/polish na gebruik door team

---

## Bestanden

| Bestand/map | Beschrijving |
|---|---|
| GitHub-repo `Sethos21/actielijst-online` | **Bron van waarheid** — alle code, via PR's per feature/sprint |
| `docs/bvc_actielijst_v17.html` | Goedgekeurde functionele/visuele referentie (niet-levende code) |
| `docs/BVC_WEBAPP_PROJECT_v04.md` | Dit document |
| `docs/BVC_UI_UX_DESIGN.md` | Design tokens en UI/UX-richtlijnen |
| `BVC_INSTRUCTIE_v02.md` | Werkinstructie (ongewijzigd sinds v02, zie Drive) |

**Versiebeheer van dit document:** elke inhoudelijke bijwerking krijgt een nieuw versienummer (v04, v05, ...) — nooit overschrijven, nieuw bestand in `docs/` toevoegen. Oude versies mogen blijven staan als historie (ze staan toch al onder git-versiebeheer).

Drive-map (oudere versies + werkinstructie): https://drive.google.com/drive/folders/1Ep3WFddh1vqk_C-gZRizX2Bb3zt4jLjU

---

## Openstaande vragen / beslissingen

- Excel-import: automatische kolomherkenning werkt, nog niet getest met meerdere klantbestanden tegelijk
- Huurdersmutaties Excel-import: nog niet gebouwd — bron-Excel is al wel geanalyseerd
- Administratie huurdersmutaties: vrij typen, autocomplete op eerder ingevoerde waarden (bevestigd)
- Meerdere feature-PR's kunnen tegelijk open staan (elk vanaf `main` getakt); bij overlappende bestanden (met name `Sidebar.tsx`/`App.tsx` voor nieuwe sidebar-weergaven) wordt een merge-conflict pas opgelost op het moment dat de tweede PR daadwerkelijk gemerged wordt — bewuste keuze om features onafhankelijk te kunnen reviewen/mergen
