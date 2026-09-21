"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { format } from "@/lib/trip";
import styles from "./CopyReference.module.scss";

const COPIED_MS = 2000;

/**
 * A reference number in the dashed pale-blue box, with a "Copy" link beside
 * it — Figma "Radio" 948:243282 (Booking ID, left column) and 948:243853
 * (Transaction ID, payment summary). The page's only client island.
 *
 * The label switches to "Copied" for two seconds after a copy, and a polite
 * live region says so. PROVISIONAL: Figma draws the resting state only.
 *
 * @param label    "Booking ID"
 * @param value    the number itself, which is what gets copied
 * @param content  documentUploadContent.copy
 * @param size     "large" (web: 500 16/24, hugs its content) or "small"
 *                 (400 12/18, full width), as the web frame draws them; mweb
 *                 (1168:23394) runs both full width with the icon alone
 */
export default function CopyReference({ label, value, content, size = "large" }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(false), COPIED_MS);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      // Clipboard access refused (an insecure context, or a denied
      // permission): the number is still on screen to select by hand.
    }
  };

  return (
    <div className={size === "small" ? `${styles.box} ${styles.small}` : styles.box}>
      <p className={styles.text}>
        {label} : {value}
      </p>
      <button
        type="button"
        className={styles.copy}
        onClick={handleCopy}
        aria-label={format(content.ariaLabel, { label })}
      >
        <Image src={content.icon} alt="" aria-hidden="true" width={20} height={20} className={styles.icon} />
        <span className={styles.copyLabel} data-copied={copied ? "" : undefined}>
          {copied ? content.copiedLabel : content.label}
        </span>
      </button>
      <span className={styles.status} role="status">
        {copied ? format(content.copiedAnnouncement, { label }) : ""}
      </span>
    </div>
  );
}
