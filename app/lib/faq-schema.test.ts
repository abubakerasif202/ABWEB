import test from "node:test";
import assert from "node:assert/strict";
import { buildFaqPageSchema } from "./faq-schema";
import { servicePages, servicesIndexFaqs } from "../services/service-data";

test("buildFaqPageSchema produces valid Schema.org FAQPage mainEntity items", () => {
  const result = buildFaqPageSchema([
    { question: "  How much does a website cost? ", answer: " Fixed-price proposals start from $2,000.  " },
    { question: "", answer: "Ignored empty question" },
    { question: "Ignored empty answer", answer: "   " },
  ]);

  assert.equal(result["@type"], "FAQPage");
  assert.equal(result.mainEntity.length, 1);
  assert.deepEqual(result.mainEntity[0], {
    "@type": "Question",
    name: "How much does a website cost?",
    acceptedAnswer: {
      "@type": "Answer",
      text: "Fixed-price proposals start from $2,000.",
    },
  });
});

test("servicesIndexFaqs generates complete FAQPage structured data", () => {
  const schema = buildFaqPageSchema(servicesIndexFaqs);
  assert.equal(schema["@type"], "FAQPage");
  assert.ok(schema.mainEntity.length >= 4);
  for (const item of schema.mainEntity) {
    assert.equal(item["@type"], "Question");
    assert.ok(item.name.endsWith("?"));
    assert.equal(item.acceptedAnswer["@type"], "Answer");
    assert.ok(item.acceptedAnswer.text.length > 20);
  }
});

test("every service page FAQ list maps cleanly to FAQPage structured data", () => {
  for (const service of servicePages) {
    const schema = buildFaqPageSchema(service.faqs);
    assert.equal(schema.mainEntity.length, service.faqs.length);
  }
});
