import Image from "next/image";
import { ResponsiveCopy } from "@/components/common/PageIntro/PageIntro";
import { format } from "@/lib/trip";
import DocumentGuide from "../DocumentGuide/DocumentGuide";
import styles from "./DocumentChecklist.module.scss";

/**
 * "Required Documents" — Figma "Frame 2147227949" (761:196643): one card per
 * traveller, 16 apart. The first traveller's card is open (761:196646:
 * #EAF8FF head, chevron up, the five document rows); the others are closed
 * (761:196763 / 761:196764: white head, chevron down).
 *
 * Each card is a native <details>, so it opens and closes without JavaScript.
 *
 * The "Upload" button is a <label> over a visually hidden file input, which
 * keeps the native picker and its keyboard support.
 *
 * A document with a `guide` opens it from its info icon (DocumentGuide, the
 * page's one popup — Figma "Photograph" 557:23258); the others keep their
 * PROVISIONAL hover/focus tip until their own frames arrive. PROVISIONAL: this is the
 * page's first view only — what happens once a file is chosen (progress, the
 * uploaded state, the "Re-upload the document for Nishi" error toast
 * 761:196473) waits for its frames.
 *
 * mweb "Document Upload" (1168:23394) supplies the base: no section title
 * (it stays for screen readers), 20 chevrons in #25304B, and each document
 * row stacking its full-width "Upload" button under the text. Two documents
 * are named differently per frame (`label.{mobile,desktop}`).
 *
 * @param content     documentUploadContent.documents
 * @param travellers  `[{ id, position, firstName, lastName, primary, uploaded }]`
 */
export default function DocumentChecklist({ content, travellers }) {
  const { title, required, upload, chevronIcon } = content;
  // One name per document for labels read out by a screen reader.
  const plainLabel = (label) => (typeof label === "string" ? label : label.desktop);

  return (
    <section className={styles.section} aria-labelledby="required-documents-title">
      <h2 id="required-documents-title" className={styles.title}>
        {title}
      </h2>
      <ul className={styles.travellers}>
        {travellers.map((traveller, index) => {
          const name = `${traveller.firstName} ${traveller.lastName}`;

          return (
            <li key={traveller.id}>
              <details className={styles.card} open={index === 0}>
                <summary className={styles.summary}>
                  <span className={styles.identity}>
                    <span className={styles.nameRow}>
                      <span className={styles.name}>{name}</span>
                      {traveller.primary && <span className={styles.chip}>{content.primaryLabel}</span>}
                    </span>
                    <span className={styles.position}>{traveller.position}</span>
                  </span>
                  <span className={styles.count}>
                    {format(content.uploadedLabel, { count: traveller.uploaded, total: required.length })}
                  </span>
                  {/* #25304B at 20 on mweb, #000099 at 24 on web. */}
                  <Image
                    src={chevronIcon.mobile}
                    alt=""
                    aria-hidden="true"
                    width={20}
                    height={20}
                    className={`${styles.chevron} ${styles.chevronMobile}`}
                  />
                  <Image
                    src={chevronIcon.desktop}
                    alt=""
                    aria-hidden="true"
                    width={24}
                    height={24}
                    className={`${styles.chevron} ${styles.chevronDesktop}`}
                  />
                </summary>

                <ul className={styles.documents}>
                  {required.map((document) => {
                    const inputId = `${traveller.id}-${document.id}`;
                    const tipId = `${inputId}-tip`;
                    const label = plainLabel(document.label);

                    return (
                      <li key={document.id} className={styles.document}>
                        <span className={styles.docIcon}>
                          <Image src={document.icon} alt="" aria-hidden="true" width={24} height={24} />
                        </span>
                        <div className={styles.docText}>
                          <div className={styles.docTitleRow}>
                            <h3 className={styles.docTitle}>
                              <ResponsiveCopy copy={document.label} />
                            </h3>
                            {document.guide ? (
                              <span className={styles.info}>
                                <DocumentGuide
                                  content={content.guide}
                                  guide={document.guide}
                                  infoIcon={content.infoIcon}
                                  infoLabel={format(content.infoLabel, { document: label })}
                                  className={styles.infoButton}
                                />
                              </span>
                            ) : (
                              <span className={styles.info}>
                                <button
                                  type="button"
                                  className={styles.infoButton}
                                  aria-label={format(content.infoLabel, { document: label })}
                                  aria-describedby={tipId}
                                >
                                  <Image src={content.infoIcon} alt="" aria-hidden="true" width={24} height={24} />
                                </button>
                                {/* PROVISIONAL copy: Figma draws the icon, not what it says. */}
                                <span id={tipId} role="tooltip" className={styles.tip}>
                                  {document.hint}
                                </span>
                              </span>
                            )}
                          </div>
                          <p className={styles.formats}>{content.formats}</p>
                        </div>
                        <label htmlFor={inputId} className={styles.upload}>
                          <input
                            id={inputId}
                            type="file"
                            name={`documents[${traveller.id}][${document.id}]`}
                            accept={upload.accept}
                            className={styles.uploadInput}
                            aria-label={format(upload.ariaLabel, { document: label, traveller: name })}
                          />
                          <Image src={upload.icon} alt="" aria-hidden="true" width={24} height={24} className={styles.uploadIcon} />
                          {upload.label}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </details>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
