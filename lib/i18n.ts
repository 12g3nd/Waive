/**
 * Static-UI translations for the result view.
 *
 * The LLM already translates the *dynamic* content (the plain-language explanation,
 * the draft, Q&A answers) into the chosen language. But the page's own chrome —
 * section headers, labels, buttons — was hardcoded English, so switching language
 * left every heading in English. This dictionary covers those static strings for the
 * languages the toggle offers (en / es / fr), looked up with `t(language, key)`.
 *
 * Legal text that comes from the corpus (statute names, citation text, rule strings)
 * is intentionally NOT translated here — those are quoted sources and stay verbatim.
 */

export type Lang = "en" | "es" | "fr";

type Dict = Record<string, string>;

const en: Dict = {
  // Shared
  "common.startOver": "Start over",
  "common.translating": "Translating…",

  // Result view — header band + notice summary + disclaimer
  "result.decoded": "decoded",
  "result.noClock": "No clock yet",
  "result.noClockBody":
    "We couldn’t read a date to start the deadline from. See the review note below.",
  "result.from": "From",
  "result.for": "For",
  "result.amount": "Amount",
  "result.reference": "Reference",
  "result.disclaimerLead": "Waive is information and document preparation, not legal advice.",
  "result.disclaimerRest":
    "It is a tool for legal-aid groups and advocates, not a lawyer. When in doubt, have a clinic review your case.",

  // Explanation panel
  "explain.title": "In plain language",
  "explain.whatThisIs": "What this is",
  "explain.whatIfNothing": "What happens if you do nothing",
  "explain.whatToDoNow": "What to do now",
  "explain.plainText": "plain text",

  // Remedy panel
  "remedy.yourRoute": "Your route",
  "remedy.recommended": "Recommended",
  "remedy.integrityCheck": "Integrity check",
  "remedy.otherPaths": "Other paths",

  // Confidence panel
  "confidence.title": "Reading confidence",
  "confidence.high": "High confidence",
  "confidence.medium": "Medium confidence",
  "confidence.low": "Low confidence",
  "confidence.doubleCheck": "Double-check these fields from the notice:",
  "confidence.escalateDefault":
    "This case has a genuine judgment call, have a legal-aid clinic review it.",

  // Ask panel
  "ask.title": "Ask about your notice",
  "ask.subtitle": "Answers come only from the verified sources on this page, never invented.",
  "ask.placeholder": "e.g. Can this debt be cancelled?",
  "ask.aria": "Ask a question about your notice",
  "ask.ask": "Ask",
  "ask.reading": "Reading your sources…",
  "ask.finding": "Finding an answer in your sources…",
  "ask.groundedBadge": "Ollama · grounded",
  "ask.fromSources": "from your sources",
  "ask.askAnother": "ask another",
  "ask.errorGeneric": "Something went wrong.",
  "ask.errorNetwork": "Couldn’t reach the server. Try again.",

  // Document preview
  "doc.yourDraft": "Your draft",
  "doc.structuredDraft": "structured draft",
  "doc.copied": "Copied",
  "doc.copy": "Copy",
  "doc.print": "Print / PDF",
  "doc.howToFile": "How & where to file",
  "doc.form": "Form",
  "doc.printDisclaimer":
    "Prepared with Waive, information and document preparation, not legal advice. Check every detail against your own notice before filing.",

  // Deadline clock
  "clock.dayLeft": "day left",
  "clock.daysLeft": "days left",
  "clock.passed": "Passed",
  "clock.passedBody": "act now, this may need urgent review",
  "clock.protectedWindow": "Protected window",

  // Presumption banner
  "presumption.title": "The catch they’re counting on you to miss",
  "presumption.automatic": "Automatic",
  "presumption.likely": "Likely",
  "presumption.possible": "Possible",

  // Citations panel
  "citations.title": "Sources",
  "citations.verifiedCount": "{n}/{m} verified",
  "citations.usedFor": "Used for:",
  "citations.verified": "verified",
  "citations.unverified": "unverified",
  "citations.source": "source",

  // Decision trace
  "trace.title": "How Waive reached this",
  "trace.intro":
    "The model only reads your notice into fields. Every deadline, route, and catch below is computed by tested code and traces to a real source, nothing here is guessed.",
  "trace.step1Title": "Read your notice into fields",
  "trace.actorAiReads": "AI · reads",
  "trace.actorInputRead": "Input · read",
  "trace.step1Model":
    "A local AI model turned the letter into structured fields. It never decides your outcome.",
  "trace.step1Sample":
    "Structured fields from this sample. No model needed to run everything below.",
  "trace.factType": "Type",
  "trace.factDated": "Dated",
  "trace.step2Actor": "Code · computes",
  "trace.step2Title": "Computed your deadline",
  "trace.yourClock": "your clock",
  "trace.step3Actor": "Code · routes",
  "trace.step3Title": "Routed your remedy",
  "trace.step4Actor": "Code · checks",
  "trace.step4Title": "Checked the catches",
  "trace.sourcesVerified": "{n} of {m} sources verified",
  "trace.lowConfidence": "Low-confidence read, flagged for a legal-aid clinic to review.",

  // Add to calendar
  "calendar.add": "Add to calendar",
};

