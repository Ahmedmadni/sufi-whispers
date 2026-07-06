import wardAsset from "@/assets/books/ward-tuli.pdf.asset.json";
import sirahAsset from "@/assets/books/sirah-khaliliyya.pdf.asset.json";
import kashfAsset from "@/assets/books/kashf-al-ghita.pdf.asset.json";
import coverNafahat from "@/assets/books/cover-nafahat.jpg";
import coverWard from "@/assets/books/cover-ward.jpg";
import coverSirah from "@/assets/books/cover-sirah.jpg";
import coverKashf from "@/assets/books/cover-kashf.jpg";

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
];

export const getBook = (id: string) => books.find((b) => b.id === id);
