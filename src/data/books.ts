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

export type Book = {
  id: string;
  title: string;
  subtitle?: string;
  cover: string;
  pdfUrl: string;
};

export const books: Book[] = [
  {
    id: "nafahat",
    title: "جامع النفحات",
    subtitle: "في مدح سيد السادات ﷺ",
    cover: coverNafahat,
    pdfUrl: "/book.pdf",
  },
  {
    id: "ward",
    title: "ورد الاستغفار",
    subtitle: "في توبة الأبرار",
    cover: coverWard,
    pdfUrl: wardAsset.url,
  },
  {
    id: "sirah",
    title: "السيرة الخليلية",
    subtitle: "السيرة العطرة لسيدي العارف بالله الشيخ محمد أبو خليل",
    cover: coverSirah,
    pdfUrl: sirahAsset.url,
  },
  {
    id: "kashf",
    title: "كشف الغطاء عن أهل البلاء",
    subtitle: "لفضيلة العارف بالله الشيخ صالح أبو خليل",
    cover: coverKashf,
    pdfUrl: kashfAsset.url,
  },
  {
    id: "nafahat-khaliliyya",
    title: "النفحات الخليلية",
    cover: coverNafahatKh,
    pdfUrl: nafahatKhAsset.url,
  },
  {
    id: "murabbi",
    title: "المربّي",
    subtitle: "سيدي محمد محمد أبو خليل",
    cover: coverMurabbi,
    pdfUrl: murabbiAsset.url,
  },
  {
    id: "manaqib",
    title: "المناقب الخليلية",
    cover: coverManaqib,
    pdfUrl: manaqibAsset.url,
  },
  {
    id: "manahil",
    title: "المناهل الخليلية",
    subtitle: "في المعارف والآداب والمقامات والأحوال",
    cover: coverManahil,
    pdfUrl: manahilAsset.url,
  },
];

export const getBook = (id: string) => books.find((b) => b.id === id);