const es: Dict = {
  "common.startOver": "Empezar de nuevo",
  "common.translating": "Traduciendo…",

  "result.decoded": "analizado",
  "result.noClock": "Sin plazo aún",
  "result.noClockBody":
    "No pudimos leer una fecha para iniciar el plazo. Consulta la nota de revisión más abajo.",
  "result.from": "De",
  "result.for": "Para",
  "result.amount": "Monto",
  "result.reference": "Referencia",
  "result.disclaimerLead":
    "Waive ofrece información y preparación de documentos, no asesoría legal.",
  "result.disclaimerRest":
    "Es una herramienta para organizaciones de ayuda legal y defensores, no un abogado. Ante la duda, pide a una clínica que revise tu caso.",

  "explain.title": "En lenguaje sencillo",
  "explain.whatThisIs": "Qué es esto",
  "explain.whatIfNothing": "Qué pasa si no haces nada",
  "explain.whatToDoNow": "Qué hacer ahora",
  "explain.plainText": "texto sin formato",

  "remedy.yourRoute": "Tu camino",
  "remedy.recommended": "Recomendado",
  "remedy.integrityCheck": "Verificación de integridad",
  "remedy.otherPaths": "Otras opciones",

  "confidence.title": "Confianza de lectura",
  "confidence.high": "Confianza alta",
  "confidence.medium": "Confianza media",
  "confidence.low": "Confianza baja",
  "confidence.doubleCheck": "Verifica estos campos del aviso:",
  "confidence.escalateDefault":
    "Este caso requiere un juicio profesional; pide a una clínica de ayuda legal que lo revise.",

  "ask.title": "Pregunta sobre tu aviso",
  "ask.subtitle":
    "Las respuestas provienen solo de las fuentes verificadas de esta página, nunca se inventan.",
  "ask.placeholder": "p. ej. ¿Se puede cancelar esta deuda?",
  "ask.aria": "Haz una pregunta sobre tu aviso",
  "ask.ask": "Preguntar",
  "ask.reading": "Leyendo tus fuentes…",
  "ask.finding": "Buscando una respuesta en tus fuentes…",
  "ask.groundedBadge": "Ollama · con fuentes",
  "ask.fromSources": "desde tus fuentes",
  "ask.askAnother": "preguntar otra",
  "ask.errorGeneric": "Algo salió mal.",
  "ask.errorNetwork": "No se pudo conectar al servidor. Inténtalo de nuevo.",

  "doc.yourDraft": "Tu borrador",
  "doc.structuredDraft": "borrador estructurado",
  "doc.copied": "Copiado",
  "doc.copy": "Copiar",
  "doc.print": "Imprimir / PDF",
  "doc.howToFile": "Cómo y dónde presentarlo",
  "doc.form": "Formulario",
  "doc.printDisclaimer":
    "Preparado con Waive: información y preparación de documentos, no asesoría legal. Verifica cada detalle con tu propio aviso antes de presentarlo.",

  "clock.dayLeft": "día restante",
  "clock.daysLeft": "días restantes",
  "clock.passed": "Vencido",
  "clock.passedBody": "actúa ya, esto puede requerir revisión urgente",
  "clock.protectedWindow": "Ventana protegida",

  "presumption.title": "La trampa que cuentan con que pases por alto",
  "presumption.automatic": "Automático",
  "presumption.likely": "Probable",
  "presumption.possible": "Posible",

  "citations.title": "Fuentes",
  "citations.verifiedCount": "{n}/{m} verificadas",
  "citations.usedFor": "Usado para:",
  "citations.verified": "verificada",
  "citations.unverified": "sin verificar",
  "citations.source": "fuente",

  "trace.title": "Cómo Waive llegó a esto",
  "trace.intro":
    "El modelo solo lee tu aviso y lo convierte en campos. Cada plazo, ruta y detalle a continuación lo calcula código probado y se basa en una fuente real; nada aquí es adivinado.",
  "trace.step1Title": "Leyó tu aviso en campos",
  "trace.actorAiReads": "IA · lee",
  "trace.actorInputRead": "Entrada · leída",
  "trace.step1Model":
    "Una IA local convirtió la carta en campos estructurados. Nunca decide tu resultado.",
  "trace.step1Sample":
    "Campos estructurados de este ejemplo. No se necesita modelo para todo lo de abajo.",
  "trace.factType": "Tipo",
  "trace.factDated": "Fecha",
  "trace.step2Actor": "Código · calcula",
  "trace.step2Title": "Calculó tu plazo",
  "trace.yourClock": "tu plazo",
  "trace.step3Actor": "Código · enruta",
  "trace.step3Title": "Determinó tu opción",
  "trace.step4Actor": "Código · verifica",
  "trace.step4Title": "Revisó los detalles clave",
  "trace.sourcesVerified": "{n} de {m} fuentes verificadas",
  "trace.lowConfidence":
    "Lectura de baja confianza, marcada para que la revise una clínica de ayuda legal.",

  "calendar.add": "Agregar al calendario",
};

