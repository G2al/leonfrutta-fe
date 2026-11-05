"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { submitOrder } from "@/lib/api/orders";
import type { FieldErrors, Order, OrderField, OrderPayload } from "@/lib/api/types";
import { addSavedOrder } from "@/lib/my-orders";
import { clearContact, loadContact, saveContact } from "@/lib/saved-contact";
import { useOnlineStatus } from "@/lib/use-online-status";
import { FIELD_LIMITS, charCount, trimPayload, validateField, validateOrder } from "@/lib/validation";
import { Confirmation } from "./Confirmation";
import { TextAreaField, TextField } from "./FormField";
import { Notice } from "./Notice";
import { SubmitButton, type SubmitPhase } from "./SubmitButton";

const FIELD_ORDER: OrderField[] = ["first_name", "last_name", "business_name", "phone", "message"];

const EMPTY_VALUES: OrderPayload = {
  first_name: "",
  last_name: "",
  business_name: "",
  phone: "",
  message: "",
};

const OFFLINE_MESSAGE =
  "Sei offline. Controlla la connessione: i dati inseriti restano nel modulo.";

/** Tempo in cui il pulsante mostra "Inviata!" prima della schermata di conferma. */
const SUCCESS_ANIMATION_MS = 700;

const fieldId =(field: OrderField) => `order-${field}`;

function focusFirstError(errors: FieldErrors) {
  const first = FIELD_ORDER.find((field) => errors[field]);
  if (first) document.getElementById(fieldId(first))?.focus();
}

type Banner = { tone: "error" | "warning"; message: string; offline?: boolean } | null;

