import type { TranslationKeys } from "./en";

const id = {
  nav: {
    home: "Beranda",
    messages: "Pesan",
    community: "Komunitas",
    intel: "Intelijen",
    career: "Karier Saya",
    welfare: "Kesejahteraan",
  },

  flare_category: {
    unsafe_water: "Air Minum Tidak Aman",
    wage_theft: "Pencurian Upah / Upah Tidak Dibayar",
    forced_overtime: "Lembur Paksa",
    document_retention: "Penahanan Dokumen (Paspor Ditahan)",
    unsafe_conditions: "Kondisi Kerja Tidak Aman",
    harassment_abuse: "Pelecehan / Kekerasan",
    environmental_violation: "Pelanggaran Lingkungan",
    food_safety: "Masalah Keamanan Pangan",
    medical_neglect: "Kelalaian Medis",
    other: "Lainnya",
  },

  flare_severity: {
    concern: "Kekhawatiran",
    concern_desc: "Ada yang tidak beres dan perlu diperhatikan",
    violation: "Pelanggaran",
    violation_desc: "Pelanggaran nyata terhadap peraturan atau hak pelaut",
    critical: "Kritis",
    critical_desc: "Bahaya langsung terhadap kesehatan, keselamatan, atau kesejahteraan",
  },

  flare_form: {
    title: "Laporkan Masalah",
    subtitle:
      "Bantu komunitas maritim dengan melaporkan masalah sistemik yang Anda saksikan. Laporan Anda anonim secara default dan dirilis secara berkelompok setiap minggu.",
    company: "Perusahaan",
    company_placeholder: "Pilih perusahaan",
    vessel: "Kapal",
    vessel_optional: "opsional",
    vessel_placeholder: "Pilih kapal",
    category_label: "Apa masalahnya?",
    category_placeholder: "Pilih jenis masalah",
    severity_label: "Seberapa serius?",
    short_title: "Judul singkat",
    title_placeholder: "mis. Air keran tidak aman untuk diminum di kapal",
    details: "Detail",
    details_guidance:
      "Jelaskan apa yang Anda saksikan secara pribadi. Gunakan tanggal, lokasi, dan detail yang spesifik. Tetap pada fakta — \"Saya melihat...\" atau \"Awak kapal mengalami...\" daripada tuduhan.",
    details_placeholder: "Jelaskan apa yang Anda saksikan...",
    from: "Dari",
    to: "Hingga",
    evidence: "Bukti",
    evidence_help: "Foto, dokumen — maks 10 MB masing-masing",
    upload_files: "Unggah file",
    uploading: "Mengunggah...",
    remove: "Hapus",
    anonymous: "Kirim secara anonim",
    batch_note: "Laporan dirilis secara berkelompok setiap hari Minggu untuk melindungi identitas Anda.",
    how_it_works:
      "Laporan Anda bergabung dengan laporan lain untuk membangun gambaran masalah sistemik. Ketika cukup banyak pelaut melaporkan masalah yang sama, SeaSignal menyelidiki, menerbitkan temuan, dan menghubungi perusahaan untuk mencari solusi. Identitas Anda tidak pernah dibagikan kepada siapa pun di luar SeaSignal.",
    how_it_works_label: "Cara kerjanya:",
    submit: "Kirim Laporan",
    submitting: "Mengirim...",
    required: "wajib",
    error_company: "Silakan pilih perusahaan",
    error_category: "Silakan pilih kategori masalah",
    error_title: "Silakan berikan judul singkat",
    error_auth: "Tidak terautentikasi",
    error_profile: "Profil tidak ditemukan",
  },

  flare_list: {
    title: "Sinyal Darurat",
    subtitle:
      "Masalah yang dilaporkan pelaut di seluruh industri. Pola muncul ketika beberapa awak kapal melaporkan masalah yang sama.",
    report_issue: "Laporkan Masalah",
    disclaimer:
      "Laporan-laporan ini mencerminkan pengamatan individu pelaut dan belum diverifikasi secara independen. Ketika cukup banyak laporan menunjukkan suatu pola, SeaSignal menyelidiki dan menghubungi perusahaan.",
    no_flares: "Belum ada sinyal darurat yang diterbitkan.",
    be_first: "Jadilah yang pertama melaporkan masalah yang Anda saksikan.",
    corroborated: "dikuatkan",
    seafarer: "pelaut",
    seafarers: "pelaut",
    no_corroborations: "Belum ada konfirmasi",
    witnessed_too: "Saya juga menyaksikan ini",
  },

  issue_stage: {
    monitoring: "Pemantauan",
    emerging: "Pola Baru Muncul",
    investigating: "Sedang Diselidiki",
    company_contacted: "Perusahaan Dihubungi",
    published: "Diterbitkan",
    resolved: "Diselesaikan",
    unresolved: "Belum Diselesaikan",
  },

  common: {
    reports: "laporan",
    report: "laporan",
    corroborations: "konfirmasi",
    corroboration: "konfirmasi",
    vessels: "kapal",
    vessel: "kapal",
    since: "Sejak",
    recurring: "Berulang",
    resolved_on: "Diselesaikan",
    contacted_on: "Dihubungi",
    no_response: "tanpa penyelesaian",
    awaiting_response: "menunggu respons",
    company_contacted_on: "Perusahaan dihubungi",
    required_field: "*",
  },

  language: {
    label: "Bahasa",
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

export default id;
