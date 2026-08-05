# BVC Webapp — UI/UX Design Referentie (React-architectuur)
*Basis: bvc_actielijst_v17.html, aangevuld met later ontworpen schermen (Startscherm, Klantoverzicht, Huurdersmutaties) | bijgewerkt 3 augustus 2026*

Dit document dekt **alles wat in deze chat is ontworpen en goedgekeurd**, niet alleen v17. De **visuele tokens (kleuren, maten, typografie) uit v17 zijn ongewijzigd** — dat is getest en goedgekeurd. Sectie 5b bevat schermen die ná v17 zijn ontworpen (in mockups, nooit in de single-file HTML gebouwd) — die specificatie staat er nu ook expliciet in, zodat er geen schermen ontbreken t.o.v. wat is afgesproken.

**Architectuur:**
- `src/styles/tokens.css` — alle CSS custom properties (design-tokens)
- `src/index.css` — component-classes die die tokens gebruiken (`.badge`, `.kaart`, `.filter-pill`, `.avatar-chip`, `.modal`, `.toast`, tabel-styling)
- Componenten (`Badge.tsx`, `AvatarChip.tsx`, `Modal.tsx`, etc.) renderen deze classnamen — **geen inline styles, geen CSS-in-JS**

Elke keer dat een component wordt gebouwd: eerst checken of de classname al in `index.css` bestaat, dan pas een nieuwe toevoegen — nooit een style-object in de component zelf.

---

## 1. `src/styles/tokens.css`

Dit bestand bevat exact de volgende custom properties — 1-op-1 overgenomen uit de goedgekeurde v17-implementatie, niet opnieuw interpreteren:

```css
:root {
  /* Merk */
  --navy: #1a3a5c;         /* primaire kleur: sidebar, headers, startscherm-achtergrond */
  --navy-light: #1e4a7a;   /* hover-state van navy */
  --gold: #c8a84b;         /* accent: subtitels, badges, nadruk */
  --gold-light: #f0e4b8;   /* gouden achtergrond-tint (spaarzaam gebruikt) */

  /* Oppervlakken */
  --surface: #f7f8fa;      /* paginabackground achter kaarten/tabellen */
  --white: #ffffff;        /* kaarten, invoervelden, panelen */
  --border: #e2e6ed;       /* standaard scheidingslijnen */
  --border-strong: #c8d0dc;/* invoervelden, nadrukkelijkere randen */

  /* Tekst */
  --text: #1a1a2e;         /* hoofdtekst */
  --text-secondary: #5a6070;
  --text-muted: #9aa0ad;

  /* Status (functioneel, zie sectie 2) */
  --red: #c0392b;
  --red-bg: #fdf0ef;
  --green: #1d7a45;
  --green-bg: #edf7f1;
  --amber: #b06800;
  --amber-bg: #fef5e4;
  --blue-bg: #edf2fb;      /* hover-achtergrond op rijen */

  /* Vorm */
  --radius: 6px;
  --shadow: 0 2px 8px rgba(26,58,92,0.08);

  /* Typografie */
  --font-base: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
```

**Controlepunt voor Claude Code:** als `tokens.css` al bestaat maar met andere waarden — dit zijn de correcte, goedgekeurde waarden. Overschrijven, niet samenvoegen met eigen aannames.

---

## 2. Kleurbetekenis (functioneel, niet decoratief)

| Kleur | Token | Betekenis |
|---|---|---|
| Rood | `--red` | Actie vereist — status "Open", vertrekkende huurder |
| Groen | `--green` | Afgerond/positief — status "Done", ingaande huurder |
| Amber | `--amber` | Aandacht nodig, nog niet urgent — status "Due" |
| Navy | `--navy` | Merk/structuur — **nooit** als statuskleur |
| Gold | `--gold` | Accent/nadruk — **nooit** als vlakvulling over grote oppervlaktes |

Een nieuwe status of categorie toevoegen? Eerst checken of rood/groen/amber past qua betekenis, voordat er een nieuwe kleur bij komt.

---

## 3. Typografieschaal

Systeemfont (`--font-base`), geen custom lettertype — bewuste keuze voor snelheid/leesbaarheid in een intern zakelijk tool.

