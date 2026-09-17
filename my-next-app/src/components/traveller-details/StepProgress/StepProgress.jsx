import { format } from "@/lib/trip";
import styles from "./StepProgress.module.scss";

/**
 * "Next: Review Application  1/3" and three bars — Figma "Stepper"
 * (595:47265). Bars up to `current` are filled.
 */
export default function StepProgress({ content }) {
  const { nextLabel, current, total, countLabel, ariaLabel } = content;
  const tokens = { current, total };

  return (
    <div className={styles.stepper}>
      <div className={styles.labels}>
        <p className={styles.text}>{nextLabel}</p>
        <p className={styles.text}>
          <span aria-hidden="true">{format(countLabel, tokens)}</span>
          <span className={styles.visuallyHidden}>{format(ariaLabel, tokens)}</span>
        </p>
      </div>
      <ol className={styles.bars} aria-hidden="true">
        {Array.from({ length: total }, (_, index) => (
          <li key={index} className={index < current ? `${styles.bar} ${styles.barDone}` : styles.bar} />
        ))}
      </ol>
    </div>
  );
}
