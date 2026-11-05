import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InstallBanner } from "@/components/InstallBanner";

beforeEach(() => window.localStorage.clear());
afterEach(cleanup);

function fireBeforeInstallPrompt(outcome: "accepted" | "dismissed" = "accepted") {
  const event = new Event("beforeinstallprompt", { cancelable: true }) as Event & {
    prompt: ReturnType<typeof vi.fn>;
    userChoice: Promise<{ outcome: string; platform: string }>;
  };
  event.prompt = vi.fn().mockResolvedValue(undefined);
  event.userChoice = Promise.resolve({ outcome, platform: "web" });
  act(() => {
    window.dispatchEvent(event);
  });
  return event;
}

const installButton = () => screen.queryByRole("button", { name: /installa l'app/i });

describe("InstallBanner", () => {
  it("non compare se il browser non supporta l'installazione", () => {
    render(<InstallBanner delayMs={0} />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("si apre dopo beforeinstallprompt e avvia il prompt nativo", async () => {
    render(<InstallBanner delayMs={0} />);
    const event = fireBeforeInstallPrompt();

    expect(event.defaultPrevented).toBe(true);
    const dialog = await screen.findByRole("dialog", { name: "Installa LeonFrutta" });
    expect(dialog).toBeDefined();
    expect(document.activeElement).toBe(dialog);

    await userEvent.setup().click(installButton()!);

    expect(event.prompt).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("con 'Non ora' si chiude e non riappare per 7 giorni", async () => {
    const { unmount } = render(<InstallBanner delayMs={0} />);
    fireBeforeInstallPrompt();

    await userEvent.setup().click(await screen.findByRole("button", { name: "Non ora" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(window.localStorage.getItem("leonfrutta:install-dismissed")).not.toBeNull();

    unmount();
    render(<InstallBanner delayMs={0} />);
    fireBeforeInstallPrompt();
    await act(() => new Promise((resolve) => setTimeout(resolve, 10)));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("si chiude con il tasto Esc", async () => {
    render(<InstallBanner delayMs={0} />);
    fireBeforeInstallPrompt();
    await screen.findByRole("dialog");

    await userEvent.setup().keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("sparisce quando l'app viene installata", async () => {
    render(<InstallBanner delayMs={0} />);
    fireBeforeInstallPrompt();
    await screen.findByRole("dialog");

    act(() => {
      window.dispatchEvent(new Event("appinstalled"));
    });

    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