| Gebruik | Grootte | Gewicht |
|---|---|---|
| Paginatitel | 19px | 600 |
| Kaarttitel (bijv. startscherm-tegels) | 17px | 600 |
| Sectietitel / naam in lijst | 13–14px | 500–600 |
| Body-tekst, invoervelden | 12–13px | 400 |
| Labels, badges, metadata | 10–11px | 600 (labels) / 400 (metadata) |
| Kolomkoppen (uppercase) | 10px | 600, letter-spacing 0.04–0.05em |

Regel: hoe kleiner de tekst, hoe zwaarder het gewicht bij labels/koppen.

---

## 4. Maatvoering

```
Rijhoogte tabel (actielijst):     38px — VAST, nooit auto-height (zie sectie 6)
Cel binnen rij:                   30px hoog, tekst afgekapt met ellipsis (…) bij overflow,
                                   scrollbaar/volledig zichtbaar bij focus/interactie
Border-radius standaard:          var(--radius) = 6px
Border-radius grote kaarten:      8–14px (klantoverzicht-rijen resp. startscherm-tegels)
Padding kaarten:                  16px (klantoverzicht) tot 36px (startscherm-tegels)
Badge padding:                    2–3px verticaal, 7–9px horizontaal, pill-vorm (border-radius: 20px)
```

---

## 5. Componenten → `src/index.css` classnamen

Elke component hieronder correspondeert met een class in `index.css`. De React-component zelf bevat geen styling-logica, alleen de classname en conditionele varianten via className-samenstelling (bijv. `clsx` of template literals).

### `.badge` → `Badge.tsx`
```css
.badge { border-radius: 20px; padding: 2px 8px; font-size: 11px; font-weight: 600; }
.badge-open  { background: var(--red-bg);   color: var(--red); }
.badge-done  { background: var(--green-bg); color: var(--green); }
.badge-due   { background: var(--amber-bg); color: var(--amber); }
```
```tsx
<Badge variant="open">3 open</Badge>
```
Gebruikt in: klantoverzicht, topbar-statistieken, dashboard.

### `.kaart` → `Card.tsx` (of klant-/startscherm-tegel varianten)
Witte achtergrond, subtiele border of border-left in statuskleur, `border-radius: 8px`. Hover: lichte transform of `background: var(--blue-bg)`.

### Tabelrij met inline-edit cellen → `TableRow.tsx` / `EditableCell.tsx`
**Dit is het belangrijkste patroon in de hele app — hoogste kans op afwijking, dus expliciet:**
- Rijhoogte: **vast 38px**, nooit `height: auto` (bijgewerkt 5 augustus 2026 — was eerder 78px, expliciet gecorrigeerd door de gebruiker)
- Celinhoud die niet past: **afgekapt met ellipsis (…)**, geen wrap — bij focus/interactie met het veld (input/select) is de volledige tekst alsnog bereikbaar (native scroll/caret-gedrag van het veld zelf, of de volledige lijst in een `<select>`/dropdown)
- Focus-state: navy rand + lichte schaduw (`box-shadow` met `--navy` + `--shadow`)
- Dit brak zichtbaar in eerdere HTML-versies (v03–v05) toen cellen auto-height kregen — de hele tabel-layout schoof dan uit elkaar. **Als dit in de React-versie ook gebeurt, is dat exact hetzelfde probleem terug.**

### `.filter-pill` → `FilterPill.tsx`
Rand, geen vulling in rust. `background: var(--navy)` + witte tekst in actieve staat. **Meerdere tegelijk actief kunnen zijn** (bijv. Open + Due beide aan) — dit is een toggle/checkbox-gedrag, geen radiobutton-gedrag. Als filters elkaar uitsluiten in de huidige React-implementatie, is dat een regressie t.o.v. v17.

### `.avatar-chip` → `AvatarChip.tsx`
Ronde chip, 2-letterige afkorting, kleur consistent per naam (bijv. Ton = paars, Seth = groen). Nieuwe teamleden krijgen automatisch een kleur uit de bestaande set — geen handmatige toewijzing nodig.

