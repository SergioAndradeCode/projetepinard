// Charte graphique Talenth — Version 1.0 — Juin 2026
// Source unique de vérité pour toutes les couleurs et tokens de marque.
// Utiliser ces constantes dans les composants, emails et PDF.

export const BRAND = {
  colors: {
    // Vert — couleur de marque (logo, icônes, états de succès, communication externe)
    green:        '#19BF34',
    greenAnalog1: '#50BF19',  // analogue jaune-vert
    greenAnalog2: '#19BF88',  // analogue teal

    // Bleu — interface produit (boutons, navigation, liens, sidebar)
    blue:         '#1E4A8C',
    blueDark:     '#0F1F3C',  // headers, footer, fonds foncés
    blueLight:    '#EBF2FA',  // fonds de sections, info boxes

    // Ambre — accent (badge "Recommandé", highlights, total TTC facture)
    amber:        '#F59E0B',

    // Neutres
    dark:         '#1A1A2E',  // texte principal
    gray:         '#6B7280',  // texte secondaire
    grayLight:    '#9CA3AF',  // texte tertiaire, placeholders
    border:       '#E2E8F0',  // bordures
    bgLight:      '#F8FAFC',  // arrière-plans de page
    white:        '#FFFFFF',
  },

  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
    weights: {
      regular:     400,
      semibold:    600,
      bold:        700,
      extrabold:   800,
      black:       900,
    },
    sizes: {
      h1:      '40px',
      h2:      '28px',
      h3:      '20px',
      body:    '15px',
      caption: '12px',
      label:   '11px',
    },
  },

  logo: {
    minHeight:    24,   // px — taille minimale d'affichage
    path:         '/logo.png',
    aspectRatio:  1,    // carré — ne jamais déformer
  },

  company: {
    name:         'Talenth',
    tagline:      'Pilotage OETH simplifié',
    email:        'talenthsupport@gmail.com',
    website:      'https://talenth.fr',
  },
} as const
