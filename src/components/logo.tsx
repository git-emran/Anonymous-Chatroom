import Image from "next/image";

interface LogoProps {
  /** Pixel size of the square logo. Defaults to 40. */
  size?: number;
  /** Whether to show the text label next to the icon. Defaults to true. */
  showLabel?: boolean;
  className?: string;
}

/**
 * Brand logo for Private_chat.
 * Uses the public/logo.svg with next/image for automatic optimisation.
 */
export function Logo({ size = 40, showLabel = true, className = "" }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Image
        src="/logo.svg"
        alt="Private_chat logo"
        width={size}
        height={size}
        priority
        // SVGs don't need blurDataURL; disable placeholder to keep it crisp
        placeholder="empty"
      />
      {showLabel && (
        <span
          className="font-mono font-bold text-green-500 tracking-tight"
          style={{ fontSize: size * 0.45 }}
        >
          {"> "}
          <span className="text-zinc-100">Private</span>
          <span className="text-green-500">_chat</span>
        </span>
      )}
    </div>
  );
}
