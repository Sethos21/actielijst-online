# BVC Webapp — UI/UX Design Referentie
*Gebaseerd op bvc_actielijst_v17.html | 27 juli 2026*

Dit document heeft twee doelen:
1. **Referentie** — exact vastleggen wat er nu staat (kleuren, maten, componenten), zodat niemand hoeft te gokken
2. **Richtlijn** — hoe nieuwe schermen en features consistent blijven met wat er al is

Gebruik dit bij het bouwen van nieuwe features (ook in Claude Code) om dezelfde visuele taal aan te houden.

---

## 1. Design-tokens (exacte waarden uit de code)

### Kleuren
```css
--navy:         #1a3a5c   /* primaire kleur: sidebar, headers, startscherm-achtergrond */
--navy-light:   #1e4a7a   /* hover-state van navy */
--gold:         #c8a84b   /* accent: subtitels, badges, nadruk */
--gold-light:   #f0e4b8   /* gouden achtergrond-tint (spaarzaam gebruikt) */

--surface:      #f7f8fa   /* paginabackground achter kaarten/tabellen */
--white:        #ffffff   /* kaarten, invoervelden, panelen */
--border:       #e2e6ed   /* standaard scheidingslijnen */
--border-strong:#c8d0dc   /* invoervelden, nadrukkelijkere randen */

--text:         #1a1a2e   /* hoofdtekst */
--text-secondary:#5a6070  /* ondergeschikte tekst */
--text-muted:   #9aa0ad   /* labels, metadata, placeholders */

--red:          #c0392b   /* Open / fout / vertrekkend */
--red-bg:       #fdf0ef
--green:        #1d7a45   /* Done / gereed / ingaand */
--green-bg:     #edf7f1
--amber:        #b06800   /* Due / waarschuwing */
--amber-bg:     #fef5e4
--blue-bg:      #edf2fb   /* hover-achtergrond op rijen */

--radius:       6px       /* standaard afronding: knoppen, kaarten, velden */
--shadow:       0 2px 8px rgba(26,58,92,0.08)   /* zwevende panelen, modals */
```

**Betekenis van kleur is functioneel, niet decoratief:**
- Rood = actie vereist (Open, vertrekkende huurder)
- Groen = afgerond / positief (Done, ingaande huurder)
- Amber = aandacht nodig, maar nog niet urgent (Due, waarschuwing)
- Navy = merk/structuur (nooit als statuskleur gebruiken)
- Gold = alleen voor accent/nadruk, nooit als vlakvulling over grote oppervlaktes

