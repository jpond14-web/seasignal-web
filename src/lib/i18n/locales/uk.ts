import type { TranslationKeys } from "./en";

const uk = {
  nav: {
    home: "Головна",
    messages: "Повідомлення",
    community: "Спільнота",
    intel: "Аналітика",
    career: "Моя кар'єра",
    welfare: "Добробут",
  },

  flare_category: {
    unsafe_water: "Небезпечна питна вода",
    wage_theft: "Крадіжка зарплати / Невиплата заробітної плати",
    forced_overtime: "Примусова понаднормова праця",
    document_retention: "Утримання документів (затримка паспортів)",
    unsafe_conditions: "Небезпечні умови праці",
    harassment_abuse: "Переслідування / Насильство",
    environmental_violation: "Порушення екологічних норм",
    food_safety: "Проблеми з безпекою харчування",
    medical_neglect: "Медична недбалість",
    other: "Інше",
  },

  flare_severity: {
    concern: "Занепокоєння",
    concern_desc: "Щось не так і потребує уваги",
    violation: "Порушення",
    violation_desc: "Явне порушення нормативів або прав моряків",
    critical: "Критично",
    critical_desc: "Безпосередня загроза здоров'ю, безпеці або добробуту",
  },

  flare_form: {
    title: "Повідомити про проблему",
    subtitle:
      "Допоможіть морській спільноті, повідомляючи про системні проблеми, яких ви були свідком. Ваш звіт є анонімним за замовчуванням і публікується партіями щотижня.",
    company: "Компанія",
    company_placeholder: "Оберіть компанію",
    vessel: "Судно",
    vessel_optional: "необов'язково",
    vessel_placeholder: "Оберіть судно",
    category_label: "Яка проблема?",
    category_placeholder: "Оберіть тип проблеми",
    severity_label: "Наскільки серйозно?",
    short_title: "Коротка назва",
    title_placeholder: "напр. Водопровідна вода непридатна для пиття на борту",
    details: "Деталі",
    details_guidance:
      "Опишіть те, що ви особисто бачили. Використовуйте конкретні дати, місця та деталі. Дотримуйтесь фактів — «Я бачив...» або «Екіпаж зазнав...», а не звинувачень.",
    details_placeholder: "Опишіть те, що ви бачили...",
    from: "З",
    to: "По",
    evidence: "Докази",
    evidence_help: "Фото, документи — максимум 10 МБ кожен",
    upload_files: "Завантажити файли",
    uploading: "Завантаження...",
    remove: "Видалити",
    anonymous: "Подати анонімно",
    batch_note: "Звіти публікуються партіями щонеділі для захисту вашої особистості.",
    how_it_works:
      "Ваш звіт доповнює інші, щоб сформувати картину системних проблем. Коли достатня кількість моряків повідомляє про ту саму проблему, SeaSignal розслідує, публікує результати та зв'язується з компанією для вирішення. Ваша особистість ніколи не передається нікому за межами SeaSignal.",
    how_it_works_label: "Як це працює:",
    submit: "Надіслати звіт",
    submitting: "Надсилання...",
    required: "обов'язково",
    error_company: "Будь ласка, оберіть компанію",
    error_category: "Будь ласка, оберіть категорію проблеми",
    error_title: "Будь ласка, вкажіть коротку назву",
    error_auth: "Не авторизовано",
    error_profile: "Профіль не знайдено",
  },

  flare_list: {
    title: "Сигнальні ракети",
    subtitle:
      "Проблеми, повідомлені моряками по всій галузі. Закономірності з'являються, коли кілька членів екіпажу повідомляють про ту саму проблему.",
    report_issue: "Повідомити про проблему",
    disclaimer:
      "Ці звіти відображають особисті спостереження моряків і не були незалежно перевірені. Коли достатньо звітів вказують на закономірність, SeaSignal розслідує та зв'язується з компанією.",
    no_flares: "Жодних сигнальних ракет ще не опубліковано.",
    be_first: "Будьте першим, хто повідомить про проблему, свідком якої ви стали.",
    corroborated: "підтверджено",
    seafarer: "моряк",
    seafarers: "моряків",
    no_corroborations: "Підтверджень ще немає",
    witnessed_too: "Я теж це бачив",
  },

  issue_stage: {
    monitoring: "Спостереження",
    emerging: "Нова закономірність",
    investigating: "Під слідством",
    company_contacted: "Компанію повідомлено",
    published: "Опубліковано",
    resolved: "Вирішено",
    unresolved: "Не вирішено",
  },

  common: {
    reports: "звітів",
    report: "звіт",
    corroborations: "підтверджень",
    corroboration: "підтвердження",
    vessels: "суден",
    vessel: "судно",
    since: "З",
    recurring: "Повторюване",
    resolved_on: "Вирішено",
    contacted_on: "Повідомлено",
    no_response: "без вирішення",
    awaiting_response: "очікується відповідь",
    company_contacted_on: "Компанію повідомлено",
    required_field: "*",
  },

  language: {
    label: "Мова",
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

export default uk;
