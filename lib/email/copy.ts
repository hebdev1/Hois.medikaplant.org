// ─────────────────────────────────────────────────────────────────────────
// All localized email copy — one source of truth for every transactional and
// notification email. Rendered by lib/email/template.ts.
//
// Languages: ht (Kreyòl, default/fallback), fr, en. The `ht` strings mirror
// the copy that was live before this unification so nothing regresses.
// ─────────────────────────────────────────────────────────────────────────

export type Lang = 'ht' | 'fr' | 'en';

/** Coerce any stored/metadata value to a supported language (fallback ht). */
export function normalizeLang(x: string | null | undefined): Lang {
  return x === 'fr' || x === 'en' ? x : 'ht';
}

export type Accent = 'green' | 'sienna' | 'tangerine';
export type FooterVariant = 'transactional' | 'notification' | 'advice';

export const BRAND_LINE = 'MedikaPlant · Hoïs Inivèsite';

// Shared chrome: greeting word + inbox preheader fallback, per language.
export const CHROME: Record<Lang, { greetingWord: string; preheader: string }> = {
  ht: { greetingWord: 'Bonjou', preheader: 'Yon mesaj de MedikaPlant' },
  fr: { greetingWord: 'Bonjour', preheader: 'Un message de MedikaPlant' },
  en: { greetingWord: 'Hi', preheader: 'A message from MedikaPlant' },
};

// ─── Footer chrome ─────────────────────────────────────────────────────────
export const FOOTER: Record<
  FooterVariant,
  Record<Lang, { reason: string; manageLabel?: string; disclaimer?: string }>
> = {
  transactional: {
    ht: { reason: 'Ou resevwa imèl sa paske ou gen yon kont MedikaPlant.' },
    fr: { reason: 'Vous recevez cet e-mail car vous avez un compte MedikaPlant.' },
    en: { reason: 'You received this email because you have a MedikaPlant account.' },
  },
  notification: {
    ht: {
      reason: 'Ou resevwa imèl sa paske ou aktive notifikasyon yo.',
      manageLabel: 'Jere notifikasyon yo',
    },
    fr: {
      reason: 'Vous recevez cet e-mail car vos notifications sont activées.',
      manageLabel: 'Gérer les notifications',
    },
    en: {
      reason: 'You received this email because your notifications are on.',
      manageLabel: 'Manage notifications',
    },
  },
  advice: {
    ht: {
      reason: 'Ou resevwa imèl sa paske ou aktive notifikasyon yo.',
      manageLabel: 'Jere notifikasyon yo',
      disclaimer:
        'Enfòmasyon sa a se pa yon konsèy medikal. Toujou konsilte yon pwofesyonèl sante.',
    },
    fr: {
      reason: 'Vous recevez cet e-mail car vos notifications sont activées.',
      manageLabel: 'Gérer les notifications',
      disclaimer:
        "Ces informations ne constituent pas un avis médical. Consultez toujours un professionnel de santé.",
    },
    en: {
      reason: 'You received this email because your notifications are on.',
      manageLabel: 'Manage notifications',
      disclaimer:
        'This information is not medical advice. Always consult a health professional.',
    },
  },
};

// ─── Auth emails (fired by the Supabase send-email hook) ────────────────────
export type AuthEmailType =
  | 'signup'
  | 'magiclink'
  | 'invite'
  | 'recovery'
  | 'email_change'
  | 'email_change_new'
  | 'reauthentication';

export type AuthStrings = {
  subject: string;
  heading: string;
  paragraphs: string[];
  ctaLabel?: string;
  /** Small fine-print under the CTA (expiry / "not you"). */
  note?: string;
};

// email_change and email_change_new share one set of strings.
type AuthKey = Exclude<AuthEmailType, 'email_change_new'>;

