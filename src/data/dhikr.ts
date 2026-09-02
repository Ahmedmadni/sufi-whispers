export type DhikrName = {
  id: string;
  name: string;
  meaning: string;
  note: string;
};

/** الأسماء الثلاثة عشر التي يُذكر بها في الطريق الخليلي، بالترتيب. */
export const DHIKR_NAMES: DhikrName[] = [
  { id: "tahlil", name: "لا إله إلا الله", meaning: "لا معبود بحقٍّ إلا الله", note: "مفتاح الذكر وأصله" },
  { id: "allah", name: "اللّه", meaning: "علمٌ على الذات العليّة", note: "الاسم الجامع" },
  { id: "huwa", name: "هو", meaning: "حاضرٌ لا يغيب", note: "اسم الغيب المطلق" },
  { id: "hayy", name: "حيّ", meaning: "دائم الحياة", note: "حياةٌ لا يعقبها فناء" },
  { id: "wahid", name: "واحد", meaning: "لا ثاني له", note: "الأحدية المطلقة" },
  { id: "aziz", name: "عزيز", meaning: "لا نظير له", note: "العزّة الكاملة" },
  { id: "wadud", name: "ودود", meaning: "كثير الودّ لعباده", note: "محبةٌ ورحمة" },
  { id: "haqq", name: "حقّ", meaning: "ثابتٌ لا يتغيّر", note: "الحقّ المبين" },
  { id: "qahhar", name: "قهّار", meaning: "يقهر ولا يُقهر", note: "القهر الإلهي" },
  { id: "qayyum", name: "قيّوم", meaning: "قائمٌ بأسباب مخلوقاته", note: "قيامٌ دائم" },
  { id: "wahhab", name: "وهّاب", meaning: "كثير العطاء", note: "الجود بلا حساب" },
  { id: "muhaymin", name: "مهيمن", meaning: "مطّلعٌ على أفعال مخلوقاته", note: "الرقابة الشاملة" },
  { id: "basit", name: "باسط", meaning: "يبسط الرزق لمن يشاء من عباده", note: "بسط الأرزاق" },
];

/** الهدف لكل اسم: مائة ألف مرة. */
export const NAME_TARGET = 100000;

export type WirdPhase = "salawat" | "istighfar" | "asma";

export type Wird = {
  phase: WirdPhase;
  label: string;
  window: string;
  text: string;
  hint: string;
};

export const WIRD_SALAWAT: Wird = {
  phase: "salawat",
  label: "الصلاة على النبي ﷺ",
  window: "من الفجر إلى العصر",
  text: "اَللَّهُمَّ صَلِّ وَسَلِّمْ وَبَارِكْ عَلَى سَيِّدِنَا مُحَمَّدٍ وَعَلَى آلِهِ وَصَحْبِهِ عَدَدَ مَا فِي عِلْمِ اللهِ، صَلَاةً دَائِمَةً بِدَوَامِ مُلْكِ اللهِ",
  hint: "على قدر الاستطاعة",
};

export const WIRD_ISTIGHFAR: Wird = {
  phase: "istighfar",
  label: "الاستغفار",
  window: "من العصر إلى المغرب",
  text: "أَسْتَغْفِرُ اللهَ الْعَظِيمَ وَهُوَ التَّوَّابُ الرَّحِيمُ",
  hint: "كما في أوراد الطريق (صفحة ٤٢)",
};

export const WIRD_ASMA: Wird = {
  phase: "asma",
  label: "الذكر بأسماء الله الحسنى",
  window: "من المغرب إلى الفجر",
  text: "يُذكر الاسم مائة ألف مرة، فإذا تمّ العدد انتقل المريد إلى الاسم الذي يليه حتى تتمّ الأسماء كلّها ثم يعود لأوّلها.",
  hint: "وقت التجليات وخلوة الأحباب",
};

/** يحدّد ورد الساعة الحالية تقريبيًا حسب ساعة الجهاز. */
export function currentWird(now: Date = new Date()): Wird {
  const h = now.getHours();
  if (h >= 4 && h < 15) return WIRD_SALAWAT; // الفجر → العصر
  if (h >= 15 && h < 18) return WIRD_ISTIGHFAR; // العصر → المغرب
  return WIRD_ASMA; // المغرب → الفجر
}
