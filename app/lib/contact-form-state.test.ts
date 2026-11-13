import test from "node:test";
import assert from "node:assert/strict";
import {
  CONTACT_SUCCESS_MESSAGE,
  getContactSubmitPresentation,
  getDefaultSelectedService,
  getFirstInvalidFieldId,
  getFormStatusLabel,
  hasContactErrors,
  isValidContactEmail,
  resolveRequestedService,
  shouldValidateEmailOnInput,
  validateContactField,
  validateContactForm,
  validateContactServices,
} from "./contact-form-state";
import { contactServiceKeys, contactServices } from "../contact-options";

test("getContactSubmitPresentation disables submit button and shows spinner only while sending", () => {
  assert.deepEqual(getContactSubmitPresentation("sending"), {
    isSending: true,
    disabled: true,
    label: "Sending enquiry…",
    showSpinner: true,
  });

  for (const state of ["idle", "success", "error"] as const) {
    assert.deepEqual(getContactSubmitPresentation(state), {
      isSending: false,
      disabled: false,
      label: "Send project enquiry",
      showSpinner: false,
    });
  }
});

test("getFormStatusLabel provides structured headings for sending, success, and error states", () => {
  assert.equal(getFormStatusLabel("idle"), null);
  assert.equal(getFormStatusLabel("sending"), "Submitting enquiry");
  assert.equal(getFormStatusLabel("success"), "Enquiry received");
  assert.equal(getFormStatusLabel("error"), "Please check your enquiry");
});

test("validateContactField flags empty and whitespace-only required inputs", () => {
  assert.equal(validateContactField("full-name", ""), "Please enter your name.");
  assert.equal(validateContactField("full-name", "   \t "), "Please enter your name.");
  assert.equal(validateContactField("full-name", "Alex Morgan"), "");

  assert.equal(validateContactField("email", ""), "Please enter your email address.");
  assert.equal(validateContactField("email", "   "), "Please enter your email address.");

  assert.equal(
    validateContactField("message", "  \n "),
    "Please tell us a little about your project.",
  );
  assert.equal(validateContactField("message", "We need a new website."), "");
});

test("email validation catches malformed email addresses and accepts valid ones", () => {
  const invalidEmails = [
    "alex",
    "alex@",
    "alex@domain",
    "alex@domain.",
    "alex@domain.a",
    "alex@domain..com",
    "alex @domain.com",
    "alex@@domain.com",
  ];
  for (const bad of invalidEmails) {
    assert.equal(isValidContactEmail(bad), false, `expected "${bad}" to be invalid`);
    assert.match(validateContactField("email", bad), /valid email address/i);
  }

  const validEmails = [
    "alex@example.com",
    "alex.morgan+web@abwebstudio.com.au",
    "  team@company.io ",
  ];
  for (const good of validEmails) {
    assert.equal(isValidContactEmail(good), true, `expected "${good}" to be valid`);
    assert.equal(validateContactField("email", good), "");
  }
});

test("shouldValidateEmailOnInput flags broken whitespace or multiple @ mid-typing without penalizing normal prefixes", () => {
  assert.equal(shouldValidateEmailOnInput(""), false);
  assert.equal(shouldValidateEmailOnInput("alex@domain"), false);
  assert.equal(shouldValidateEmailOnInput("alex @domain"), true);
  assert.equal(shouldValidateEmailOnInput("alex@@domain.com"), true);
});

test("validateContactForm validates all fields and returns first invalid field in DOM order", () => {
  assert.equal(validateContactServices([]), "Choose at least one service.");
  assert.equal(validateContactServices(["E-commerce solutions"]), "");

  const allBad = validateContactForm({
    fullName: "   ",
    email: "not-an-email",
    services: [],
    message: "",
  });
  assert.equal(hasContactErrors(allBad), true);
  assert.equal(getFirstInvalidFieldId(allBad), "full-name");
  assert.ok(allBad["full-name"]);
  assert.ok(allBad.email);
  assert.ok(allBad.services);
  assert.ok(allBad.message);

  const onlyMessageBad = validateContactForm({
    fullName: "Alex",
    email: "alex@example.com",
    services: ["Website design & development"],
    message: " ",
  });
  assert.equal(hasContactErrors(onlyMessageBad), true);
  assert.equal(getFirstInvalidFieldId(onlyMessageBad), "message");

  const valid = validateContactForm({
    fullName: "Alex",
    email: "alex@example.com",
    services: ["Website design & development"],
    message: "Need a new website.",
  });
  assert.equal(hasContactErrors(valid), false);
  assert.equal(getFirstInvalidFieldId(valid), null);
});

test("resolveRequestedService resolves short keys, exact labels, and ignores unknown queries", () => {
  assert.equal(
    resolveRequestedService("?service=ecommerce", contactServiceKeys, contactServices),
    "E-commerce solutions",
  );
  assert.equal(
    resolveRequestedService("?service=E-commerce%20solutions", contactServiceKeys, contactServices),
    "E-commerce solutions",
  );
  assert.equal(
    resolveRequestedService("?service=unknown-option", contactServiceKeys, contactServices),
    null,
  );
  assert.equal(resolveRequestedService("", contactServiceKeys, contactServices), null);
});

test("getDefaultSelectedService preserves valid query selection on reset and falls back to first option", () => {
  assert.equal(
    getDefaultSelectedService(contactServices, null),
    "Website design & development",
  );
  assert.equal(
    getDefaultSelectedService(contactServices, "E-commerce solutions"),
    "E-commerce solutions",
  );
  assert.equal(
    getDefaultSelectedService(contactServices, "Non-existent service"),
    "Website design & development",
  );
  assert.ok(CONTACT_SUCCESS_MESSAGE.length > 0);
});
