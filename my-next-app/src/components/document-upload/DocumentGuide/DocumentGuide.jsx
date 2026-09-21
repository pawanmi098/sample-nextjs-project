"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import styles from "./DocumentGuide.module.scss";

/**
 * A document's info icon and the guide it opens — Figma web "Photograph"
 * (557:23258): a 574 card centred over the gradient scrim, with the sample
 * photo and its 45 MM measurements on the left and the "DO’S" / "DONT’S"
 * lists on the right.
 *
 * The popup is a native <dialog> opened with showModal(), so the browser
 * supplies the modal parts: the page behind it goes inert, focus stays inside,
 * and Escape closes it. The scrim is its ::backdrop, and a click on it closes
 * the popup too. It's only mounted while open, so the sample photo downloads
 * when someone asks for it rather than with the page.
 *
 * PROVISIONAL: no mweb frame yet. Below desktop the card fills the width less
 * the page's 16 gutters, scrolls inside the viewport, and stacks the photo
 * over the lists.
 *
 * @param content    documentUploadContent.documents.guide — the shared chrome
 * @param guide      the document's own `guide` — its title, photo and lists
 * @param infoIcon   documents.infoIcon
 * @param infoLabel  the button's accessible name, e.g. "About Passport photo"
 * @param className  the checklist's own `.infoButton` styles
 */
export default function DocumentGuide({ content, guide, infoIcon, infoLabel, className }) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef(null);
  const openerRef = useRef(null);
  const id = useId();
  const titleId = `${id}-title`;
  const introId = `${id}-intro`;

  useEffect(() => {
    if (!open) return undefined;
    const dialog = dialogRef.current;
    dialog?.showModal();

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [open]);

  // The dialog unmounts as it closes, so focus is put back on the icon here
  // rather than left to the browser.
  const handleClose = () => {
    setOpen(false);
    openerRef.current?.focus();
  };

  // A click whose point lies outside the card landed on the ::backdrop.
  const handleClick = (event) => {
    const rect = dialogRef.current.getBoundingClientRect();
    const inside =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;
    if (!inside) dialogRef.current.close();
  };

  const { title, intro, image, dimensions, dos, donts } = guide;

  return (
    <>
      <button
        ref={openerRef}
        type="button"
        className={className}
        aria-label={infoLabel}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <Image src={infoIcon} alt="" aria-hidden="true" width={24} height={24} />
      </button>

      {open && (
        <dialog
          ref={dialogRef}
          className={styles.dialog}
          aria-labelledby={titleId}
          aria-describedby={introId}
          onClose={handleClose}
          onClick={handleClick}
        >
          {/* "Frame 1321316807": the close cross on its own row, pushed right,
              then the title and the intro. */}
          <div className={styles.head}>
            <button type="button" className={styles.close} onClick={() => dialogRef.current.close()}>
              <Image src={content.closeIcon} alt="" aria-hidden="true" width={16} height={16} />
              <span className={styles.closeText}>{content.closeLabel}</span>
            </button>
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
            <p id={introId} className={styles.intro}>
              {intro}
            </p>
          </div>

          <div className={styles.body}>
            {/* "Frame 1618868780": the width over the photo, the height beside it. */}
            <figure className={styles.sample}>
              <div className={styles.widthRule}>
                <span aria-hidden="true">{dimensions.width}</span>
                <span className={styles.srOnly}>{dimensions.widthLabel}</span>
                <Image src={content.arrows.horizontal} alt="" aria-hidden="true" width={170} height={12} />
              </div>
              <div className={styles.photoRow}>
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={image.width}
                  height={image.height}
                  className={styles.photo}
                />
                <Image
                  src={content.arrows.vertical}
                  alt=""
                  aria-hidden="true"
                  width={12}
                  height={190}
                  className={styles.heightArrow}
                />
                <span className={styles.heightText} aria-hidden="true">
                  {dimensions.height}
                </span>
                <span className={styles.srOnly}>{dimensions.heightLabel}</span>
              </div>
            </figure>

            {/* "Frame 1618868777": the two lists, 24 apart. */}
            <div className={styles.rules}>
              <GuideList title={content.dosTitle} items={dos} />
              <GuideList title={content.dontsTitle} items={donts} />
            </div>
          </div>
        </dialog>
      )}
    </>
  );
}

function GuideList({ title, items }) {
  const headingId = useId();

  return (
    <div className={styles.group}>
      <h3 id={headingId} className={styles.groupTitle}>
        {title}
      </h3>
      <ul className={styles.list} aria-labelledby={headingId}>
        {items.map((item) => (
          <li key={item} className={styles.item}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
