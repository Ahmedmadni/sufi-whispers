import wardAsset from "@/assets/books/ward-tuli.pdf.asset.json";
import sirahAsset from "@/assets/books/sirah-khaliliyya.pdf.asset.json";
import kashfAsset from "@/assets/books/kashf-al-ghita.pdf.asset.json";
import nafahatKhAsset from "@/assets/books/nafahat-khaliliyya.pdf.asset.json";
import murabbiAsset from "@/assets/books/al-murabbi.pdf.asset.json";
import manaqibAsset from "@/assets/books/manaqib-khaliliyya.pdf.asset.json";
import manahilAsset from "@/assets/books/manahil-khaliliyya.pdf.asset.json";
import coverNafahat from "@/assets/books/cover-nafahat.jpg";
import coverWard from "@/assets/books/cover-ward.jpg";
import coverSirah from "@/assets/books/cover-sirah.jpg";
import coverKashf from "@/assets/books/cover-kashf.jpg";
import coverNafahatKh from "@/assets/books/cover-nafahat-khaliliyya.jpg";
import coverMurabbi from "@/assets/books/cover-murabbi.jpg";
import coverManaqib from "@/assets/books/cover-manaqib.jpg";
import coverManahil from "@/assets/books/cover-manahil.jpg";

export type BookCategory =
  | "madaih"
  | "manaqib"
  | "sirah"
  | "awrad"
  | "maarif";

export const CATEGORY_LABELS: Record<BookCategory, string> = {
  madaih: "مدائح",
  manaqib: "مناقب",
  sirah: "سيرة",
  awrad: "أوراد وأذكار",
  maarif: "معارف وآداب",
};

export type Book = {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  cover: string;
  pdfUrl: string;
  category: BookCategory;
};


export const books: Book[] = [
  {
    id: "nafahat",
    title: "جامع النفحات",
    subtitle: "في مدح سيد السادات ﷺ",
    description:
      "ديوان شعري خليلي يجمع بين القصائد المحمدية الرقيقة، يتلوها السالك في مجالس الذكر والأنس بالنبي ﷺ، ليستشعر نفحات المدينة والمحبة المحمدية.",
    cover: coverNafahat,
    pdfUrl: "/book.pdf",
    category: "madaih",
  },
  {
    id: "ward",
    title: "ورد الاستغفار",
    subtitle: "في توبة الأبرار",
    description:
      "ورد روحاني يومي يجمع أذكار الاستغفار والتوبة على طريقة السادة الخليلية، ليُعين السالك على تطهير القلب والعودة إلى الله بخشوع.",
    cover: coverWard,
    pdfUrl: wardAsset.url,
    category: "awrad",
  },
  {
    id: "sirah",
    title: "السيرة الخليلية",
    subtitle: "السيرة العطرة لسيدي العارف بالله الشيخ محمد أبو خليل",
    description:
      "سيرة مباركة لأحد أعيان الطريقة الخليلية، تحكي محطات من حياته الروحية والعلمية، وتقدم للقارئ نموذجاً حياً للإخلاص والتصوف العملي.",
    cover: coverSirah,
    pdfUrl: sirahAsset.url,
    category: "sirah",
  },
  {
    id: "kashf",
    title: "كشف الغطاء عن أهل البلاء",
    subtitle: "لفضيلة العارف بالله الشيخ صالح أبو خليل",
    description:
      "رسالة روحانية تكشف عن أسرار الصبر والبلاء، وتبيّن كيف تكون المصيبة باب رحمة للمؤمن، بقلم عارف يرى الأحداث بعين الإيمان.",
    cover: coverKashf,
    pdfUrl: kashfAsset.url,
    category: "maarif",
  },
  {
    id: "nafahat-khaliliyya",
    title: "النفحات الخليلية",
    description:
      "مجموعة من القصائد والنفحات المحمدية التي تُنشد على طريقة الخليلية، لتنير مجالس الذكر وتُحيي في القلب محبة النبي ﷺ.",
    cover: coverNafahatKh,
    pdfUrl: nafahatKhAsset.url,
    category: "madaih",
  },
  {
    id: "murabbi",
    title: "المربّي",
    subtitle: "سيدي محمد محمد أبو خليل",
    description:
      "كتاب يجمع سيرة ومآثر ومواعظ شيخ الطريقة الخليلية، يُرشد السالك إلى مكارم الأخلاق وأسس التربية الروحية على الخط العلوي.",
    cover: coverMurabbi,
    pdfUrl: murabbiAsset.url,
    category: "sirah",
  },
  {
    id: "manaqib",
    title: "المناقب الخليلية",
    description:
      "كتاب يستعرض مناقب وفضائل سادة الطريقة الخليلية، ويُبرز مناقب أهل البيت والصالحين من مشايخها، مجمعاً بين التاريخ والتزكية.",
    cover: coverManaqib,
    pdfUrl: manaqibAsset.url,
    category: "manaqib",
  },
  {
    id: "manahil",
    title: "المناهل الخليلية",
    subtitle: "في المعارف والآداب والمقامات والأحوال",
    description:
      "موسوعة روحانية خليلية تتناول المعارف الصوفية والآداب السلوكية والمقامات والأحوال، لتكون منهلاً صافياً للسالك على طريق الحق.",
    cover: coverManahil,
    pdfUrl: manahilAsset.url,
    category: "maarif",
  },
];


export const getBook = (id: string) => books.find((b) => b.id === id);

