import Image from "next/image";
import styles from "./VisaProcessShowcase.module.scss";

export default function VisaProcessShowcase({ content }) {
  const { sectionTitle, partner, eyebrow, title, image, steps } = content;

  return (
    <section className={styles.showcase} aria-labelledby="visa-process-heading">
      <h2 id="visa-process-heading" className={styles.sectionTitle}>
        {sectionTitle}
      </h2>

      <div className={styles.card}>
        <Image
          src={image.src}
          alt={image.alt}
          aria-hidden={image.alt ? undefined : "true"}
          fill
          // Desktop LCP, but the section is hidden on mobile: stay lazy (a lazy
          // image in a display:none subtree is never fetched) and raise its
          // priority where it does render.
          fetchPriority="high"
          sizes="(min-width: 1280px) 1192px, calc(100vw - 88px)"
          className={styles.backgroundImage}
        />
        <span className={styles.overlay} aria-hidden="true" />

        <div className={styles.content}>
          <p className={styles.partner}>{partner}</p>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h3 className={styles.title}>{title}</h3>

          <ol className={styles.steps}>
            {steps.map((step) => (
              <li key={step.title} className={styles.step}>
                <h4 className={styles.stepTitle}>{step.title}</h4>
                <p className={styles.stepDescription}>{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
