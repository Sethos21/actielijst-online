# actielijst-online

Online Actielijsten BVC-Klanten

React + Vite + TypeScript app met Firebase (Authentication + Firestore) als
backend, en een CI/CD-pipeline via GitHub Actions die automatisch bouwt,
test en naar Firebase Hosting deployt.

## Lokale ontwikkeling

```bash
npm install
cp .env.example .env   # vul de Firebase-webconfig in (zie hieronder)
npm run dev            # lokale dev-server
npm run test           # unit tests (vitest)
npm run lint           # linter (oxlint)
npm run build          # productie-build naar dist/
```

## Firebase-project opzetten (eenmalig)

1. Maak een project aan op https://console.firebase.google.com.
2. Zet **Authentication > Sign-in method > E-mail/wachtwoord** aan.
3. Maak een **Firestore database** aan (production mode).
4. Ga naar **Project settings > Algemeen > Jouw apps** en voeg een webapp
   toe. Kopieer de config-waarden naar `.env` (lokaal) en naar de
   GitHub-secrets hieronder (voor de build in CI/CD).
5. Werk `.firebaserc` in dit repo bij: vervang
   `REPLACE_WITH_YOUR_FIREBASE_PROJECT_ID` door je echte project-ID.
6. Maak een service-account voor deploys: **Project settings > Serviceaccounts
   > Nieuwe privésleutel genereren**. Dit levert een JSON-bestand op.

## Benodigde GitHub secrets

Zet deze onder **Settings > Secrets and variables > Actions** in de GitHub
repo:

| Secret | Waarde |
| --- | --- |
| `FIREBASE_SERVICE_ACCOUNT` | Volledige inhoud van het service-account JSON-bestand (stap 6 hierboven) |
| `FIREBASE_PROJECT_ID` | Je Firebase project-ID |
| `VITE_FIREBASE_API_KEY` | Uit de webapp-config (stap 4) |
| `VITE_FIREBASE_AUTH_DOMAIN` | Uit de webapp-config |
| `VITE_FIREBASE_PROJECT_ID` | Uit de webapp-config (meestal gelijk aan `FIREBASE_PROJECT_ID`) |
| `VITE_FIREBASE_STORAGE_BUCKET` | Uit de webapp-config |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Uit de webapp-config |
| `VITE_FIREBASE_APP_ID` | Uit de webapp-config |

## Hoe de pipeline werkt

- **Pull request naar `main`** → `.github/workflows/ci.yml` bouwt, lint en
  test de code. `.github/workflows/firebase-hosting-pull-request.yml` deployt
  daarnaast een tijdelijke preview-omgeving (7 dagen geldig) op Firebase
  Hosting, zodat je een wijziging live kunt bekijken voordat die naar
  productie gaat.
- **Merge/push naar `main`** →
  `.github/workflows/firebase-hosting-merge.yml` draait de tests opnieuw,
  bouwt de productie-build, deployt de Firestore-rules en deployt daarna pas
  naar het live Firebase Hosting-kanaal. Als een stap faalt (lint, test,
  build), stopt de workflow vóór de deploy-stap — er gaat dus nooit kapotte
  code naar productie.

### Terugrollen naar een eerdere versie

Twee opties:

1. **Direct via Firebase** (snelst, geen rebuild nodig): in de Firebase
   Console onder **Hosting > Release-geschiedenis** kun je met één klik
   terug naar een eerdere release. Kan ook via de CLI:
   `firebase hosting:rollback --project <project-id>`.
2. **Via GitHub Actions** (herbouwt een specifieke commit/tag en deployt die
   naar productie): ga naar **Actions > Rollback production deploy > Run
   workflow** en vul de commit-SHA, tag of branch in die je terug wil
   deployen.

## Werken met Claude vanuit één chat

Zodra de secrets zijn ingesteld, kun je in een Claude Code-sessie die aan
deze repo is gekoppeld gewoon vragen om bijvoorbeeld "maak een nieuwe pagina
met een overzicht van alle klanten" of "pas wijziging X direct toe". Claude
commit en pusht de wijziging naar dit repository; de pipeline hierboven
zorgt automatisch voor bouwen, testen en (bij `main`) deployen naar
productie. Voor grotere wijzigingen is het aan te raden om via een pull
request te werken (dan krijg je eerst een preview-link), voor kleine
wijzigingen kan Claude ook direct naar `main` pushen.
