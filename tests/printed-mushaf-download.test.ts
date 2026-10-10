import { describe, expect, test } from "bun:test";
import { PRINTED_MUSHAF } from "../src/lib/printed-mushaf";
import { receivePrintedPdf } from "../src/lib/printed-mushaf-storage";

describe("printed Mushaf download transport", () => {
  test("streams PDF bytes exactly, reporting monotonically increasing progress", async () => {
    const original = new TextEncoder().encode("%PDF-1.7\nمصحف موثوق");
    const chunks = [original.slice(0, 7), original.slice(7)];
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(chunk);
        controller.close();
      },
    });
    const fractions: number[] = [];
    const result = await receivePrintedPdf(new Response(body, {
      headers: { "Content-Length": String(original.byteLength) },
    }), (value) => fractions.push(value));
    expect(new Uint8Array(await result.arrayBuffer())).toEqual(original);
    expect(fractions.length).toBe(2);
    expect(fractions[0]).toBeGreaterThan(0);
    expect(fractions[1]).toBeGreaterThanOrEqual(fractions[0]);
    expect(fractions[1]).toBeCloseTo(original.byteLength / PRINTED_MUSHAF.byteLength);
  });

  test("refuses a declared oversized file without fetching any content", async () => {
    const body = new ReadableStream<Uint8Array>();
    await expect(receivePrintedPdf(new Response(body, {
      headers: { "Content-Length": String(PRINTED_MUSHAF.byteLength + 1) },
    }), () => undefined)).rejects.toThrow(/أكبر/);
    await body.cancel();
  });

  test("honors a user-canceled download before consuming content", async () => {
    const ctrl = new AbortController();
    ctrl.abort();
    await expect(receivePrintedPdf(new Response("%PDF-1.7"), () => undefined, ctrl.signal))
      .rejects.toMatchObject({ name: "AbortError" });
  });

  test("rejects non-successful responses before accepting a PDF", async () => {
    await expect(receivePrintedPdf(new Response("not found", { status: 404 }), () => undefined))
      .rejects.toThrow(/HTTP 404/);
  });
});
