import Image from "next/image";
import logo from "@/public/leonfrutta-logo.webp";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Image
      src={logo}
      alt="LeonFrutta – Frutta e verdura"
      loading="eager"
      fetchPriority="high"
      sizes="240px"
      className={`h-auto w-60 ${className}`}
    />
  );
}