const AUTH: Record<AuthKey, Record<Lang, AuthStrings>> = {
  signup: {
    ht: {
      subject: 'Konfime kont MedikaPlant ou',
      heading: 'Byenveni nan Hoïs',
      paragraphs: [
        'Mèsi pou enskripsyon ou nan MedikaPlant — Hoïs Inivèsite.',
        'Klike sou bouton anba a pou konfime imèl ou ak aktive kont ou.',
      ],
      ctaLabel: 'Konfime imèl mwen',
      note: 'Si se pa ou ki te kreye kont sa, inyore mesaj sa.',
    },
    fr: {
      subject: 'Confirmez votre compte MedikaPlant',
      heading: 'Bienvenue chez Hoïs',
      paragraphs: [
        'Merci de votre inscription à MedikaPlant — Hoïs Inivèsite.',
        'Cliquez sur le bouton ci-dessous pour confirmer votre e-mail et activer votre compte.',
      ],
      ctaLabel: 'Confirmer mon e-mail',
      note: "Si vous n'êtes pas à l'origine de ce compte, ignorez ce message.",
    },
    en: {
      subject: 'Confirm your MedikaPlant account',
      heading: 'Welcome to Hoïs',
      paragraphs: [
        'Thanks for signing up to MedikaPlant — Hoïs Inivèsite.',
        'Click the button below to confirm your email and activate your account.',
      ],
      ctaLabel: 'Confirm my email',
      note: "If you didn't create this account, you can ignore this message.",
    },
  },
  magiclink: {
    ht: {
      subject: 'Lyen koneksyon ou — Hoïs MedikaPlant',
      heading: 'Konekte san modpas',
      paragraphs: ['Klike sou bouton anba a pou konekte sou kont MedikaPlant ou.'],
      ctaLabel: 'Konekte kounye a',
      note: 'Lyen sa ap ekspire nan yon èdtan. Si se pa ou, inyore mesaj sa.',
    },
    fr: {
      subject: 'Votre lien de connexion — Hoïs MedikaPlant',
      heading: 'Connexion sans mot de passe',
      paragraphs: ['Cliquez sur le bouton ci-dessous pour vous connecter à votre compte MedikaPlant.'],
      ctaLabel: 'Se connecter',
      note: "Ce lien expire dans une heure. Si ce n'est pas vous, ignorez ce message.",
    },
    en: {
      subject: 'Your login link — Hoïs MedikaPlant',
      heading: 'Log in without a password',
      paragraphs: ['Click the button below to log in to your MedikaPlant account.'],
      ctaLabel: 'Log in now',
      note: "This link expires in one hour. If this wasn't you, ignore this message.",
    },
  },
  invite: {
    ht: {
      subject: 'Ou envite nan MedikaPlant — Hoïs Inivèsite',
      heading: 'Yon envitasyon pou ou',
      paragraphs: [
        'Yon admin MedikaPlant envite ou rantre nan kominote Hoïs la.',
        'Klike sou bouton anba a pou aktive kont ou ak chwazi modpas ou.',
      ],
      ctaLabel: 'Aksepte envitasyon an',
    },
    fr: {
      subject: 'Vous êtes invité à MedikaPlant — Hoïs Inivèsite',
      heading: 'Une invitation pour vous',
      paragraphs: [
        'Un administrateur MedikaPlant vous invite à rejoindre la communauté Hoïs.',
        'Cliquez sur le bouton ci-dessous pour activer votre compte et choisir votre mot de passe.',
      ],
      ctaLabel: "Accepter l'invitation",
    },
    en: {
      subject: "You're invited to MedikaPlant — Hoïs Inivèsite",
      heading: 'An invitation for you',
      paragraphs: [
        'A MedikaPlant admin invited you to join the Hoïs community.',
        'Click the button below to activate your account and choose your password.',
      ],
      ctaLabel: 'Accept the invitation',
    },
  },
  recovery: {
    ht: {
      subject: 'Reyajiste modpas ou — Hoïs MedikaPlant',
      heading: 'Reyajiste modpas ou',
      paragraphs: [
        'Nou resevwa yon demand pou reyajiste modpas kont MedikaPlant ou.',
        'Klike sou bouton anba a pou chwazi yon nouvo modpas.',
      ],
      ctaLabel: 'Chwazi yon nouvo modpas',
      note: 'Lyen sa ap ekspire nan yon èdtan. Si se pa ou ki te mande sa, kont ou rete an sekirite.',
    },
    fr: {
      subject: 'Réinitialisez votre mot de passe — Hoïs MedikaPlant',
      heading: 'Réinitialisez votre mot de passe',
      paragraphs: [
        'Nous avons reçu une demande de réinitialisation du mot de passe de votre compte MedikaPlant.',
        'Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.',
      ],
      ctaLabel: 'Choisir un nouveau mot de passe',
      note: "Ce lien expire dans une heure. Si vous n'êtes pas à l'origine de la demande, votre compte reste sécurisé.",
    },
    en: {
      subject: 'Reset your password — Hoïs MedikaPlant',
      heading: 'Reset your password',
      paragraphs: [
        'We received a request to reset the password for your MedikaPlant account.',
        'Click the button below to choose a new password.',
      ],
      ctaLabel: 'Choose a new password',
      note: "This link expires in one hour. If you didn't request it, your account stays safe.",
    },
  },
  email_change: {
    ht: {
      subject: 'Konfime nouvo imèl ou',
      heading: 'Konfime chanjman imèl ou',
      paragraphs: [
        'Klike sou bouton anba a pou konfime nouvo imèl ou pou kont MedikaPlant.',
      ],
      ctaLabel: 'Konfime nouvo imèl',
      note: 'Si se pa ou ki te mande sa, inyore mesaj sa.',
    },
    fr: {
      subject: 'Confirmez votre nouvel e-mail',
      heading: 'Confirmez le changement de votre e-mail',
      paragraphs: [
        'Cliquez sur le bouton ci-dessous pour confirmer votre nouvel e-mail pour votre compte MedikaPlant.',
      ],
      ctaLabel: 'Confirmer le nouvel e-mail',
      note: "Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.",
    },
    en: {
      subject: 'Confirm your new email',
      heading: 'Confirm your email change',
      paragraphs: [
        'Click the button below to confirm your new email for your MedikaPlant account.',
      ],
      ctaLabel: 'Confirm new email',
      note: "If you didn't request this, you can ignore this message.",
    },
  },
  reauthentication: {
    ht: {
      subject: 'Kòd verifikasyon ou',
      heading: 'Verifikasyon idantite',
      paragraphs: ['Antre kòd sa a pou konplete operasyon w lan:'],
      ctaLabel: 'Retounen sou MedikaPlant',
      note: 'Si se pa ou ki te mande sa, chanje modpas ou kounye a.',
    },
    fr: {
      subject: 'Votre code de vérification',
      heading: "Vérification d'identité",
      paragraphs: ['Saisissez ce code pour terminer votre opération :'],
      ctaLabel: 'Retour sur MedikaPlant',
      note: "Si vous n'êtes pas à l'origine de cette demande, changez votre mot de passe maintenant.",
    },
    en: {
      subject: 'Your verification code',
      heading: 'Identity verification',
      paragraphs: ['Enter this code to complete your operation:'],
      ctaLabel: 'Back to MedikaPlant',
      note: "If you didn't request this, change your password now.",
    },
  },
};

