"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { AlertCircle, CheckCircle2, LoaderCircle, X } from "lucide-react";
import { ArrowIcon, Glyph } from "../icons";
import { siteConfig } from "../site-config";
import { contactBudgets, contactScopedServices, contactScopeNote, contactServiceKeys, contactServices } from "../contact-options";
import { trackEnquirySuccess } from "../lib/contact-analytics";
import {
  CONTACT_SUCCESS_MESSAGE,
  getContactSubmitPresentation,
  getDefaultSelectedService,
  getFirstInvalidFieldId,
  getFormStatusLabel,
  hasContactErrors,
  resolveRequestedService,
  shouldValidateEmailOnInput,
  validateContactField,
  validateContactForm,
  validateContactServices,
  type ContactFieldErrors,
  type ContactFieldId,
  type ContactFormState,
  type ContactTouchedFields,
  type ContactValidatedFieldId,
} from "../lib/contact-form-state";

interface ContactFormProps {
  /** Heading level for the form title, so it nests under its section heading. */
  titleAs?: "h2" | "h3";
}

const SERVICES_ERROR_ID = "services-error";
const SERVICES_HELP_ID = "services-help";

export function ContactForm({ titleAs: Title = "h3" }: ContactFormProps) {
  const titleId = useId();
  const sendingRef = useRef(false);
  // One identifier per submission attempt, reused when the visitor retries after a
  // failure so the server can deduplicate; replaced only after a confirmed send.
  const submissionIdRef = useRef<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ContactFieldErrors>({});
  const [touched, setTouched] = useState<ContactTouchedFields>({});
  const [formStatus, setFormStatus] = useState("");
  const [formState, setFormState] = useState<ContactFormState>("idle");
  const submitPresentation = getContactSubmitPresentation(formState);
  const statusLabel = getFormStatusLabel(formState);

  const formRef = useRef<HTMLFormElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const initialServiceRef = useRef<string | null>(null);
  const [showScopeNote, setShowScopeNote] = useState(false);

  // Mirrors the checked service boxes into state so the budget helper note can react to them.
  const syncScopeNote = () => {
    const checked = Array.from(formRef.current?.querySelectorAll<HTMLInputElement>('input[name="service"]:checked') ?? []);
    setShowScopeNote(checked.some((input) => contactScopedServices.includes(input.value)));
  };

  const applyServiceSelection = (form: HTMLFormElement, selectedService: string | null) => {
    const targetService = getDefaultSelectedService(contactServices, selectedService);
    form.querySelectorAll<HTMLInputElement>('input[name="service"]').forEach((input) => {
      input.checked = Boolean(targetService && input.value === targetService);
    });
  };

  const resetFormToInitialState = (form: HTMLFormElement) => {
    form.reset();
    applyServiceSelection(form, initialServiceRef.current);
    syncScopeNote();
    submissionIdRef.current = null;
    setFieldErrors({});
    setTouched({});
  };

  // A link such as /contact?service=ecommerce (a short key) or ?service=E-commerce%20solutions (the
  // exact label) starts the form with that service selected. Anything unknown is ignored. The query is
  // read on mount from the browser location rather than through the Next.js search-params hook, so static prerendering needs no Suspense boundary.
  useEffect(() => {
    const match = resolveRequestedService(window.location.search, contactServiceKeys, contactServices);
    initialServiceRef.current = match;
    if (!match || !formRef.current) return;
    applyServiceSelection(formRef.current, match);
    syncScopeNote();
    // Draw the eye to the preselected choice; motion is skipped for visitors who prefer reduced motion.
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    formRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    const chips = formRef.current?.querySelector(".form-services");
    chips?.classList.add("is-preselected");
    const timer = window.setTimeout(() => chips?.classList.remove("is-preselected"), 2400);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (formState !== "success") return;
    const statusEl = statusRef.current;
    if (!statusEl) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    statusEl.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" });
    statusEl.focus({ preventScroll: true });
  }, [formState]);

  const updateFieldError = (fieldId: ContactFieldId, message: string) => {
    setFieldErrors((current) => {
      if ((current[fieldId] ?? "") === message) return current;
      return { ...current, [fieldId]: message };
    });
  };

  const isValidatedFieldId = (id: string): id is ContactValidatedFieldId =>
    id === "full-name" || id === "email" || id === "message";

  const focusField = (fieldId: ContactFieldId) => {
    const selector = fieldId === "services" ? 'input[name="service"]' : `#${fieldId}`;
    formRef.current?.querySelector<HTMLElement>(selector)?.focus();
  };

  const handleFieldBlur = (fieldId: ContactValidatedFieldId, value: string) => {
    setTouched((current) => (current[fieldId] ? current : { ...current, [fieldId]: true }));
    updateFieldError(fieldId, validateContactField(fieldId, value));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (sendingRef.current) return;
    const formData = new FormData(form);
    const services = formData.getAll("service").map(String);
    const validationErrors = validateContactForm({
      fullName: String(formData.get("fullName") ?? ""),
      email: String(formData.get("email") ?? ""),
      services,
      message: String(formData.get("message") ?? ""),
    });
    setTouched({
      "full-name": true,
      email: true,
      services: true,
      message: true,
    });
    setFieldErrors(validationErrors);
    const firstInvalid = getFirstInvalidFieldId(validationErrors);
    if (firstInvalid || hasContactErrors(validationErrors)) {
      if (firstInvalid) focusField(firstInvalid);
      return;
    }

    sendingRef.current = true;
    setFormState("sending");
    setFormStatus("Sending your enquiry…");
    // Checkbox choices travel as one `services` array, not repeated `service` keys.
    const fields = Object.fromEntries([...formData.entries()].filter(([key]) => key !== "service"));
    submissionIdRef.current ??= crypto.randomUUID();
    const payload = { ...fields, services, submissionId: submissionIdRef.current };
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      const result: unknown = await response.json().catch(() => null);
      if (!response.ok || !result || typeof result !== "object" || !("ok" in result) || result.ok !== true) {
        const error = result && typeof result === "object" && "error" in result && typeof result.error === "string"
          ? result.error : `We could not confirm delivery. Please email ${siteConfig.email} before resending.`;
        throw new Error(error);
      }
      resetFormToInitialState(form);
      if (!fields.company) trackEnquirySuccess();
      setFormState("success");
      setFormStatus(CONTACT_SUCCESS_MESSAGE);
    } catch (error) {
      setFormState("error");
      setFormStatus(controller.signal.aborted
        ? `We could not confirm delivery. Please email ${siteConfig.email} before resending.`
        : error instanceof Error ? error.message : `Please email ${siteConfig.email}.`);
    } finally {
      clearTimeout(timeout);
      sendingRef.current = false;
    }
  };

  const describedBy = (id: ContactFieldId, help?: string) =>
    [help, fieldErrors[id] ? `${id}-error` : undefined].filter(Boolean).join(" ") || undefined;

  return (
    <form ref={formRef} className="contact-form enquiry-form" data-state={formState} method="post" action="/api/contact" noValidate onSubmit={handleSubmit}
      aria-labelledby={titleId}
      onBlurCapture={(event) => {
        const field = event.target;
        if ((field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) && isValidatedFieldId(field.id)) {
          handleFieldBlur(field.id, field.value);
        }
      }}
      onInput={(event) => {
        if (formState === "success") {
          setFormState("idle");
          setFormStatus("");
        }
        const field = event.target;
        if (field instanceof HTMLInputElement && field.name === "service") {
          syncScopeNote();
          setTouched((current) => (current.services ? current : { ...current, services: true }));
          const checkedServices = Array.from(
            formRef.current?.querySelectorAll<HTMLInputElement>('input[name="service"]:checked') ?? [],
          ).map((input) => input.value);
          updateFieldError("services", validateContactServices(checkedServices));
        } else if (
          (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)
          && isValidatedFieldId(field.id)
        ) {
          const fieldId = field.id;
          const nextError = validateContactField(fieldId, field.value);
          const validateEarlyEmail = fieldId === "email" && shouldValidateEmailOnInput(field.value);
          if (touched[fieldId] || fieldErrors[fieldId] || validateEarlyEmail) {
            if (validateEarlyEmail && !touched.email) {
              setTouched((current) => ({ ...current, email: true }));
            }
            updateFieldError(fieldId, nextError);
          }
        }
      }} aria-busy={submitPresentation.isSending}>
      <noscript>
        <style>{`.contact-form .enquiry-form-body, .contact-form .form-grid, .contact-form .form-chips, .contact-form .form-field, .contact-form .form-actions, .contact-form .form-note, .contact-form .form-status, .contact-form .enquiry-form-required { display: none !important; }`}</style>
        <p>
          To discuss your project, email <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a> or call{" "}
          <a href={`tel:${siteConfig.phoneInternational}`}>{siteConfig.phoneDisplay}</a>.
        </p>
      </noscript>
      {/* Honeypot: hidden from people and assistive tech. Never reuse its name for a real field. */}
      <div className="form-trap" aria-hidden="true" style={{ display: "none" }}>
        <label htmlFor="company">Company website</label>
        <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="enquiry-form-head">
        <Title id={titleId} className="enquiry-form-title">Project enquiry</Title>
        <p className="enquiry-form-required"><span aria-hidden="true">*</span> Required</p>
      </div>

      <fieldset className="enquiry-form-body" disabled={submitPresentation.isSending}>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="full-name">Name <span className="form-req" aria-hidden="true">*</span></label>
            <input id="full-name" name="fullName" type="text" autoComplete="name" maxLength={160} required aria-required="true"
              placeholder="Your name" aria-invalid={Boolean(fieldErrors["full-name"])} aria-describedby={describedBy("full-name")} />
            {fieldErrors["full-name"] && (
              <span className="field-error" id="full-name-error" role="alert">
                <Glyph icon={AlertCircle} size={14} className="field-error-icon" />
                <span>{fieldErrors["full-name"]}</span>
              </span>
            )}
          </div>
          <div className="form-field">
            <label htmlFor="email">Email <span className="form-req" aria-hidden="true">*</span></label>
            <input id="email" name="email" type="email" autoComplete="email" maxLength={254} required aria-required="true"
              placeholder="you@business.com.au" aria-invalid={Boolean(fieldErrors.email)} aria-describedby={describedBy("email")} />
            {fieldErrors.email && (
              <span className="field-error" id="email-error" role="alert">
                <Glyph icon={AlertCircle} size={14} className="field-error-icon" />
                <span>{fieldErrors.email}</span>
              </span>
            )}
          </div>
          <div className="form-field">
            <label htmlFor="phone">Phone <span className="form-optional">(optional)</span></label>
            <input id="phone" name="phone" type="tel" autoComplete="tel" maxLength={50} placeholder="04xx xxx xxx" />
          </div>
          <div className="form-field">
            <label htmlFor="business">Business <span className="form-optional">(optional)</span></label>
            <input id="business" name="business" type="text" autoComplete="organization" maxLength={160} placeholder="Business or website" />
          </div>
        </div>

        <fieldset className="form-chips form-services" aria-describedby={fieldErrors.services ? `${SERVICES_HELP_ID} ${SERVICES_ERROR_ID}` : SERVICES_HELP_ID}>
          <legend>What do you need? <span className="form-req" aria-hidden="true">*</span><span className="sr-only"> (required)</span></legend>
          <span className="sr-only" id={SERVICES_HELP_ID}>Choose at least one service. You can select more than one.</span>
          <div className="form-chip-row">
            {contactServices.map((service, index) => (
              <label className="form-chip" key={service}>
                <input type="checkbox" name="service" value={service} defaultChecked={index === 0} />
                <span>{service}</span>
              </label>
            ))}
          </div>
          {fieldErrors.services && (
            <span className="field-error" id={SERVICES_ERROR_ID} role="alert">
              <Glyph icon={AlertCircle} size={14} className="field-error-icon" />
              <span>{fieldErrors.services}</span>
            </span>
          )}
        </fieldset>

        <fieldset className="form-chips form-budget">
          <legend>Budget <span className="form-optional">(optional)</span></legend>
          <div className="form-chip-row">
            {contactBudgets.map((budget) => (
              <label className="form-chip form-chip--mono" key={budget}>
                <input type="radio" name="budget" value={budget} />
                <span>{budget}</span>
              </label>
            ))}
          </div>
          {showScopeNote && <p className="form-help form-scope-note" role="note">{contactScopeNote}</p>}
        </fieldset>

        <div className="form-field">
          <label htmlFor="message">Tell us about your project <span className="form-req" aria-hidden="true">*</span></label>
          <textarea id="message" name="message" rows={5} maxLength={4000} required aria-required="true"
            placeholder="What you are building, who it is for and what success looks like."
            aria-invalid={Boolean(fieldErrors.message)} aria-describedby={describedBy("message", "message-help")} />
          <p className="form-help" id="message-help">A few sentences is plenty. We reply with a practical next step.</p>
          {fieldErrors.message && (
            <span className="field-error" id="message-error" role="alert">
              <Glyph icon={AlertCircle} size={14} className="field-error-icon" />
              <span>{fieldErrors.message}</span>
            </span>
          )}
        </div>

        <div className="form-actions">
          <button
            className="button button-primary enquiry-submit-btn"
            type="submit"
            disabled={submitPresentation.disabled}
            aria-disabled={submitPresentation.disabled}
            data-loading={submitPresentation.isSending ? "true" : undefined}
          >
            {submitPresentation.label}
            {submitPresentation.showSpinner
              ? <Glyph icon={LoaderCircle} className="enquiry-submit-spinner" />
              : <ArrowIcon direction="right" />}
          </button>
          <a className="form-call" href={`tel:${siteConfig.phoneInternational}`}>Or call {siteConfig.phoneDisplay}</a>
        </div>
      </fieldset>
      <p className="form-note">Your details are used only to respond to this enquiry. No mailing lists. No spam.</p>
      <div
        ref={statusRef}
        className={`form-status ${formState}`}
        role="status"
        aria-live="polite"
        tabIndex={formState === "success" ? -1 : undefined}
      >
        {(statusLabel || formStatus) ? (
          <>
            <span className="form-status-icon-wrap" aria-hidden="true">
              {formState === "success" ? (
                <Glyph icon={CheckCircle2} size={20} className="form-status-icon" />
              ) : formState === "error" ? (
                <Glyph icon={AlertCircle} size={18} className="form-status-icon" />
              ) : (
                <Glyph icon={LoaderCircle} size={18} className="form-status-icon enquiry-submit-spinner" />
              )}
            </span>
            <div className="form-status-copy">
              {statusLabel && <strong className="form-status-label">{statusLabel}</strong>}
              {formStatus && <p className="form-status-message">{formStatus}</p>}
            </div>
            {formState === "success" && (
              <button
                type="button"
                className="form-status-dismiss"
                aria-label="Dismiss confirmation message"
                onClick={() => {
                  setFormState("idle");
                  setFormStatus("");
                  formRef.current?.querySelector<HTMLElement>("#full-name")?.focus();
                }}
              >
                <Glyph icon={X} size={16} />
              </button>
            )}
          </>
        ) : null}
      </div>
    </form>
  );
}
