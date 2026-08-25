/**
 * Message catalogs for the landing site.
 *
 * Hand-rolled dictionary module (the approach recommended in the Astro i18n
 * recipe) — no runtime dependency, importable from both .astro pages and
 * .svelte islands, and the `fi` catalog is type-checked against `en` so a
 * missing key fails `astro check`.
 *
 * ── Finnish copy status ────────────────────────────────────────────────────
 * EVERY `fi` string below is machine-drafted and NEEDS NATIVE REVIEW (Konsta).
 *
 * Regulatory discipline ("me laskemme, ihminen päättelee"): the Finnish copy
 * must stay descriptive — record/collect/review language only. It must never
 * drift into treatment-effect or recommendation claims that the English
 * avoids (no "paranna hoitoasi", no "löydä oikea lääke"). When in doubt the
 * Finnish is translated MORE conservatively than the English.
 */

export const languages = {
  en: "English",
  fi: "Suomi",
} as const;

export type Lang = keyof typeof languages;

export const defaultLang: Lang = "en";

const en = {
  meta: {
    title: "Ease — Migraine Treatment History",
    description:
      "Keep a clear history of migraine medication trials, outcomes, and questions for your next appointment. Join the private beta.",
    ogDescription:
      "Record migraine medication trials and turn them into a clear history you can review and share with your clinician. Join the beta.",
    ogLocale: "en_US",
  },
  a11y: {
    skipToContent: "Skip to content",
    mainNav: "Main navigation",
    langSwitch: "Change language",
    weekVis: "Recent history showing recorded migraine days",
  },
  nav: {
    features: "Features",
    about: "About",
    roadmap: "Roadmap",
    profile: "Profile",
    dashboard: "Dashboard",
  },
  navCta: {
    joinBeta: "Join Beta",
    privateBeta: "Private Beta",
  },
  hero: {
    eyebrow: "Migraine treatment history · Private beta",
    titleLine1: "Your migraine treatment.",
    titleLine2: "One clear history.",
    sub: "Record clinician-directed medication trials, what happened, and what to bring to your next appointment. Fast to update. Yours to review and share.",
  },
  features: {
    eyebrow: "What Ease does",
    headline1: "Everything you need.",
    headline2: "Nothing you don't.",
    cards: [
      {
        title: "Treatment trials",
        body: "Keep medications, dates, dosages, and reasons for stopping together.",
      },
      {
        title: "Quick outcome logging",
        body: "Record benefit, side effects, and migraine days in a few taps, even on difficult days.",
      },
      {
        title: "Privacy first",
        body: "You decide what to record and when to share it. We do not sell your personal data.",
      },
      {
        title: "Treatment timeline",
        body: "See past and current medication trials in one chronological, patient-owned record.",
      },
      {
        title: "Appointment-ready reports",
        body: "Turn your history into a concise summary to review with your clinician.",
      },
      {
        title: "Low-burden check-ins",
        body: "Short prompts keep your history current without asking for a long daily diary.",
      },
    ],
  },
  philosophy: {
    eyebrow: "Our approach",
    headline: "Built for the reality of migraine treatment.",
    body: "Appointments are short and treatment histories get fragmented. Ease keeps the details together without adding another demanding routine.",
    stats: [
      { n: "1", label: "Treatment history" },
      { n: "3", label: "Core outcomes" },
      { n: "YOU", label: "Control sharing" },
    ],
    weekdays: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
    visLabel: "Your recent history",
  },
  roadmap: {
    eyebrow: "Roadmap",
    headline1: "From a clear treatment history",
    headline2: "to better-informed appointments.",
    phaseLabel: "Phase",
    phases: [
      {
        badge: "Now",
        title: "Treatment History",
        items: [
          "Clinician-directed medication trial records",
          "Quick benefit and side-effect logging",
          "Migraine-day and severity history",
          "Patient-owned chronological timeline",
          "Appointment-ready report export",
        ],
      },
      {
        badge: "In development",
        title: "Workflow Validation",
        items: [
          "Beta-user interviews and usability testing",
          "Clinician review of the report format",
          "Low-burden outcome measures",
          "Consent and data-governance workflows",
          "Pilot operations and support workflows",
        ],
      },
      {
        badge: "Planned",
        title: "Shadow Research",
        items: [
          "Prospective observational cohort",
          "Pre-specified evaluation protocol",
          "No user-facing predictions or treatment advice",
          "Calibration and subgroup performance checks",
          "Independent clinical and statistical review",
        ],
      },
      {
        badge: "Target",
        title: "Regulated Product, If Validated",
        items: [
          "Intended-purpose and classification assessment",
          "Quality and risk management systems",
          "Clinical performance and utility evidence",
          "Human factors and cybersecurity validation",
          "Regulatory submission only after evidence gates",
        ],
      },
    ],
  },
  footer: {
    privacy: "Privacy Policy",
    terms: "Terms of Use",
    copyright: "© 2026 Ease Health. Made with care.",
  },
  form: {
    orEmail: "or continue with email",
    emailPlaceholder: "your@email.com",
    submit: "Get early access",
    sending: "Sending…",
    magicLinkSent: "Check your email for a magic sign-in link.",
    magicLinkHint: "Click the link in your email to complete sign-up.",
    completingSignIn: "Completing sign in…",
    onList: "You're on the list! We'll be in touch soon.",
    alreadyOnList: "You're already on the list! We'll be in touch soon.",
    authFailed: "Authentication failed.",
  },
  oauth: {
    google: "Continue with Google",
    googleAria: "Sign in with Google",
    apple: "Continue with Apple",
    appleAria: "Sign in with Apple (Coming Soon)",
    appleTitle: "Coming soon — Apple Developer account not yet configured",
    comingSoon: "Coming Soon",
    github: "Continue with GitHub",
    githubAria: "Sign in with GitHub",
  },
  ios: {
    aria: "Coming soon to the App Store",
    sub: "Coming to the",
    name: "App Store",
    pill: "Soon",
  },
} as const;