/** Resolve the strings for an auth email type (email_change_new reuses email_change). */
export function authCopy(type: AuthEmailType, lang: Lang): AuthStrings {
  const key: AuthKey = type === 'email_change_new' ? 'email_change' : type;
  return AUTH[key][lang];
}

/** Accent colour + footer variant per auth type. */
export function authStyle(type: AuthEmailType): { accent: Accent; footer: FooterVariant } {
  switch (type) {
    case 'recovery':
    case 'email_change':
    case 'email_change_new':
    case 'reauthentication':
      return { accent: 'sienna', footer: 'transactional' };
    default:
      return { accent: 'green', footer: 'transactional' };
  }
}

// ─── Notification emails (fired in-app via emailNotifyMember) ───────────────
export type NotifyKind = 'daily_advice' | 'weekly_summary' | 'badge_unlock';

export type NotifyVars = {
  daily_advice: { plantName?: string | null; adviceExcerpt: string };
  weekly_summary: { nLogs: number; nTasks: number; nBadges: number };
  badge_unlock: {
    badgeName: string;
    badgeSlug: string;
    badgeSub?: string | null;
    badgeDescription?: string | null;
  };
};

export type NotifyResult = {
  subject: string;
  heading: string;
  paragraphs: string[];
  ctaLabel: string;
  linkPath: string;
};

export const NOTIFY_STYLE: Record<NotifyKind, { accent: Accent; footer: FooterVariant }> = {
  daily_advice: { accent: 'tangerine', footer: 'advice' },
  weekly_summary: { accent: 'tangerine', footer: 'notification' },
  badge_unlock: { accent: 'tangerine', footer: 'notification' },
};