/** `intro` viene mostrato sopra il modulo e nascosto nella schermata di conferma. */
export function OrderForm({ intro }: { intro?: ReactNode }) {
  const [values, setValues] = useState<OrderPayload>(EMPTY_VALUES);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [banner, setBanner] = useState<Banner>(null);
  const [phase, setPhase] = useState<SubmitPhase>("idle");
  const [remember, setRemember] = useState(true);
  const [hasSavedContact, setHasSavedContact] = useState(false);
  const [retryUntil, setRetryUntil] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [confirmed, setConfirmed] = useState<{ order: Order; phone: string; saved: boolean } | null>(null);
  const online = useOnlineStatus();

  // Precompila i dati anagrafici salvati (solo lato client, dopo il montaggio).
  useEffect(() => {
    const saved = loadContact();
    if (saved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValues((current) => ({ ...current, ...saved }));
      setHasSavedContact(true);
    }
  }, []);

  // Conto alla rovescia dopo un 429.
  useEffect(() => {
    if (retryUntil === null) return;
    const tick = () => {
      const left = Math.ceil((retryUntil - Date.now()) / 1000);
      if (left <= 0) {
        setRetryUntil(null);
        setSecondsLeft(0);
      } else {
        setSecondsLeft(left);
      }
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [retryUntil]);

  function updateField(field: OrderField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    // Se il campo era in errore, ricontrolla mentre l'utente corregge.
    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: validateField(field, value) }));
    }
  }

  function handleBlur(field: OrderField) {
    // Valida all'uscita solo se il campo è stato compilato, per non
    // segnalare errori mentre l'utente scorre il modulo.
    if (values[field].trim() !== "") {
      setErrors((current) => ({ ...current, [field]: validateField(field, values[field]) }));
    }
  }

  function handleForgetContact() {
    clearContact();
    setHasSavedContact(false);
    setRemember(false);
    setValues((current) => ({ ...EMPTY_VALUES, message: current.message }));
    setErrors({});
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (phase !== "idle" || retryUntil !== null) return;

    const clientErrors = validateOrder(values);
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      setBanner({ tone: "error", message: "Controlla i campi evidenziati." });
      focusFirstError(clientErrors);
      return;
    }

    if (!navigator.onLine) {
      setBanner({ tone: "warning", message: OFFLINE_MESSAGE, offline: true });
      return;
    }

    const payload = trimPayload(values);
    setErrors({});
    setBanner(null);
    setPhase("sending");
    const result = await submitOrder(payload);

    if (result.kind !== "success") setPhase("idle");

    switch (result.kind) {
      case "success": {
        // La barra arriva al 100% e mostra la spunta prima della conferma.
        setPhase("done");
        await new Promise((resolve) => setTimeout(resolve, SUCCESS_ANIMATION_MS));
        setPhase("idle");
        if (remember) {
          saveContact(payload);
          setHasSavedContact(true);
        } else {
          clearContact();
          setHasSavedContact(false);
        }
        // Il codice segreto finisce in "Le mie richieste" (mai testo o telefono).
        const saved = addSavedOrder(result.order);
        setConfirmed({ order: result.order, phone: payload.phone, saved });
        window.scrollTo({ top: 0 });
        return;
      }
      case "validation":
        setErrors(result.errors);
        setBanner({ tone: "error", message: result.message });
        focusFirstError(result.errors);
        return;
      case "rate_limited":
        setBanner({ tone: "warning", message: result.message });
        setRetryUntil(Date.now() + (result.retryAfter ?? 60) * 1000);
        return;
      case "network":
        setBanner({ tone: "error", message: result.message, offline: true });
        return;
      case "error":
        setBanner({ tone: "error", message: result.message });
        return;
    }
  }

  function handleNewOrder() {
    setValues(remember ? { ...values, message: "" } : EMPTY_VALUES);
    setErrors({});
    setBanner(null);
    setConfirmed(null);
    window.scrollTo({ top: 0 });
  }

  if (confirmed) {
    return <Confirmation {...confirmed} onNewOrder={handleNewOrder} />;
  }

  const messageLength = charCount(values.message.trim());
  const messageMax = FIELD_LIMITS.message.max;
  const rateLimited = retryUntil !== null;

  const inputProps = (field: OrderField) => ({
    id: fieldId(field),
    name: field,
    value: values[field],
    error: errors[field],
    required: true,
    onChange: (event: { target: { value: string } }) => updateField(field, event.target.value),
    onBlur: () => handleBlur(field),
  });

  return (
    <>
    {intro}
    <form noValidate onSubmit={handleSubmit} aria-busy={phase === "sending"} className="space-y-6">
      {!online && (
        <Notice tone="warning" icon="offline">
          {OFFLINE_MESSAGE}
        </Notice>
      )}

      <fieldset className="space-y-4 rounded-2xl border border-border bg-surface p-5 shadow-ds-sm">
        <legend className="sr-only">I tuoi dati</legend>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">I tuoi dati</h2>
          {hasSavedContact && (
            <button
              type="button"
              onClick={handleForgetContact}
              className="-mr-2 rounded-lg px-2 py-1 text-sm text-muted underline-offset-2 hover:bg-subtle hover:underline"
            >
              Cancella dati salvati
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2">
          <TextField {...inputProps("first_name")} label="Nome" autoComplete="given-name" autoCapitalize="words" />
          <TextField {...inputProps("last_name")} label="Cognome" autoComplete="family-name" autoCapitalize="words" />
        </div>
        <TextField
          {...inputProps("business_name")}
          label="Nome dell'attività"
          autoComplete="organization"
          autoCapitalize="words"
          placeholder="Es. Pizzeria Da Mario"
        />
        <TextField
          {...inputProps("phone")}
          label="Telefono"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="Es. 333 123 4567"
          helper={errors.phone ? undefined : "Ti contatteremo su WhatsApp a questo numero."}
        />

        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-muted">
          <input
            type="checkbox"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
            className="size-[18px] shrink-0 cursor-pointer rounded accent-primary"
          />
          Ricorda i miei dati su questo dispositivo
        </label>
      </fieldset>

      <fieldset className="rounded-2xl border border-border bg-surface p-5 shadow-ds-sm">
        <legend className="sr-only">La tua richiesta</legend>
        <TextAreaField
          {...inputProps("message")}
          label="La tua richiesta"
          rows={7}
          autoCapitalize="sentences"
          placeholder="Es. 10 kg di pomodori, 5 kg di patate, 3 cassette di insalata…"
          helper={errors.message ? undefined : "Scrivi prodotti e quantità come faresti su WhatsApp."}
          aside={
            <span
              className={`shrink-0 font-mono text-xs tabular-nums ${
                messageLength > messageMax ? "text-error-text" : "text-secondary"
              }`}
              aria-label={`${messageLength} caratteri su ${messageMax}`}
            >
              {messageLength}/{messageMax}
            </span>
          }
        />
      </fieldset>

      {banner && (
        <Notice tone={banner.tone} icon={banner.offline ? "offline" : "alert"}>
          <p>{banner.message}</p>
          {rateLimited && secondsLeft > 0 && (
            <p className="mt-1 font-medium">Puoi riprovare tra {secondsLeft} secondi.</p>
          )}
        </Notice>
      )}

      <div className="space-y-3">
        <SubmitButton
          phase={phase}
          blockedLabel={rateLimited ? `Riprova tra ${secondsLeft} s` : undefined}
        />
        <p className="text-center text-xs leading-relaxed text-muted">
          La richiesta non è ancora un ordine confermato: LeonFrutta verificherà
          disponibilità e prezzi e ti risponderà su WhatsApp.
        </p>
      </div>
    </form>
    </>
  );
}
