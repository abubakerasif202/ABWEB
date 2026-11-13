export interface FaqEntry {
  question: string;
  answer: string;
}

export interface FaqPageJsonLd {
  "@type": "FAQPage";
  mainEntity: Array<{
    "@type": "Question";
    name: string;
    acceptedAnswer: {
      "@type": "Answer";
      text: string;
    };
  }>;
}

/**
 * Builds a Schema.org `FAQPage` graph node from visible page FAQ entries.
 */
export function buildFaqPageSchema(faqs: readonly FaqEntry[]): FaqPageJsonLd {
  return {
    "@type": "FAQPage",
    mainEntity: faqs
      .map(({ question, answer }) => ({
        question: question.trim(),
        answer: answer.trim(),
      }))
      .filter(({ question, answer }) => question.length > 0 && answer.length > 0)
      .map(({ question, answer }) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: {
          "@type": "Answer",
          text: answer,
        },
      })),
  };
}
