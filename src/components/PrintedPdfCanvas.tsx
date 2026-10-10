import { Document, Page, pdfjs } from "react-pdf";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { LoaderCircle } from "lucide-react";

// Imported ONLY inside the browser via the reader's useEffect. Neither
// react-pdf nor pdfjs-dist may be evaluated by Node/Cloudflare SSR,
// where DOMMatrix and Canvas APIs do not exist.
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const PDF_OPTIONS = {
  cMapUrl: "/pdfjs/cmaps/",
  cMapPacked: true,
  standardFontDataUrl: "/pdfjs/standard_fonts/",
};

export type PrintedPdfCanvasProps = {
  pdf: Blob;
  pdfPage: number;
  width: number;
  onPageCount: (pages: number) => void;
  onError: (message: string) => void;
};

export default function PrintedPdfCanvas({
  pdf, pdfPage, width, onPageCount, onError,
}: PrintedPdfCanvasProps) {
  return (
    <Document
      file={pdf}
      options={PDF_OPTIONS}
      loading={<div role="status" className="printed-reader__empty">
        <LoaderCircle className="animate-spin h-6 w-6" /> جارٍ فتح المصحف…
      </div>}
      onLoadSuccess={({ numPages }) => onPageCount(numPages)}
      onLoadError={(error) => onError(`تعذّر فتح المصحف: ${error.message}`)}
      error={<div role="alert" className="printed-reader__empty">
        تعذّر فتح ملف PDF. يمكنك حذف النسخة وإعادة استيرادها.
      </div>}
    >
      <Page
        pageNumber={pdfPage}
        width={width}
        renderTextLayer={false}
        renderAnnotationLayer={false}
        devicePixelRatio={1.5}
        loading={<div role="status" className="printed-reader__empty">
          <LoaderCircle className="animate-spin h-5 w-5" /> جارٍ عرض الصفحة…
        </div>}
      />
    </Document>
  );
}
