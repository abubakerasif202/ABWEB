export type ContactFormState = "idle" | "sending" | "success" | "error";

export interface SubmitButtonPresentation {
  isSending: boolean;
  disabled: boolean;
  label: string;
  showSpinner: boolean;
}

/**
 * Computes the submit button state and copy for the contact enquiry form
 * across idle, in-flight submission, success, and recoverable error states.
 */
export function getContactSubmitPresentation(formState: ContactFormState): SubmitButtonPresentation {
  const isSending = formState === "sending";
  return {
    isSending,
    disabled: isSending,
    label: isSending ? "Sending enquiry…" : "Send project enquiry",
    showSpinner: isSending,
  };
}

export const CONTACT_SUCCESS_MESSAGE =
  "Thanks — your enquiry has been sent. We’ll come back with a practical next step shortly.";

/**
 * Returns the prominent heading label rendered inside the live status region
 * for non-idle form states, or null when idle.
 */
export function getFormStatusLabel(formState: ContactFormState): string | null {
  switch (formState) {
    case "sending":
      return "Submitting enquiry";
    case "success":
      return "Enquiry received";
    case "error":
      return "Please check your enquiry";
    case "idle":
      return null;
  }
}

/**
 * Resolves a `?service=` query parameter (either a short key or exact label)
 * to a canonical service label, or returns null when absent or unknown.
 */
export function resolveRequestedService(
  search: string,
  serviceKeys: Readonly<Record<string, string>>,
  services: readonly string[],
): string | null {
  const requested = new URLSearchParams(search).get("service")?.trim() ?? "";
  if (!requested) return null;
  if (Object.hasOwn(serviceKeys, requested)) {
    return serviceKeys[requested] ?? null;
  }
  return services.find((service) => service === requested) ?? null;
}

/**
 * Returns the service option that should be selected on initial load and
 * restored after a successful submission resets the form.
 */
export function getDefaultSelectedService(
  services: readonly string[],
  requestedService?: string | null,
): string | null {
  if (requestedService && services.includes(requestedService)) {
    return requestedService;
  }
  return services[0] ?? null;
}

export type ContactValidatedFieldId = "full-name" | "email" | "message";
export type ContactFieldId = ContactValidatedFieldId | "services";
export type ContactFieldErrors = Partial<Record<ContactFieldId, string>>;
export type ContactTouchedFields = Partial<Record<ContactFieldId, boolean>>;

export interface ContactValidationInput {
  fullName: string;
  email: string;
  services: readonly string[];
  message: string;
}

export const CONTACT_MAX_LENGTHS = {
  fullName: 160,
  email: 254,
  message: 4000,
} as const;

// Mirrors backend /api/contact email validation while also rejecting consecutive domain dots
// and requiring a multi-character TLD segment so common typos are caught client-side.
const CONTACT_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidContactEmail(rawValue: string): boolean {
  const trimmed = rawValue.trim();
  if (!trimmed || trimmed.length > CONTACT_MAX_LENGTHS.email) return false;
  if (trimmed.includes("..")) return false;
  return CONTACT_EMAIL_PATTERN.test(trimmed);
}

/**
 * Flags clearly malformed email input mid-typing (internal whitespace or
 * multiple `@` signs) before blur without interrupting normal typing.
 */
export function shouldValidateEmailOnInput(rawValue: string): boolean {
  const trimmed = rawValue.trim();
  if (!trimmed) return false;
  if (/\s/.test(trimmed)) return true;
  return (trimmed.match(/@/g) ?? []).length > 1;
}

export function validateContactField(
  fieldId: ContactValidatedFieldId,
  rawValue: string,
): string {
  const trimmed = rawValue.trim();

  switch (fieldId) {
    case "full-name":
      if (!trimmed) return "Please enter your name.";
      if (trimmed.length > CONTACT_MAX_LENGTHS.fullName) {
        return "Name must be 160 characters or fewer.";
      }
      return "";
    case "email":
      if (!trimmed) return "Please enter your email address.";
      if (trimmed.length > CONTACT_MAX_LENGTHS.email) {
        return "Email address must be 254 characters or fewer.";
      }
      if (!isValidContactEmail(trimmed)) {
        return "Enter a valid email address (for example, you@business.com.au).";
      }
      return "";
    case "message":
      if (!trimmed) return "Please tell us a little about your project.";
      if (trimmed.length > CONTACT_MAX_LENGTHS.message) {
        return "Project details must be 4,000 characters or fewer.";
      }
      return "";
  }
}

export function validateContactServices(services: readonly string[]): string {
  return services.length === 0 ? "Choose at least one service." : "";
}

export function validateContactForm(input: ContactValidationInput): ContactFieldErrors {
  const errors: ContactFieldErrors = {};

  const nameError = validateContactField("full-name", input.fullName);
  if (nameError) errors["full-name"] = nameError;

  const emailError = validateContactField("email", input.email);
  if (emailError) errors.email = emailError;

  const servicesError = validateContactServices(input.services);
  if (servicesError) errors.services = servicesError;

  const messageError = validateContactField("message", input.message);
  if (messageError) errors.message = messageError;

  return errors;
}

export function hasContactErrors(errors: ContactFieldErrors): boolean {
  return Object.values(errors).some((message) => Boolean(message));
}

export function getFirstInvalidFieldId(errors: ContactFieldErrors): ContactFieldId | null {
  const order: readonly ContactFieldId[] = ["full-name", "email", "services", "message"];
  return order.find((id) => Boolean(errors[id])) ?? null;
}
