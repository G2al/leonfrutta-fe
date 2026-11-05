import Image from "next/image";
import logo from "@/public/leonfrutta-logo-round.webp";

/** Logo rotondo (generato da scripts/generate-icons.mjs a partire dal logo originale). */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <Image
      src={logo}
      alt="LeonFrutta – Frutta e verdura"
      loading="eager"
      fetchPriority="high"
      sizes="160px"
      className={`h-auto ${className}`}
    />
  );
}