/** The `en` catalog is the source of truth for the message shape. */
type Messages = {
  readonly [K in keyof typeof en]: DeepShape<(typeof en)[K]>;
};

/* Widen literal string types so `fi` can hold different strings while the
 * structure (keys, array lengths are not enforced — reviewed in e2e) stays
 * identical. */
type DeepShape<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? readonly DeepShape<U>[]
    : { readonly [K in keyof T]: DeepShape<T[K]> };

/*
 * ── FI: machine-drafted, needs native review (Konsta) ─────────────────────
 * Deliberately conservative choices are marked with [conservative].
 * Established project terminology used: hoitovaste, kohtauslääke/estolääke
 * context, vastaanottoyhteenveto, hoitohistoria.
 */
const fi: Messages = {
  meta: {
    title: "Ease — Migreenin hoitohistoria",
    description:
      "Pidä selkeää kirjaa migreenilääkekokeiluista, niiden kirjatuista vasteista ja kysymyksistä seuraavaa vastaanottoa varten. Liity suljettuun betaan.",
    ogDescription:
      "Kirjaa migreenilääkekokeilut ja kokoa niistä selkeä hoitohistoria, jonka voit käydä läpi ja jakaa lääkärisi kanssa. Liity betaan.",
    ogLocale: "fi_FI",
  },
  a11y: {
    skipToContent: "Siirry sisältöön",
    mainNav: "Päänavigointi",
    langSwitch: "Vaihda kieli",
    weekVis: "Viimeaikainen historia kirjatuista migreenipäivistä",
  },
  nav: {
    features: "Ominaisuudet",
    about: "Tietoa",
    roadmap: "Tiekartta",
    profile: "Profiili",
    // Links to an English-only internal page; label kept as-is on purpose.
    dashboard: "Dashboard",
  },
  navCta: {
    joinBeta: "Liity betaan",
    privateBeta: "Suljettu beta",
  },
  hero: {
    eyebrow: "Migreenin hoitohistoria · Suljettu beta",
    titleLine1: "Migreenisi hoito.",
    titleLine2: "Yksi selkeä historia.",
    // [conservative] "seuraa ja kokoa" -style: recording only, no outcome promise.
    sub: "Kirjaa lääkärin ohjaamat lääkekokeilut, mitä hoidon aikana tapahtui ja mitä ottaa puheeksi seuraavalla vastaanotolla. Nopea päivittää. Omasi — sinä päätät, milloin katsot ja jaat.",
  },
  features: {
    eyebrow: "Mitä Ease tekee",
    headline1: "Kaikki mitä tarvitset.",
    headline2: "Ei mitään turhaa.",
    cards: [
      {
        title: "Hoitokokeilut",
        body: "Pidä lääkkeet, päivämäärät, annokset ja lopettamisen syyt yhdessä paikassa.",
      },
      {
        title: "Nopea hoitovasteen kirjaus",
        body: "Kirjaa hyöty, haittavaikutukset ja migreenipäivät muutamalla napautuksella — myös vaikeina päivinä.",
      },
      {
        title: "Yksityisyys edellä",
        body: "Sinä päätät, mitä kirjaat ja milloin jaat. Emme myy henkilötietojasi.",
      },
      {
        title: "Hoidon aikajana",
        body: "Näe menneet ja nykyiset lääkekokeilut yhdessä aikajärjestyksessä etenevässä, potilaan omistamassa historiassa.",
      },
      {
        title: "Vastaanottoyhteenvedot",
        body: "Kokoa historiastasi tiivis yhteenveto, jonka käyt läpi lääkärisi kanssa.",
      },
      {
        title: "Kevyt seuranta",
        body: "Lyhyet muistutukset pitävät historiasi ajan tasalla ilman pitkää päivittäistä päiväkirjaa.",
      },
    ],
  },
  philosophy: {
    eyebrow: "Lähestymistapamme",
    headline: "Rakennettu migreenin hoidon arkeen.",
    body: "Vastaanotot ovat lyhyitä, ja hoitohistoria pirstaloituu helposti. Ease pitää yksityiskohdat koossa lisäämättä arkeen uutta vaativaa rutiinia.",
    stats: [
      { n: "1", label: "Hoitohistoria" },
      { n: "3", label: "Keskeistä vastetta" },
      { n: "SINÄ", label: "Päätät jakamisesta" },
    ],
    weekdays: ["MA", "TI", "KE", "TO", "PE", "LA", "SU"],
    visLabel: "Viimeaikainen historiasi",
  },
  roadmap: {
    eyebrow: "Tiekartta",
    headline1: "Selkeästä hoitohistoriasta",
    // [conservative] "better-informed" → "paremmin pohjustettu", not "parempi hoito".
    headline2: "paremmin pohjustettuihin vastaanottoihin.",
    phaseLabel: "Vaihe",
    phases: [
      {
        badge: "Nyt",
        title: "Hoitohistoria",
        items: [
          "Lääkärin ohjaamien lääkekokeilujen kirjaukset",
          "Nopea hyödyn ja haittavaikutusten kirjaus",
          "Migreenipäivien ja vaikeusasteen historia",
          "Potilaan omistama aikajana",
          "Vastaanottoyhteenvedon vienti",
        ],
      },
      {
        badge: "Kehitteillä",
        title: "Työnkulun validointi",
        items: [
          "Betakäyttäjien haastattelut ja käytettävyystestaus",
          "Lääkäreiden arvio yhteenvedon muodosta",
          "Kevyet vastemittarit",
          "Suostumus- ja tiedonhallintakäytännöt",
          "Pilotin toiminta- ja tukiprosessit",
        ],
      },
      {
        badge: "Suunnitteilla",
        title: "Varjotutkimus",
        items: [
          "Prospektiivinen havainnoiva kohortti",
          "Ennalta määritelty arviointiprotokolla",
          "Ei ennusteita eikä hoitosuosituksia käyttäjille",
          "Kalibroinnin ja alaryhmien suorituskyvyn tarkistukset",
          "Riippumaton kliininen ja tilastollinen arviointi",
        ],
      },
      {
        badge: "Tavoite",
        title: "Säännelty tuote, jos näyttö riittää",
        items: [
          "Käyttötarkoituksen ja luokituksen arviointi",
          "Laatu- ja riskienhallintajärjestelmät",
          "Näyttö kliinisestä suorituskyvystä ja hyödystä",
          "Käytettävyyden ja kyberturvallisuuden validointi",
          "Viranomaishakemus vasta, kun näyttökriteerit täyttyvät",
        ],
      },
    ],
  },
  footer: {
    // NOTE: /privacy and /terms pages themselves are still English-only.
    privacy: "Tietosuojaseloste",
    terms: "Käyttöehdot",
    copyright: "© 2026 Ease Health. Tehty huolella.",
  },
  form: {
    orEmail: "tai jatka sähköpostilla",
    emailPlaceholder: "sinun@sahkoposti.fi",
    submit: "Liity betaan",
    sending: "Lähetetään…",
    magicLinkSent: "Katso sähköpostistasi kirjautumislinkki.",
    magicLinkHint: "Viimeistele ilmoittautuminen avaamalla sähköpostissa oleva linkki.",
    completingSignIn: "Viimeistellään kirjautumista…",
    onList: "Olet listalla! Olemme pian yhteydessä.",
    alreadyOnList: "Olet jo listalla! Olemme pian yhteydessä.",
    authFailed: "Kirjautuminen epäonnistui.",
  },
  oauth: {
    google: "Jatka Googlella",
    googleAria: "Kirjaudu Googlella",
    apple: "Jatka Applella",
    appleAria: "Kirjaudu Applella (tulossa)",
    appleTitle: "Tulossa — Apple-kirjautuminen ei ole vielä käytössä",
    comingSoon: "Tulossa",
    github: "Jatka GitHubilla",
    githubAria: "Kirjaudu GitHubilla",
  },
  ios: {
    aria: "Tulossa pian App Storeen",
    sub: "Tulossa",
    name: "App Storeen",
    pill: "Pian",
  },
};

export const ui: Record<Lang, Messages> = { en, fi };

/** Look up the catalog for a locale, falling back to the default. */
export function t(lang: string | undefined): Messages {
  return lang && lang in ui ? ui[lang as Lang] : ui[defaultLang];
}

/** Absolute site origin used for canonical + hreflang tags. */
export const SITE = "https://ease-health.org";

/** Path of the landing page for a locale ("/" for en, "/fi/" for fi). */
export function localeHome(lang: Lang): string {
  return lang === defaultLang ? "/" : `/${lang}/`;
}