// Each builder localizes the chrome and interpolates caller data. Data such as
// the advice excerpt, badge name/description, and stat numbers pass through in
// the language they were authored/measured in.
const NOTIFY: {
  [K in NotifyKind]: (lang: Lang, vars: NotifyVars[K]) => NotifyResult;
} = {
  daily_advice: (lang, { plantName, adviceExcerpt }) => {
    const t = {
      ht: {
        subject: `🌿 Konsèy plant jodi a${plantName ? ` — ${plantName}` : ''}`,
        heading: plantName ? `Konsèy jodi a — ${plantName}` : 'Konsèy plant jodi a',
        tail: 'Ouvri tablodebò ou pou tande tout pwofondè konsèy la + bwè-l an son si li disponib.',
        cta: 'Wè konsèy konplè a',
      },
      fr: {
        subject: `🌿 Le conseil plante du jour${plantName ? ` — ${plantName}` : ''}`,
        heading: plantName ? `Conseil du jour — ${plantName}` : 'Le conseil plante du jour',
        tail: "Ouvrez votre tableau de bord pour lire le conseil en entier + l'écouter en audio si disponible.",
        cta: 'Voir le conseil complet',
      },
      en: {
        subject: `🌿 Today's plant tip${plantName ? ` — ${plantName}` : ''}`,
        heading: plantName ? `Today's tip — ${plantName}` : "Today's plant tip",
        tail: 'Open your dashboard to read the full tip + listen to the audio if available.',
        cta: 'See the full tip',
      },
    }[lang];
    return {
      subject: t.subject,
      heading: t.heading,
      paragraphs: [adviceExcerpt, t.tail],
      ctaLabel: t.cta,
      linkPath: '/dashboard',
    };
  },

  weekly_summary: (lang, { nLogs, nTasks, nBadges }) => {
    const t = {
      ht: {
        subject: '🌿 Rezime semèn ou — Hoïs MedikaPlant',
        heading: 'Pwogrè w semèn sa a',
        intro: 'Men yon koudèy sou aktivite ou semèn ki sot pase a:',
        logs: (n: number) => `📊 ${n} antre sou swivi sante w (sik, tansyon, pwa, kè…)`,
        tasks: (n: number) => `✅ ${n} tach pwotokòl ou konplete`,
        badges: (n: number) => `🏆 ${n} nouvo badj ou debloke`,
        tail: 'Kontinye konsa — chak ti pa konte. Ou pral wè evolisyon w nan pwochèn semèn lan.',
        cta: 'Wè detay sou tablodebò',
      },
      fr: {
        subject: '🌿 Votre résumé de la semaine — Hoïs MedikaPlant',
        heading: 'Vos progrès cette semaine',
        intro: 'Voici un aperçu de votre activité de la semaine passée :',
        logs: (n: number) => `📊 ${n} entrées de suivi santé (glycémie, tension, poids, cœur…)`,
        tasks: (n: number) => `✅ ${n} tâches de protocole terminées`,
        badges: (n: number) => `🏆 ${n} nouveaux badges débloqués`,
        tail: 'Continuez ainsi — chaque petit pas compte. Vous verrez votre évolution la semaine prochaine.',
        cta: 'Voir les détails sur le tableau de bord',
      },
      en: {
        subject: '🌿 Your weekly summary — Hoïs MedikaPlant',
        heading: 'Your progress this week',
        intro: "Here's a look at your activity over the past week:",
        logs: (n: number) => `📊 ${n} health-tracking entries (glucose, blood pressure, weight, heart…)`,
        tasks: (n: number) => `✅ ${n} protocol tasks completed`,
        badges: (n: number) => `🏆 ${n} new badges unlocked`,
        tail: 'Keep it up — every small step counts. You’ll see your progress next week.',
        cta: 'See details on the dashboard',
      },
    }[lang];
    const paragraphs = [t.intro];
    if (nLogs > 0) paragraphs.push(t.logs(nLogs));
    if (nTasks > 0) paragraphs.push(t.tasks(nTasks));
    if (nBadges > 0) paragraphs.push(t.badges(nBadges));
    paragraphs.push(t.tail);
    return { subject: t.subject, heading: t.heading, paragraphs, ctaLabel: t.cta, linkPath: '/dashboard/health' };
  },

  badge_unlock: (lang, { badgeName, badgeSlug, badgeSub, badgeDescription }) => {
    const t = {
      ht: {
        subject: `🏆 Felisitasyon — ou debloke "${badgeName}"`,
        heading: `Yon nouvo badj pou ou : ${badgeName}`,
        sub: 'Yon mak rekonesans pou pwogrè w sou Hoïs.',
        desc: 'Kontinye konsa — chak ti pa nan pwotokòl la ap pòte yon nouvo rekonesans.',
        cta: 'Wè badj la',
      },
      fr: {
        subject: `🏆 Félicitations — vous avez débloqué « ${badgeName} »`,
        heading: `Un nouveau badge pour vous : ${badgeName}`,
        sub: 'Une marque de reconnaissance pour vos progrès sur Hoïs.',
        desc: 'Continuez ainsi — chaque petit pas dans le protocole apporte une nouvelle reconnaissance.',
        cta: 'Voir le badge',
      },
      en: {
        subject: `🏆 Congratulations — you unlocked "${badgeName}"`,
        heading: `A new badge for you: ${badgeName}`,
        sub: 'A mark of recognition for your progress on Hoïs.',
        desc: 'Keep it up — every step in the protocol brings a new recognition.',
        cta: 'See the badge',
      },
    }[lang];
    return {
      subject: t.subject,
      heading: t.heading,
      paragraphs: [badgeSub || t.sub, badgeDescription || t.desc],
      ctaLabel: t.cta,
      linkPath: `/dashboard/badges/${badgeSlug}`,
    };
  },
};

export function notifyCopy<K extends NotifyKind>(
  kind: K,
  lang: Lang,
  vars: NotifyVars[K]
): NotifyResult {
  return NOTIFY[kind](lang, vars);
}
