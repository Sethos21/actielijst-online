# BVC Webapp — UI/UX Design Referentie (React-architectuur)
*Vertaald vanuit bvc_actielijst_v17.html (single-file HTML) naar React + CSS custom properties | 3 augustus 2026*

Dit document is de React-versie van het originele UI/UX-document. De **visuele tokens (kleuren, maten, typografie) zijn ongewijzigd** — dat is wat er is goedgekeurd en getest in v17. Wat is aangepast: hoe die tokens worden geïmplementeerd, nu gemapt naar de bestandsstructuur die je met Claude Code gebruikt.

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
Rijhoogte tabel (actielijst):     78px — VAST, nooit auto-height (zie sectie 6)
Cel binnen rij:                   62px hoog, interne scroll bij overflow
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
- Rijhoogte: **vast 78px**, nooit `height: auto`
- Celinhoud die niet past: interne `overflow-y: auto` binnen de cel, de rij zelf blijft 78px
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

## 6. UX-principes (architectuur-onafhankelijk, gelden ook in React)

**Inline boven modal.** Actielijst-cellen zijn direct bewerkbaar in de tabel, geen apart bewerkscherm. In React: `EditableCell` met lokale state + onBlur/onChange die naar Firestore schrijft, geen aparte edit-route of modal voor veldwijzigingen.

**Automatisch boven handmatig, maar altijd overschrijfbaar.** Due date = berekend (invoerdatum + doorlooptijd), maar het veld blijft een normaal bewerkbaar inputveld — geen readonly-berekend veld.

**Bevestiging bij niet-vanzelfsprekende acties.** Kolomnaam wijzigen vereist een tussenstap (bevestigen), voorkomt onbedoelde wijziging aan gedeelde structuur.

**Filters zijn optellend (OR), niet exclusief.** Zie `.filter-pill` hierboven — dit is de meest waarschijnlijke plek waar "het lijkt er niet op" vandaan komt als filters nu als radiobuttons werken.

**Navigatie is hiërarchisch met expliciete terug-link.** Start → Klantoverzicht → Klant-detail, elke laag heeft een zichtbare "← Terug", nooit alleen de browser-back-knop.

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

1. **Bestaat `tokens.css` en wordt het daadwerkelijk geïmporteerd** in de root van de app (bijv. `main.tsx` of `App.tsx`)?
2. **Gebruiken de componenten de classnamen uit `index.css`**, of zijn er per ongeluk inline styles / Tailwind-utility-classes gebruikt die de tokens negeren?
3. **Tabelrijen: vaste hoogte (78px) of auto-height?** Dit is het meest voorkomende visuele verschil met v17.
4. **Filters: optelbaar of exclusief?** Zie sectie 6.
5. **Kleurwaarden: exact de hex-codes uit sectie 1, of zijn het benaderingen/Tailwind-standaardkleuren** (bijv. `blue-600` in plaats van `--navy`)?

---

## 10. Voor Claude Code — importvolgorde bij het bouwen

1. Lees dit document volledig voordat je een component bouwt of aanpast
2. Check of `tokens.css` overeenkomt met sectie 1 — zo niet, corrigeer naar deze waarden
3. Check of `index.css` de componentclasses uit sectie 5 al bevat — hergebruik, verzin niets nieuws
4. Bouw de React-component met alleen classname-references, geen eigen styling
5. Toets tegen sectie 6 (UX-principes) voordat de component als "klaar" wordt beschouwd
