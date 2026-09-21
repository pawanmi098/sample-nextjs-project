import Image from "next/image";
import styles from "./NextSteps.module.scss";

/**
 * "Next Steps" — Figma "Price" (761:196813): the application's three stages
 * on a grey rail. A finished step shows the green tick (I1250:87094), the
 * current one a #9999DE ring round a #3333B6 dot (I1250:87101), and one still
 * to come a #EBECEE ring round a #4B5772 dot (I1250:87109).
 *
 * @param content  documentUploadContent.nextSteps
 */
export default function NextSteps({ content }) {
  const { title, steps, doneIcon, statusLabels } = content;

  return (
    <section className={styles.section} aria-labelledby="next-steps-title">
      <h2 id="next-steps-title" className={styles.title}>
        {title}
      </h2>
      <ol className={styles.card}>
        {steps.map((step) => (
          <li
            key={step.id}
            className={`${styles.step} ${styles[step.status]}`}
            aria-current={step.status === "current" ? "step" : undefined}
          >
            <span className={styles.marker}>
              {step.status === "done" ? (
                <Image src={doneIcon} alt="" aria-hidden="true" width={24} height={24} />
              ) : (
                <span className={styles.dot} aria-hidden="true" />
              )}
            </span>
            <span className={styles.text}>
              <span className={styles.stepTitle}>
                {step.title}
                <span className={styles.visuallyHidden}>, {statusLabels[step.status]}</span>
              </span>
              <span className={styles.description}>{step.description}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
