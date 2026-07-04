import wardAsset from "@/assets/books/ward-tuli.pdf.asset.json";
import sirahAsset from "@/assets/books/sirah-khaliliyya.pdf.asset.json";
import coverNafahat from "@/assets/books/cover-nafahat.jpg";
import coverWard from "@/assets/books/cover-ward.jpg";
import coverSirah from "@/assets/books/cover-sirah.jpg";

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
    title: "الوِرد الطولي",
    subtitle: "في الأوراد والأذكار الصوفية",
    cover: coverWard,
    pdfUrl: wardAsset.url,
  },
  {
    id: "sirah",
    title: "السيرة الخليلية",
    subtitle: "في مولد النبي المختار ﷺ",
    cover: coverSirah,
    pdfUrl: sirahAsset.url,
  },
];

export const getBook = (id: string) => books.find((b) => b.id === id);