### `.modal` → `Modal.tsx`
Gecentreerd, `box-shadow: var(--shadow)`, witte achtergrond, `border-radius: 10px`, footer met annuleer/bevestig rechts uitgelijnd. Achtergrond-overlay: `rgba(26,58,92,0.5)`.

### `.toast` → `Toast.tsx`
Onderaan gecentreerd, `background: var(--navy)`, witte tekst, transform-transitie voor in/uit. Alleen voor korte bevestigingen ("Actie toegevoegd") — **nooit voor foutmeldingen die actie vereisen**, die horen inline bij het veld zelf.

---

## 5b. Schermen die nog niet in v17 zaten (later ontworpen, wél goedgekeurd)

Deze schermen zijn in de chat besproken. Ze horen bij dezelfde visuele taal (tokens uit sectie 1). Belangrijk verschil in verificatieniveau tussen de twee:

- **Huurdersmutaties**: gebaseerd op twee losse HTML-mockup-bestanden die zijn teruggelezen en gecontroleerd (zie hieronder) — structuur en kleuren zijn geverifieerd tegen de daadwerkelijke bestandsinhoud.
- **Startscherm**: aanvankelijk alleen tekstueel beschreven, inmiddels **geverifieerd tegen een screenshot** van het daadwerkelijke ontwerp (augustus 2026) — zie hieronder, dit is nu wél pixel-accuraat qua structuur.
- **Klantoverzicht**: nog steeds alleen tekstueel beschreven en besproken in de chat, **niet geverifieerd tegen een visueel bestand**. Zie dit als het beste beschikbare uitgangspunt, niet als pixel-perfecte waarheid — bij twijfel tijdens het bouwen, terugvragen in de chat waar dit is ontworpen.

