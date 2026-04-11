import type { TranslationKeys } from "./en";

const es = {
  nav: {
    home: "Inicio",
    messages: "Mensajes",
    community: "Comunidad",
    intel: "Inteligencia",
    career: "Mi Carrera",
    welfare: "Bienestar",
  },

  flare_category: {
    unsafe_water: "Agua Potable No Segura",
    wage_theft: "Robo de Salario / Salarios Impagos",
    forced_overtime: "Horas Extra Forzadas",
    document_retention: "Retención de Documentos (Pasaportes Retenidos)",
    unsafe_conditions: "Condiciones de Trabajo Inseguras",
    harassment_abuse: "Acoso / Abuso",
    environmental_violation: "Violación Ambiental",
    food_safety: "Problemas de Seguridad Alimentaria",
    medical_neglect: "Negligencia Médica",
    other: "Otro",
  },

  flare_severity: {
    concern: "Preocupación",
    concern_desc: "Algo no está bien y debe estar en el radar",
    violation: "Violación",
    violation_desc: "Un incumplimiento claro de reglamentos o derechos de marineros",
    critical: "Crítico",
    critical_desc: "Peligro inmediato para la salud, seguridad o bienestar",
  },

  flare_form: {
    title: "Reportar un Problema",
    subtitle:
      "Ayuda a la comunidad marítima reportando problemas sistémicos que hayas presenciado. Tu reporte es anónimo por defecto y se publica en lotes semanalmente.",
    company: "Empresa",
    company_placeholder: "Seleccionar empresa",
    vessel: "Embarcación",
    vessel_optional: "opcional",
    vessel_placeholder: "Seleccionar embarcación",
    category_label: "¿Cuál es el problema?",
    category_placeholder: "Seleccionar tipo de problema",
    severity_label: "¿Qué tan grave es?",
    short_title: "Título corto",
    title_placeholder: "ej. Agua del grifo no apta para beber a bordo",
    details: "Detalles",
    details_guidance:
      "Describe lo que presenciaste personalmente. Usa fechas, lugares y detalles específicos. Limítate a los hechos — \"Yo vi...\" o \"La tripulación experimentó...\" en lugar de acusaciones.",
    details_placeholder: "Describe lo que presenciaste...",
    from: "Desde",
    to: "Hasta",
    evidence: "Evidencia",
    evidence_help: "Fotos, documentos — máximo 10 MB cada uno",
    upload_files: "Subir archivos",
    uploading: "Subiendo...",
    remove: "Eliminar",
    anonymous: "Enviar anónimamente",
    batch_note: "Los reportes se publican en lotes cada domingo para proteger tu identidad.",
    how_it_works:
      "Tu reporte se une a otros para construir un panorama de problemas sistémicos. Cuando suficientes marineros reportan el mismo problema, SeaSignal investiga, publica los hallazgos y contacta a la empresa para buscar una solución. Tu identidad nunca se comparte con nadie fuera de SeaSignal.",
    how_it_works_label: "Cómo funciona:",
    submit: "Enviar Reporte",
    submitting: "Enviando...",
    required: "requerido",
    error_company: "Por favor selecciona una empresa",
    error_category: "Por favor selecciona una categoría de problema",
    error_title: "Por favor proporciona un título corto",
    error_auth: "No autenticado",
    error_profile: "Perfil no encontrado",
  },

  flare_list: {
    title: "Bengalas de Señal",
    subtitle:
      "Problemas reportados por marineros en toda la industria. Los patrones emergen cuando varios tripulantes reportan el mismo problema.",
    report_issue: "Reportar un Problema",
    disclaimer:
      "Estos reportes reflejan observaciones individuales de marineros y no han sido verificados independientemente. Cuando suficientes reportes apuntan a un patrón, SeaSignal investiga y contacta a la empresa.",
    no_flares: "Aún no se han publicado bengalas de señal.",
    be_first: "Sé el primero en reportar un problema que hayas presenciado.",
    corroborated: "corroborado",
    seafarer: "marinero",
    seafarers: "marineros",
    no_corroborations: "Sin corroboraciones aún",
    witnessed_too: "Yo también lo presencié",
  },

  issue_stage: {
    monitoring: "Monitoreando",
    emerging: "Patrón Emergente",
    investigating: "Bajo Investigación",
    company_contacted: "Empresa Contactada",
    published: "Publicado",
    resolved: "Resuelto",
    unresolved: "Sin Resolver",
  },

  common: {
    reports: "reportes",
    report: "reporte",
    corroborations: "corroboraciones",
    corroboration: "corroboración",
    vessels: "embarcaciones",
    vessel: "embarcación",
    since: "Desde",
    recurring: "Recurrente",
    resolved_on: "Resuelto",
    contacted_on: "Contactado",
    no_response: "sin resolución",
    awaiting_response: "esperando respuesta",
    company_contacted_on: "Empresa contactada",
    required_field: "*",
  },

  language: {
    label: "Idioma",
    en: "English",
    fil: "Filipino",
    hi: "हिन्दी",
    zh: "简体中文",
    id: "Bahasa Indonesia",
    ru: "Русский",
    uk: "Українська",
    es: "Español",
    my: "မြန်မာ",
  },
} as const satisfies TranslationKeys;

export default es;