const fr: Dict = {
  "common.startOver": "Recommencer",
  "common.translating": "Traduction…",

  "result.decoded": "analysé",
  "result.noClock": "Pas encore de délai",
  "result.noClockBody":
    "Nous n’avons pas pu lire une date pour démarrer le délai. Voyez la note de révision ci-dessous.",
  "result.from": "De",
  "result.for": "Pour",
  "result.amount": "Montant",
  "result.reference": "Référence",
  "result.disclaimerLead":
    "Waive fournit de l’information et la préparation de documents, pas des conseils juridiques.",
  "result.disclaimerRest":
    "C’est un outil pour les organismes d’aide juridique et les intervenants, pas un avocat. En cas de doute, faites examiner votre dossier par une clinique.",

  "explain.title": "En langage simple",
  "explain.whatThisIs": "De quoi il s’agit",
  "explain.whatIfNothing": "Ce qui arrive si vous ne faites rien",
  "explain.whatToDoNow": "Que faire maintenant",
  "explain.plainText": "texte simple",

  "remedy.yourRoute": "Votre parcours",
  "remedy.recommended": "Recommandé",
  "remedy.integrityCheck": "Contrôle d’intégrité",
  "remedy.otherPaths": "Autres options",

  "confidence.title": "Fiabilité de lecture",
  "confidence.high": "Fiabilité élevée",
  "confidence.medium": "Fiabilité moyenne",
  "confidence.low": "Fiabilité faible",
  "confidence.doubleCheck": "Revérifiez ces champs de l’avis :",
  "confidence.escalateDefault":
    "Ce dossier demande un jugement professionnel; faites-le examiner par une clinique d’aide juridique.",

  "ask.title": "Posez une question sur votre avis",
  "ask.subtitle":
    "Les réponses proviennent uniquement des sources vérifiées de cette page, jamais inventées.",
  "ask.placeholder": "p. ex. Cette dette peut-elle être annulée ?",
  "ask.aria": "Posez une question sur votre avis",
  "ask.ask": "Demander",
  "ask.reading": "Lecture de vos sources…",
  "ask.finding": "Recherche d’une réponse dans vos sources…",
  "ask.groundedBadge": "Ollama · sourcé",
  "ask.fromSources": "d’après vos sources",
  "ask.askAnother": "poser une autre",
  "ask.errorGeneric": "Une erreur est survenue.",
  "ask.errorNetwork": "Impossible de joindre le serveur. Réessayez.",

  "doc.yourDraft": "Votre brouillon",
  "doc.structuredDraft": "brouillon structuré",
  "doc.copied": "Copié",
  "doc.copy": "Copier",
  "doc.print": "Imprimer / PDF",
  "doc.howToFile": "Comment et où déposer",
  "doc.form": "Formulaire",
  "doc.printDisclaimer":
    "Préparé avec Waive : information et préparation de documents, pas de conseils juridiques. Vérifiez chaque détail avec votre propre avis avant de déposer.",

  "clock.dayLeft": "jour restant",
  "clock.daysLeft": "jours restants",
  "clock.passed": "Échu",
  "clock.passedBody": "agissez maintenant, une révision urgente peut être nécessaire",
  "clock.protectedWindow": "Fenêtre protégée",

  "presumption.title": "Le piège qu’ils comptent vous voir manquer",
  "presumption.automatic": "Automatique",
  "presumption.likely": "Probable",
  "presumption.possible": "Possible",

  "citations.title": "Sources",
  "citations.verifiedCount": "{n}/{m} vérifiées",
  "citations.usedFor": "Utilisé pour :",
  "citations.verified": "vérifiée",
  "citations.unverified": "non vérifiée",
  "citations.source": "source",

  "trace.title": "Comment Waive est arrivé à ce résultat",
  "trace.intro":
    "Le modèle se contente de lire votre avis en champs. Chaque délai, parcours et détail ci-dessous est calculé par du code testé et renvoie à une source réelle; rien n’est deviné.",
  "trace.step1Title": "Lecture de votre avis en champs",
  "trace.actorAiReads": "IA · lit",
  "trace.actorInputRead": "Entrée · lue",
  "trace.step1Model":
    "Une IA locale a converti la lettre en champs structurés. Elle ne décide jamais de votre sort.",
  "trace.step1Sample":
    "Champs structurés de cet exemple. Aucun modèle requis pour la suite.",
  "trace.factType": "Type",
  "trace.factDated": "Daté",
  "trace.step2Actor": "Code · calcule",
  "trace.step2Title": "Calcul de votre délai",
  "trace.yourClock": "votre délai",
  "trace.step3Actor": "Code · oriente",
  "trace.step3Title": "Orientation de votre recours",
  "trace.step4Actor": "Code · vérifie",
  "trace.step4Title": "Vérification des points clés",
  "trace.sourcesVerified": "{n} de {m} sources vérifiées",
  "trace.lowConfidence":
    "Lecture peu fiable, signalée pour révision par une clinique d’aide juridique.",

  "calendar.add": "Ajouter au calendrier",
};

const DICTS: Record<string, Dict> = { en, es, fr };

/**
 * Look up a static UI string in the given language, falling back to English (then to
 * the key itself) when a translation is missing. `vars` interpolates `{name}` tokens.
 */
export function t(
  language: string,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const dict = DICTS[language] ?? en;
  let s = dict[key] ?? en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.split(`{${k}}`).join(String(v));
    }
  }
  return s;
}
