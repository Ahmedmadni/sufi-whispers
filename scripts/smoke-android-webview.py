#!/usr/bin/env python3
"""Reproduce reader errors inside Android System WebView via DevTools protocol.

Run after ADB has forwarded tcp:9222 -> localabstract:webview_devtools_remote_PID.
Neither the app content nor book source files are modified.
"""
import json
import os
import sys
import time
import urllib.request
from websocket import create_connection

HOST = "http://127.0.0.1:9222"
BOOKS = ["ward", "sirah", "kashf", "nafahat-khaliliyya", "murabbi", "manaqib", "manahil", "nafahat"]


def discover():
    for _ in range(30):
        try:
            with urllib.request.urlopen(HOST + "/json", timeout=3) as response:
                entries = json.load(response)
            pages = [entry for entry in entries if entry.get("type") == "page" and entry.get("webSocketDebuggerUrl")]
            if pages:
                return pages[0]["webSocketDebuggerUrl"]
        except (OSError, ValueError, KeyError):
            pass
        time.sleep(1)
    raise RuntimeError("Debuggable Capacitor WebView was not discovered via ADB DevTools")


def main():
    ws_url = discover()
    print("Connected to actual emulator Android WebView debugger", flush=True)
    ws = create_connection(ws_url, timeout=8, origin="http://localhost")
    counter = 0
    exceptions = []
    def send(method, params=None):
        nonlocal counter
        counter += 1
        my_id = counter
        ws.send(json.dumps({"id": my_id, "method": method, "params": params or {}}))
        deadline = time.time() + 16
        while time.time() < deadline:
            try:
                message = json.loads(ws.recv())
            except TimeoutError:
                continue
            if message.get("method") == "Runtime.exceptionThrown":
                details = message.get("params", {}).get("exceptionDetails", {})
                exception = details.get("exception", {})
                line = f"{details.get('text','')} {exception.get('description','')}".strip()
                exceptions.append(line)
                print("WEBVIEW JS EXCEPTION:", line[:2000], flush=True)
            if message.get("id") == my_id:
                if "error" in message:
                    raise RuntimeError(f"CDP {method}: {message['error']}")
                return message.get("result", {})
        raise TimeoutError(f"CDP method {method} timed out")
    send("Runtime.enable")
    send("Page.enable")
    failures = []
    for book in BOOKS:
        exceptions.clear()
        send("Runtime.evaluate", {"expression": f"window.location.hash = '#/books/{book}'; true", "returnByValue": True})
        time.sleep(4)
        result = send("Runtime.evaluate", {
            "expression": """(() => ({href: location.href, book: document.querySelector('.book-reader-layout') !== null, error: document.body.innerText.includes('لم نتمكن من تحميل هذه الصفحة'), text: document.body.innerText.slice(0, 250), images: Array.from(document.querySelectorAll('.offline-book-stage img')).filter(e => e.naturalWidth > 0).length, canvases: Array.from(document.querySelectorAll('canvas')).length }))()""",
            "returnByValue": True,
        })
        value = result.get("result", {}).get("value", {})
        print(json.dumps({"bookId": book, **value, "exceptions": exceptions}, ensure_ascii=False), flush=True)
        if not value.get("book") or value.get("error") or exceptions:
            failures.append(book)
    ws.close()
    if failures:
        print("FAIL native Android WebView books: " + ", ".join(failures), flush=True)
        return 1
    print("PASS all eight books rendered inside native Android WebView", flush=True)
    return 0

if __name__ == "__main__":
    sys.exit(main())
