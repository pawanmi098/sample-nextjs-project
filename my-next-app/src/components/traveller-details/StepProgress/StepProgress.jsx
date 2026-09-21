import { format } from "@/lib/trip";
import styles from "./StepProgress.module.scss";

/**
 * "Next: Review Application  1/3" and three bars — Figma "Stepper"
 * (595:47265). Bars up to `current` are filled.
 *
 * `completed` (optional) turns the first bars green for steps already
 * finished, as the document upload page draws them ("Upload documents 3/3",
 * I761:196812;1694:57889): two green, then the current step's blue.
 */
export default function StepProgress({ content }) {
  const { nextLabel, current, completed = 0, total, countLabel, ariaLabel } = content;
  const barClass = (index) => {
    if (index < completed) return `${styles.bar} ${styles.barComplete}`;
    if (index < current) return `${styles.bar} ${styles.barDone}`;
    return styles.bar;
  };
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
          <li key={index} className={barClass(index)} />
        ))}
      </ol>
    </div>
  );
}
