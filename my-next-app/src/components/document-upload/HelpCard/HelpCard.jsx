import Image from "next/image";
import { ResponsiveCopy } from "@/components/common/PageIntro/PageIntro";
import styles from "./HelpCard.module.scss";

/**
 * "Need help with Your Booking?" — Figma "Frame 1321316869" (761:196850): who
 * to contact, with their email and phone number as real mailto: / tel: links.
 * The title is worded per frame (mweb 1207:85520 "Need help ?").
 *
 * @param content  documentUploadContent.help
 */
export default function HelpCard({ content }) {
  const { title, icon, name, description, email, phone } = content;

  return (
    <section className={styles.section} aria-labelledby="help-title">
      <h2 id="help-title" className={styles.title}>
        <ResponsiveCopy copy={title} />
      </h2>
      <div className={styles.card}>
        <span className={styles.icon}>
          <Image src={icon} alt="" aria-hidden="true" width={20} height={20} />
        </span>
        <div className={styles.text}>
          <p className={styles.name}>{name}</p>
          <p className={styles.description}>{description}</p>
          <a href={`mailto:${email}`} className={styles.link}>
            {email}
          </a>
          <a href={`tel:${phone}`} className={styles.link}>
            {phone}
          </a>
        </div>
      </div>
    </section>
  );
}
