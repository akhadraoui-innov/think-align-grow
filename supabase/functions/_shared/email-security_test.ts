// Unit tests for the HTML sanitizer used in transactional emails.
// Pure function — no network, no env required.
import {
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { sanitizeEmailHtml } from "./email-security.ts";

Deno.test("strips <script> tags entirely", () => {
  const out = sanitizeEmailHtml(`<p>Hi</p><script>alert(1)</script>`);
  assertEquals(out.includes("<script>"), false);
  assertEquals(out.includes("alert(1)"), true); // text retained, tag stripped
  assertStringIncludes(out, "<p>Hi</p>");
});

Deno.test("removes inline event handlers (onclick, onerror)", () => {
  const out = sanitizeEmailHtml(`<a href="x" onclick="alert(1)">x</a>`);
  assertEquals(out.includes("onclick"), false);
  assertStringIncludes(out, 'href="x"');
});

Deno.test("blocks javascript: URI scheme", () => {
  const out = sanitizeEmailHtml(`<a href="javascript:evil()">x</a>`);
  assertEquals(out.includes("javascript:"), false);
  assertStringIncludes(out, "blocked:");
});

Deno.test("blocks non-image data: URIs", () => {
  const out = sanitizeEmailHtml(`<a href="data:text/html,<x>">x</a>`);
  assertEquals(/data:text\/html/.test(out), false);
});

Deno.test("preserves safe image data: URIs", () => {
  const safe = `<img src="data:image/png;base64,iVBORw0K">`;
  const out = sanitizeEmailHtml(safe);
  assertStringIncludes(out, "data:image/png");
});

Deno.test("strips non-allowlisted tags but keeps text", () => {
  const out = sanitizeEmailHtml(`<marquee>scroll</marquee><p>ok</p>`);
  assertEquals(out.includes("<marquee>"), false);
  assertStringIncludes(out, "scroll");
  assertStringIncludes(out, "<p>ok</p>");
});

Deno.test("strips iframe, object, embed, form, meta, link", () => {
  const dangerous = `
    <iframe src="x"></iframe>
    <object data="x"></object>
    <embed src="x">
    <form action="x"></form>
    <meta http-equiv="refresh" content="0">
    <link rel="stylesheet" href="x">
  `;
  const out = sanitizeEmailHtml(dangerous);
  for (const tag of ["iframe", "object", "embed", "form", "meta", "link"]) {
    assertEquals(out.includes(`<${tag}`), false, `${tag} should be stripped`);
  }
});

Deno.test("returns empty string for null/empty input", () => {
  assertEquals(sanitizeEmailHtml(""), "");
  // @ts-expect-error testing runtime guard
  assertEquals(sanitizeEmailHtml(null), "");
});

Deno.test("preserves complex tables with allowed attrs", () => {
  const html =
    `<table cellpadding="4"><thead><tr><th align="left">A</th></tr></thead><tbody><tr><td colspan="2">v</td></tr></tbody></table>`;
  const out = sanitizeEmailHtml(html);
  assertStringIncludes(out, "<table");
  assertStringIncludes(out, "<thead>");
  assertStringIncludes(out, "<tbody>");
  assertStringIncludes(out, "colspan=");
});
