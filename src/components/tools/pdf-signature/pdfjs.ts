import type * as PdfJs from "pdfjs-dist";

export type PdfJsLib = typeof PdfJs;
export type PDFDocumentProxy = PdfJs.PDFDocumentProxy;

let pdfjsPromise: Promise<PdfJsLib> | null = null;

/**
 * pdf.js touches browser globals (DOMMatrix, Worker) at import time, so it is
 * loaded lazily on the client only and shares a single worker.
 */
export function loadPdfJs(): Promise<PdfJsLib> {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((lib) => {
      if (!lib.GlobalWorkerOptions.workerPort) {
        lib.GlobalWorkerOptions.workerPort = new Worker(
          new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url),
          { type: "module" },
        );
      }
      return lib;
    });
    pdfjsPromise.catch(() => {
      pdfjsPromise = null;
    });
  }
  return pdfjsPromise;
}
