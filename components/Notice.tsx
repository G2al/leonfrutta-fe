import type { ReactNode } from "react";
import { AlertIcon, WifiOffIcon } from "./icons";

const tones = {
  error: "border-error/30 bg-error/5 text-error-text",
  warning: "border-warning/40 bg-warning/10 text-warning-text",
} as const;

interface NoticeProps {
  tone: keyof typeof tones;
  icon?: "alert" | "offline";
  children: ReactNode;
}

export function Notice({ tone, icon = "alert", children }: NoticeProps) {
  const Icon = icon === "offline" ? WifiOffIcon : AlertIcon;
  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm leading-snug ${tones[tone]}`}
    >
      <Icon width={18} height={18} className="mt-px shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