### Startscherm → `StartScreen.tsx`
Landingspagina met twee gelijkwaardige keuzetegels: **"Actielijsten"** en **"Huurdersmutaties"**. Geverifieerd tegen screenshot.
- Achtergrond: `var(--navy)`, volledige viewport-hoogte, inhoud verticaal en horizontaal gecentreerd
- Bovenaan gecentreerd: "BVC" (groot, wit, vet) + "VASTGOED CONSULTANTS" als subtitel (kleiner, uppercase, brede letterspacing, kleur `var(--gold)` — exact het gebruik dat sectie 1 al voorschrijft: "Gold: accent voor subtitels")
- Twee tegels naast elkaar (desktop): witte achtergrond, groter border-radius en padding dan de standaard `.kaart` (14px / 36px, conform de metrics in sectie 1: "Border-radius grote kaarten" en "Padding kaarten... tot 36px (startscherm-tegels)")
- Elke tegel: een icoon (lijnstijl, geen foto's) boven de titel — een afvinkbox voor "Actielijsten", een huisje voor "Huurdersmutaties" — dan de titel (navy, 17px/600) en een korte grijze omschrijving (12px)
- Klik op "Actielijsten" → navigeert naar de sidebar-shell (Klantoverzicht als hoofdweergave, niet direct een klant openen)
- Klik op "Huurdersmutaties" → navigeert direct naar de maandweergave (geen tussenstap, want er is geen "klant" om eerst te kiezen)
- Dit scherm heeft geen sidebar en geen "terug"-link — het is het startpunt

### Klantoverzicht → `KlantOverzicht.tsx`
Tussenscherm tussen Startscherm en de individuele actielijst van een klant. Doel: in één oogopslag zien welke klanten aandacht nodig hebben, ook bij veel klanten.
- Compacte lijst (geen grote kaarten) — elke rij: klantnaam, status-badges (open/due-telling), laatste versiedatum
- Zoekbalk bovenaan, filtert live op klantnaam
- **Sorteerbare kolommen** — met name klantnaam én **laatste versiedatum** moeten beide te sorteren zijn (oplopend/aflopend), dit was een expliciete eis
- Klik op een rij → navigeert naar de actielijst van die klant (bestaand v17-scherm)
- "← Terug naar start" bovenaan, conform het navigatie-principe uit sectie 6

### Huurdersmutaties → `Huurdersmutaties.tsx` + submodule
Los van de actielijst-module, eigen datamodel (huurders in/uit, geen "acties"). Gebaseerd op de goedgekeurde mockups (`huurdersmutatie_invoer_mockup.html`, `huurdersmutaties_mockup.html`, beide 15 juli).

**⚠️ Kleurmigratie — expliciet bevestigd, niet vanzelfsprekend:**
Deze twee mockups zijn ouder dan v17 en gebruiken een eerdere kleuriteratie: primair `#1a4fa0` (helderder blauw) in plaats van `--navy` (`#1a3a5c`), en `#27ae60`/`#e67e22` in plaats van `--green`/`--amber`. **Afgesproken: bij het bouwen gebruik je overal de huidige tokens uit sectie 1**, dus vervang in onderstaande structuur elke `#1a4fa0` door `var(--navy)`, elke `#27ae60` door `var(--green)`, elke `#e67e22` door `var(--amber)`. De structuur/layout van de mockups blijft wel leidend — alleen de kleurwaarden migreren.

**Overzichtsweergave — 3-koloms grid, niet 2:**
```
grid-template-columns: 1fr 44px 1fr;
```
- Links: ingaande huurder, rechts: vertrekkende huurder, **midden: een pijl-kolom** (↔ of →, kleur `--text-muted`, niet decoratief weggelaten — dit visualiseert de mutatie als overdracht van dezelfde locatie)
- Gegroepeerd per maand, nieuwste maand bovenaan, maandheader met lichte achtergrond (`--blue-bg`) en telling rechts uitgelijnd
- Kolomkoppen boven de rijen: "Vertrekkend" / "Ingaand" in uppercase, 10px, conform sectie 3
- Elke zijde toont: locatienaam (bold), sub-label (bijv. bedrijfsnaam), huurdernaam in statuskleur (rood voor vertrekkend, groen voor ingaand), eventueel datum/reden/huurprijs als kleinere regels eronder
- Status-tags per mutatie: bijv. "Bevestigd" (`--green-bg`/`--green`), "Leegstand verwacht" (`--amber-bg`/`--amber`) — gebruik de bestaande `.badge`-component uit sectie 5, niet een eigen tag-stijl
- Lege zijde (nog geen huurder bekend): `--text-muted`, cursief, conform het "lege staten wijzen naar actie"-principe

**Statistiekenrij (ontbrak eerder in dit document, wél in de mockup):**
Boven de maandenlijst: 4 stat-cards naast elkaar (`grid-template-columns: repeat(4, 1fr)`), elk met een label en een grote waarde. Kleurcodering van de waarde volgt hetzelfde rood/groen/amber-systeem als de rest van de app.

**Invoerflow (`MutatieInvoer.tsx`) — slide-in paneel, geen modal:**
- Layout: de bestaande lijst blijft zichtbaar maar gedimd (`filter: brightness(0.92)` + lichte overlay), paneel schuift in vanaf rechts, vaste breedte (~420px op desktop)
- Paneel-header met titel + sluitkruisje
- **Stap-indicator bovenaan** — cirkels genummerd, met status done/actief/todo (respectievelijk groen/navy/grijs gevuld), verbonden door lijnen die meekleuren met de voortgang
- Gedimde achtergrond-lijst toont ter context het object waar de mutatie bij hoort
- Formuliervelden: label boven het veld (11px, `--text-muted`), input met `--border-strong`-rand, focus-state navy
- Radiogroep voor vaste keuzevelden (bijv. reden van vertrek) — pill-vormig zoals `.filter-pill`, maar **hier bewust exclusief** (uitzondering op de "filters zijn optellend"-regel uit sectie 6, want dit is een dataveld met precies één geldige waarde, geen filter)
- Hint-vak voor optionele/uit te stellen stappen: gestreepte rand, lichte navy-tint achtergrond, met icoon — voor bijv. "nog geen nieuwe huurder bekend, later aan te vullen"
- Footer: Annuleren / Vorige / Opslaan, rechts uitgelijnd, primaire knop in `--navy`

**Belangrijk verschil met de actielijst-tabel:** dit scherm gebruikt geen 38px-vaste-rij-patroon — het is een leesweergave + apart invoerpaneel, geen bewerkbare tabel. Pas sectie 5's tabelregels hier niet automatisch toe.

### Versiebeheer-paneel → `VersieBeheerPaneel.tsx`
**Functionele specificatie (datamodel, flow, wanneer dit opent) staat in `BVC_WEBAPP_PROJECT_v03.md`** — dit is alleen de visuele kant.
- Zelfde slide-in patroon als `MutatieInvoer.tsx`: paneel vanaf rechts, vaste breedte, achtergrond gedimd
- Lijst van versies: elk item als compacte kaart (naam, datum, aanwezigen), klikbaar
- Bij het openen van een specifieke versie: **duidelijke read-only banner bovenaan** (bijv. lichte amber-achtergrond met tekst "Je bekijkt een eerdere versie — read-only" + knop "Terug naar actuele lijst") — dit voorkomt dat iemand per ongeluk denkt dat hij de live lijst bewerkt
- De snapshot-tabel zelf: **geen `EditableCell`/`.cel-scroll`-componenten** — gewone statische tekst-weergave, want dit is bevroren data. Gebruik hier dus bewust niet het inline-edit-patroon uit sectie 5.

### Navigatie-update (augustus 2026): sidebar ván binnen de Actielijsten-tak
**Dit vervangt de "Navigatie is hiërarchisch"-regel in sectie 6 en checklist-item 1 in sectie 9 hieronder.** Op basis van de v17-referentie (`bvc_actielijst_v17.html`) is besloten: zodra je vanuit `StartScreen` voor "Actielijsten" kiest, kom je in een **persistente linker-sidebar** (altijd zichtbaar zolang je in de Actielijsten-tak zit) met:
- BVC-logo/branding bovenaan
- Menu: Actielijst / Mijn acties / Dashboard (de laatste twee: nog te bouwen, zie projectdocument)
- Een altijd-zichtbare klantenlijst met open-acties-teller per klant, zodat je zonder tussenscherm kunt wisselen
- "+ Nieuwe actielijst" onderaan

**Correctie (deze versie):** eerder stond hier dat `StartScreen.tsx` als apart landingsscherm zou vervallen — dat is teruggedraaid nadat de gebruiker alsnog een screenshot van het daadwerkelijke ontwerp aanleverde (zie hieronder). `StartScreen` bestaat dus wél, als eerste scherm ná inloggen, vóór de sidebar. De Klantoverzicht-inhoud (zoekbalk, sorteerbaar op naam en laatste versiedatum) blijft bestaan als hoofdweergave in de content-area ván de sidebar-shell, niet als los tussenscherm. `Huurdersmutaties` is vanaf `StartScreen` bereikbaar; zodra dat scherm gebouwd is, komt er ook een sidebar-menu-item voor als je er al in zit.

---

## 6. UX-principes (architectuur-onafhankelijk, gelden ook in React)

**Inline boven modal.** Actielijst-cellen zijn direct bewerkbaar in de tabel, geen apart bewerkscherm. In React: `EditableCell` met lokale state + onBlur/onChange die naar Firestore schrijft, geen aparte edit-route of modal voor veldwijzigingen.

**Automatisch boven handmatig, maar altijd overschrijfbaar.** Due date = berekend (invoerdatum + doorlooptijd), maar het veld blijft een normaal bewerkbaar inputveld — geen readonly-berekend veld.

**Bevestiging bij niet-vanzelfsprekende acties.** Kolomnaam wijzigen vereist een tussenstap (bevestigen), voorkomt onbedoelde wijziging aan gedeelde structuur.

**Filters zijn optellend (OR), niet exclusief.** Zie `.filter-pill` hierboven — dit is de meest waarschijnlijke plek waar "het lijkt er niet op" vandaan komt als filters nu als radiobuttons werken.

**Navigatie is hiërarchisch met expliciete terug-link.** `StartScreen` → `KlantOverzicht` → klant-detail (bestaande actielijst-tabel), elke laag heeft een zichtbare "← Terug", nooit alleen de browser-back-knop. `Huurdersmutaties` is een aparte tak direct vanaf `StartScreen`, geen tussenscherm nodig.

**Lege staten wijzen naar de eerstvolgende actie**, niet alleen "geen data" tonen.

---

## 7. Schrijfstijl (Nederlands, zakelijk-informeel)

- Directe werkwoordsvorm: "Opslaan", "Uitstellen met 2 weken" — niet "Verzenden" of "OK"
- Labels benoemen wat de gebruiker beheert: "Verantwoordelijke", niet een technische veldnaam
- Foutmeldingen kort, zonder verontschuldiging: "Vul minimaal een actiepunt in"
- Toon als collega, niet als software: "Actie toegevoegd", "Uitgesteld met 4 weken"

---

## 8. Wat NIET te doen

- **Geen auto-height tabelrijen** — meest waarschijnlijke oorzaak van visuele afwijking, zie sectie 5
- **Geen losse hex-waarden** buiten `tokens.css` — als een component een kleur "erbij verzint", is dat een fout, geen keuze
- **Geen inline styles of CSS-in-JS** — alles via classnamen uit `index.css`, dat was expliciet de architectuurkeuze
- **Geen radiobutton-gedrag bij filters** die optelbaar moeten zijn
- **Geen aparte edit-schermen** voor iets dat inline kan — dit is een invoertool voor tijdens vergaderingen
- **Geen decoratieve animaties** — alleen functionele transitions (hover, paneel in/uit)

---

## 9. Debug-checklist: "het lijkt er niet op"

Loop dit na in de React-implementatie, in volgorde van waarschijnlijkheid:

1. **Bestaan `StartScreen` (met de twee keuzetegels) én de sidebar-navigatie binnen de Actielijsten-tak** (logo, menu, altijd-zichtbare klantenlijst) — zie de "Navigatie-update"-notitie in sectie 5b. Als er direct wordt ingelogd op de sidebar/actielijst-tabel zonder het startscherm ertussen, mist er een navigatielaag.
2. **Bestaat `tokens.css` en wordt het daadwerkelijk geïmporteerd** in de root van de app (bijv. `main.tsx` of `App.tsx`)?
3. **Gebruiken de componenten de classnamen uit `index.css`**, of zijn er per ongeluk inline styles / Tailwind-utility-classes gebruikt die de tokens negeren?
4. **Tabelrijen (alleen de actielijst!): vaste hoogte (38px) of auto-height?** Dit geldt niet voor Huurdersmutaties, dat heeft een ander patroon (zie sectie 5b).
5. **Filters: optelbaar of exclusief?** Zie sectie 6. Let op: dit geldt voor status/verantwoordelijke-filters, niet voor het reden-van-vertrek-veld in de mutatie-invoer, dat is bewust wél exclusief.
6. **Kleurwaarden: exact de hex-codes uit sectie 1, of zijn het benaderingen/Tailwind-standaardkleuren** (bijv. `blue-600` in plaats van `--navy`)?
7. **Klantoverzicht: is sorteren op laatste versiedatum daadwerkelijk geïmplementeerd**, niet alleen op naam? Dit was een expliciete eis, makkelijk over het hoofd te zien.
8. **Huurdersmutaties: is de originele mockup-kleur (`#1a4fa0` e.d.) per ongeluk letterlijk overgenomen** in plaats van gemigreerd naar de huidige tokens (`--navy` etc.)? Zie de kleurmigratie-notitie in sectie 5b — dit is een reële valkuil omdat de mockup-bestanden zelf de oude kleuren bevatten.
9. **Huurdersmutaties: staat de pijl-kolom (midden, 44px) er nog in**, of is het per ongeluk teruggebracht tot een simpele 2-koloms layout?
10. **Versiebeheer: bestaat "Vergadering afsluiten" als actie, en wordt daarbij daadwerkelijk een snapshot naar Firestore geschreven?** Dit is functioneel het hele bestaansrecht van de rebuild en dus makkelijk over het hoofd te zien als er alleen naar de tabel-UI wordt gekeken.

---

## 10. Voor Claude Code — importvolgorde bij het bouwen

1. Lees dit document volledig voordat je een component bouwt of aanpast
2. Check of `tokens.css` overeenkomt met sectie 1 — zo niet, corrigeer naar deze waarden
3. Check of `index.css` de componentclasses uit sectie 5 al bevat — hergebruik, verzin niets nieuws
4. Bouw de React-component met alleen classname-references, geen eigen styling
5. Toets tegen sectie 6 (UX-principes) voordat de component als "klaar" wordt beschouwd
