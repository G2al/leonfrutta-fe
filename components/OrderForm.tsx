"use client";

import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type FormEvent,
  type ReactNode,
  type SVGProps,
} from "react";
import { submitOrder } from "@/lib/api/orders";
import type { FieldErrors, Order, OrderField, OrderPayload } from "@/lib/api/types";
import { addSavedOrder } from "@/lib/my-orders";
import { appendProduct } from "@/lib/products";
import { clearContact, loadContact, saveContact } from "@/lib/saved-contact";
import { useOnlineStatus } from "@/lib/use-online-status";
import { FIELD_LIMITS, charCount, trimPayload, validateField, validateOrder } from "@/lib/validation";
import { Confirmation } from "./Confirmation";
import { TextAreaField, TextField } from "./FormField";
import { BasketIcon, PhoneIcon, StoreIcon, UserIcon } from "./icons";
import { Notice } from "./Notice";
import { QuickProducts } from "./QuickProducts";
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

const fieldId = (field: OrderField) => `order-${field}`;

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
  const messageRef = useRef<HTMLTextAreaElement>(null);

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

  /** Aggiunge un prodotto suggerito al testo e porta il cursore dopo i due punti. */
  function handleAddProduct(name: string) {
    const next = appendProduct(values.message, name);
    if (charCount(next.trim()) <= FIELD_LIMITS.message.max) updateField("message", next);
    requestAnimationFrame(() => {
      const textarea = messageRef.current;
      if (!textarea) return;
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
      textarea.scrollTop = textarea.scrollHeight;
    });
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
      <form noValidate onSubmit={handleSubmit} aria-busy={phase === "sending"} className="space-y-5">
        {!online && (
          <Notice tone="warning" icon="offline">
            {OFFLINE_MESSAGE}
          </Notice>
        )}

        <fieldset className="animate-rise min-w-0 space-y-4 rounded-3xl border border-border bg-surface p-5 shadow-ds-md [animation-delay:140ms]">
          <legend className="sr-only">I tuoi dati</legend>
          <StepHeader step={1} title="I tuoi dati" icon={UserIcon}>
            {hasSavedContact && (
              <button
                type="button"
                onClick={handleForgetContact}
                className="-mr-2 rounded-lg px-2 py-1 text-xs font-medium text-muted underline-offset-2 hover:bg-subtle hover:underline"
              >
                Cancella dati salvati
              </button>
            )}
          </StepHeader>

          <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2">
            <TextField
              {...inputProps("first_name")}
              label="Nome"
              icon={UserIcon}
              autoComplete="given-name"
              autoCapitalize="words"
            />
            <TextField
              {...inputProps("last_name")}
              label="Cognome"
              icon={UserIcon}
              autoComplete="family-name"
              autoCapitalize="words"
            />
          </div>
          <TextField
            {...inputProps("business_name")}
            label="Nome dell'attività"
            icon={StoreIcon}
            autoComplete="organization"
            autoCapitalize="words"
            placeholder="Es. Pizzeria Da Mario"
          />
          <TextField
            {...inputProps("phone")}
            label="Telefono"
            icon={PhoneIcon}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="Es. 333 123 4567"
            helper={errors.phone ? undefined : "Ti contatteremo su WhatsApp a questo numero."}
          />

          <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl bg-subtle/70 px-3 text-sm text-muted">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              className="size-[18px] shrink-0 cursor-pointer rounded accent-accent"
            />
            Ricorda i miei dati su questo dispositivo
          </label>
        </fieldset>

        <fieldset className="animate-rise min-w-0 space-y-4 rounded-3xl border border-border bg-surface p-5 shadow-ds-md [animation-delay:220ms]">
          <legend className="sr-only">La tua richiesta</legend>
          <StepHeader step={2} title="Cosa ti serve" icon={BasketIcon} />

          <QuickProducts message={values.message} onAdd={handleAddProduct} />

          <TextAreaField
            {...inputProps("message")}
            ref={messageRef}
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

        <div className="animate-rise space-y-3 pt-1 [animation-delay:300ms]">
          <SubmitButton
            phase={phase}
            blockedLabel={rateLimited ? `Riprova tra ${secondsLeft} s` : undefined}
          />
          <p className="px-2 text-center text-xs leading-relaxed text-muted">
            La richiesta non è ancora un ordine confermato: LeonFrutta verificherà
            disponibilità e prezzi e ti risponderà su WhatsApp.
          </p>
        </div>
      </form>
    </>
  );
}

/** Titolo di una sezione del modulo, con numero del passo e icona. */
function StepHeader({
  step,
  title,
  icon: Icon,
  children,
}: {
  step: number;
  title: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  children?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="relative flex size-10 items-center justify-center rounded-2xl bg-accent-soft text-accent">
          <Icon width={20} height={20} />
          <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-tomato text-[11px] font-bold text-white ring-2 ring-surface">
            {step}
          </span>
        </span>
        <h2 className="text-lg font-bold">{title}</h2>
      </div>
      {children}
    </div>
  );
}
