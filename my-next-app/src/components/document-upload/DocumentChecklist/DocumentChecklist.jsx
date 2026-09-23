import TravellerDocuments from "../TravellerDocuments/TravellerDocuments";
import styles from "./DocumentChecklist.module.scss";

/**
 * "Required Documents" — Figma "Frame 2147227949" (761:196643): one card per
 * traveller, 16 apart, the first one open.
 *
 * The section itself is static; each card is a client island that uploads a
 * document as soon as it is chosen and counts what got through
 * (TravellerDocuments).
 *
 * mweb "Document Upload" (1168:23394) drops the section title — the page's own
 * heading sits right above the cards — so below desktop it stays for screen
 * readers only.
 *
 * @param content     documentUploadContent.documents
 * @param travellers  `[{ id, position, firstName, lastName, primary }]`
 */
export default function DocumentChecklist({ content, travellers }) {
  return (
    <section className={styles.section} aria-labelledby="required-documents-title">
      <h2 id="required-documents-title" className={styles.title}>
        {content.title}
      </h2>
      <ul className={styles.travellers}>
        {travellers.map((traveller, index) => (
          <li key={traveller.id}>
            <TravellerDocuments content={content} traveller={traveller} open={index === 0} />
          </li>
        ))}
      </ul>
    </section>
  );
}