### Typografie
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```
Systeemfont — geen custom lettertype geladen. Bewuste keuze: snelheid en leesbaarheid boven merkidentiteit via typografie, past bij een intern zakelijk tool.

**Schaal (alles wat in de app voorkomt):**
| Gebruik | Grootte | Gewicht |
|---|---|---|
| Paginatitel (bijv. "Actielijsten — overzicht") | 19px | 600 |
| Kaarttitel (startscherm-tegels) | 17px | 600 |
| Sectietitel / klantnaam in lijst | 13–14px | 500–600 |
| Standaard body-tekst, invoervelden | 12–13px | 400 |
| Labels, badges, metadata | 10–11px | 600 (labels) / 400 (metadata) |
| Kolomkoppen (uppercase) | 10px | 600, letter-spacing 0.04–0.05em |

Regel: **hoe kleiner de tekst, hoe zwaarder het gewicht** bij labels/koppen — dat houdt het leesbaar ondanks de compacte maat.

### Ruimte en maatvoering
```css
Rijhoogte tabel (actielijst):     78px  (vast, cellen scrollen bij overflow)
Cel binnen rij:                   62px hoog, met interne scroll
Border-radius standaard:          6px
Border-radius grote kaarten:      8–14px (klantoverzicht-rijen resp. startscherm-tegels)
Padding kaarten:                  16px (klantoverzicht) tot 36px (startscherm-tegels)
Badge padding:                    2–3px verticaal, 7–9px horizontaal, altijd pill-vorm (20px radius)
```

---

## 2. Componenten (hergebruik deze, verzin geen nieuwe variant)

### Statusbadge
Pill-vorm, kleur uit de statuspalet (rood/groen/amber), tekst 10-11px/600.
```html
<span class="badge badge-open">3 open</span>
```
Gebruikt in: klantoverzicht, topbar-statistieken, dashboard.

### Kaart (klant-tegel, startscherm-tegel)
Witte achtergrond, subtiele border of border-left in statuskleur, radius 8px, hover = lichte transform of achtergrondkleur-shift (`--blue-bg`).

### Tabelrij met inline-edit cellen (`.cel-scroll`)
Vaste hoogte per rij (78px), inhoud scrollt verticaal bij overflow in plaats van de rij uit te rekken. Focus-state: navy-rand + lichte schaduw. Dit is het kernpatroon van de hele actielijst — **nooit afwijken naar auto-height rijen**, dat brak eerder de layout (zie versiegeschiedenis v06–v11).

### Filterknop (toggle-pill)
Rand, geen vulling in rust; navy-vulling + witte tekst in actieve staat. Meerdere tegelijk aan te kunnen zetten (combineerbare filters) — géén radiobutton-gedrag tenzij expliciet bedoeld.

### Avatar-chip
Ronde chip met 2-letterige afkorting, kleur per naam consistent gekoppeld (bijv. Ton = paars, Seth = groen). Nieuwe teamleden krijgen automatisch een kleur uit de bestaande set.

### Modal
Gecentreerd, `--shadow`, witte achtergrond, radius 10px, footer met geannuleerd/bevestig-knoppen rechts uitgelijnd. Achtergrond-overlay: `rgba(26,58,92,0.5)`.

### Toast (bevestiging)
Onderaan gecentreerd, navy achtergrond, witte tekst, verschijnt/verdwijnt met transform-transitie. Voor korte bevestigingen ("Actie toegevoegd"), nooit voor foutmeldingen die actie vereisen — die horen inline bij het veld.

---

## 3. UX-principes die in deze app gelden

**Inline boven modal.** Actielijst-cellen zijn direct in de tabel te bewerken (`contenteditable` / vaste-hoogte inputs) — geen apart bewerkscherm. Dit is bewust zo omdat de gebruiker deze app tijdens vergaderingen live invult; elke extra klik naar een modal kost tijd die er dan niet is. Nieuwe features die "iets toevoegen aan een rij" doen, volgen dit patroon, niet een popup.

**Automatisch boven handmatig, maar altijd overschrijfbaar.** Due date wordt berekend (invoerdatum + doorlooptijd), maar kan altijd handmatig gecorrigeerd worden. Dit patroon — slim voorstel, mens houdt de controle — geldt voor elk veld waar automatisering wordt toegevoegd.

**Bevestiging bij destructieve of niet-vanzelfsprekende acties.** Kolomnaam wijzigen vereist een klik-door (ballon met bevestigknop) omdat het per ongeluk aanraken van een kolomkop niet meteen editable mag worden — voorkomt onbedoelde wijzigingen aan gedeelde structuur.

**Filters zijn optellend, niet vervangend.** Je kunt Open + Due tegelijk aanvinken; het is een OR-filter binnen dezelfde categorie. Dit gold niet in v01-v14 (bug/beperking) en is bewust gecorrigeerd — nieuwe filters elders in de app volgen ditzelfde model.

**Navigatie is hiërarchisch en altijd terug te vinden.** Start → Klantoverzicht → Klant-detail. Elk scherm heeft een expliciete "← Terug"-link, nooit alleen de browser-terugknop als enige weg terug.

**Lege staten wijzen naar de eerstvolgende actie.** "Nog geen versies opgeslagen — sluit een vergadering af om een versie te bewaren" in plaats van alleen "Geen data."

**Kleur draagt betekenis, niet decoratie.** Zie sectie 1 — voordat een nieuwe kleur wordt toegevoegd: past die in rood/groen/amber-systeem, of is het een nieuw concept dat een eigen overwogen kleur verdient?

---

## 4. Schrijfstijl in de interface (Nederlands, zakelijk-informeel)

- Directe werkwoordsvorm voor knoppen: "Opslaan", "Uitstellen met 2 weken" — niet "Verzenden" of "OK"
- Labels benoemen wat de gebruiker beheert, niet hoe het systeem het noemt: "Verantwoordelijke", niet "assignee_id"
- Foutmeldingen/validatie kort en zonder verontschuldiging: "Vul minimaal een actiepunt in"
- Toon is die van een collega, niet van software: "Actie toegevoegd", "Uitgesteld met 4 weken"

---

## 5. Wat NIET te doen (geleerd uit eerdere versies)

- **Geen auto-height cellen in tabellen** — trekt de hele rij-layout uit verband (gebeurde in v03–v05, opgelost in v08–v11)
- **Geen losse kleurwaarden buiten de tokenlijst** — altijd de CSS-variabelen gebruiken, nooit een eigen hex-code ad hoc kiezen
- **Geen radiobutton-gedrag bij filters** die eigenlijk optelbaar moeten zijn
- **Geen aparte edit-schermen** voor dingen die net zo goed inline kunnen — dit is een invoertool voor tijdens vergaderingen, snelheid is een designeis
- **Geen decoratieve animaties** — de enige transitions die er zijn, zijn functioneel (hover-feedback, paneel in/uit schuiven), niets ambient of puur sierlijk

---

## 6. Voor nieuwe features / Claude Code

Bij het bouwen van iets nieuws:
1. Check eerst of een bestaand component (badge, kaart, filterpill, modal) hergebruikt kan worden voordat je iets nieuws ontwerpt
2. Gebruik altijd de CSS-variabelen uit sectie 1, nooit hardcoded kleuren
3. Volg de rijhoogte/celpatroon uit sectie 2 voor alles wat op een tabel lijkt
4. Toets nieuwe schermen aan de UX-principes in sectie 3 voordat je bouwt — met name: kan dit inline, of heeft het écht een apart scherm nodig?
