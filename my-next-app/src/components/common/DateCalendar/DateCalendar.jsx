"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { format } from "@/lib/trip";
import DropdownSurface, { useIsDesktop } from "../DropdownSurface/DropdownSurface";
import styles from "./DateCalendar.module.scss";

/**
 * The Figma "Calendar" component — one picker drawn in three views:
 * days 1098:310437 ("January 2026"), months 1098:311067 ("1991") and years
 * 1098:310617 ("1991 - 2010"). The head's centre is a button that climbs a
 * level (days → months → years) and picking a cell comes back down, which is
 * what makes a 1970 date of birth reachable without 600 taps on the arrow.
 *
 * Presented by DropdownSurface, so the same component is a popover hanging
 * under its field from desktop up and a bottom sheet below that — the two
 * presentations Figma draws (1098:310437 is a bordered r8 card; the mweb
 * frames 999:263696 and 1098:312122 are r20 sheets over a scrim).
 *
 * The sheet carries a 56-tall "<PopupModalHeader>" with a close button, which
 * the popover has not got: on mweb it is the only thing between the grid and
 * the whole viewport, so it says how to get out. Both mweb frames draw it, in
 * the day view and the month view alike.
 *
 * Everything here speaks ISO ("YYYY-MM-DD"); the field that owns it converts
 * to and from the DD-MM-YYYY its input shows.
 *
 * @param value     the chosen date, or "" — ISO
 * @param min max   the selectable range, either may be "" — ISO
 * @param content   form.passengers.calendar copy: month and weekday names,
 *                  the nav icons and every aria-label
 * @param onSelect  called with the ISO date of the day that was picked
 * @param onClose   Escape, or a tap on the mobile scrim
 * @param rootRef   outermost node, so the field can tell an outside click
 *                  from one that landed in the picker
 */

/** 4 x 5 cells, the 20 years Figma's "1991 - 2010" range holds. */
const YEARS_PER_PAGE = 20;

function parseIso(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? "");
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

function toIso({ year, month, day }) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** Comparable day number (YYYYMMDD), so two dates compare as integers. */
function dayKey({ year, month, day }) {
  return year * 10000 + month * 100 + day;
}

/** Comparable month number, for the same reason. */
function monthKey(year, month) {
  return year * 12 + (month - 1);
}

function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Weekday of the 1st, 0 = Sunday — the column the month starts in. */
function firstWeekday(year, month) {
  return new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
}

/** `parts` moved by whole days, staying a real date. */
function addDays({ year, month, day }, amount) {
  const moved = new Date(Date.UTC(year, month - 1, day + amount));
  return { year: moved.getUTCFullYear(), month: moved.getUTCMonth() + 1, day: moved.getUTCDate() };
}

/** `{ year, month }` moved by whole months. */
function addMonths({ year, month }, amount) {
  const moved = new Date(Date.UTC(year, month - 1 + amount, 1));
  return { year: moved.getUTCFullYear(), month: moved.getUTCMonth() + 1 };
}

/** Today as `{ year, month, day }` in the viewer's own timezone. */
function todayParts() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
}

/**
 * The weeks the day view draws: whole Sunday-to-Saturday rows, with the
 * neighbouring months' days filling the ends. Figma greys those and gives
 * them no rule, so they're shown but never selectable.
 */
function weeksOf(year, month) {
  const total = daysInMonth(year, month);
  const lead = firstWeekday(year, month);
  const cells = [];

  for (let index = -lead; index < total + ((7 - ((lead + total) % 7)) % 7); index += 1) {
    const date = addDays({ year, month, day: 1 }, index);
    cells.push({ ...date, outside: date.month !== month || date.year !== year });
  }

  const weeks = [];
  for (let start = 0; start < cells.length; start += 7) weeks.push(cells.slice(start, start + 7));
  return weeks;
}

export default function DateCalendar({
  id,
  label,
  value,
  min,
  max,
  content,
  onSelect,
  onClose,
  rootRef,
  className,
}) {
  const minParts = parseIso(min);
  const maxParts = parseIso(max);

  const inRange = (parts) => {
    if (minParts && dayKey(parts) < dayKey(minParts)) return false;
    if (maxParts && dayKey(parts) > dayKey(maxParts)) return false;
    return true;
  };

  /** The nearest selectable day to `parts` — where an empty field opens. */
  const clamp = (parts) => {
    if (minParts && dayKey(parts) < dayKey(minParts)) return minParts;
    if (maxParts && dayKey(parts) > dayKey(maxParts)) return maxParts;
    return parts;
  };

  const selected = parseIso(value);
  const opensOn = selected && inRange(selected) ? selected : clamp(todayParts());

  const isDesktop = useIsDesktop();
  const [view, setView] = useState("days");
  const [cursor, setCursor] = useState({ year: opensOn.year, month: opensOn.month });
  // The day the grid's one tab stop sits on: a date grid is a single tab
  // stop, and the arrow keys move within it.
  const [focused, setFocused] = useState(opensOn);

  const gridRef = useRef(null);
  // True while a key press (or opening the picker) is waiting for the day it
  // moved to. Anything else that re-renders — a click, a view change — leaves
  // it false, so focus is never yanked back into the grid.
  const shouldFocus = useRef(true);

  // Opening moves focus into the picker, and every arrow key keeps it on the
  // day it lands on — including when that day is in the next month, which
  // re-renders the whole grid.
  useEffect(() => {
    if (view !== "days" || !shouldFocus.current) return;
    gridRef.current?.querySelector(`[data-iso="${toIso(focused)}"]`)?.focus();
    shouldFocus.current = false;
  }, [view, focused]);

  const moveFocus = (parts) => {
    if (!inRange(parts)) return;
    shouldFocus.current = true;
    setFocused(parts);
    setCursor({ year: parts.year, month: parts.month });
  };

  const onGridKeyDown = (event) => {
    const moves = {
      ArrowLeft: () => addDays(focused, -1),
      ArrowRight: () => addDays(focused, 1),
      ArrowUp: () => addDays(focused, -7),
      ArrowDown: () => addDays(focused, 7),
      Home: () => addDays(focused, -focused.day + 1),
      End: () => ({ ...focused, day: daysInMonth(focused.year, focused.month) }),
      PageUp: () => {
        const { year, month } = addMonths(focused, -1);
        return { year, month, day: Math.min(focused.day, daysInMonth(year, month)) };
      },
      PageDown: () => {
        const { year, month } = addMonths(focused, 1);
        return { year, month, day: Math.min(focused.day, daysInMonth(year, month)) };
      },
    };

    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    moveFocus(move());
  };

  // ---------------------------------------------------------------------------
  // The head. Each view steps by its own unit, and its arrow greys out (Figma
  // draws the disabled one #9BA4B8, 1098:310437) once there is nothing left
  // that way inside the range.
  // ---------------------------------------------------------------------------
  const yearsStart = (() => {
    const base = minParts ? minParts.year : Math.floor(cursor.year / YEARS_PER_PAGE) * YEARS_PER_PAGE;
    return base + Math.floor((cursor.year - base) / YEARS_PER_PAGE) * YEARS_PER_PAGE;
  })();

  const step = (direction) => {
    if (view === "days") {
      setCursor((current) => addMonths(current, direction));
      return;
    }
    const years = view === "months" ? 1 : YEARS_PER_PAGE;
    setCursor((current) => ({ ...current, year: current.year + direction * years }));
  };

  // Whether the page the arrow would reveal holds anything selectable.
  const canStep = (direction) => {
    if (view === "days") {
      const next = addMonths(cursor, direction);
      const key = monthKey(next.year, next.month);
      if (direction < 0) return !minParts || key >= monthKey(minParts.year, minParts.month);
      return !maxParts || key <= monthKey(maxParts.year, maxParts.month);
    }

    if (view === "months") {
      const year = cursor.year + direction;
      if (direction < 0) return !minParts || year >= minParts.year;
      return !maxParts || year <= maxParts.year;
    }

    // The previous page ends the year before this one starts; the next page
    // starts the year after it ends.
    if (direction < 0) return !minParts || yearsStart - 1 >= minParts.year;
    return !maxParts || yearsStart + YEARS_PER_PAGE <= maxParts.year;
  };

  const titleText =
    view === "days"
      ? `${content.months[cursor.month - 1]} ${cursor.year}`
      : view === "months"
        ? String(cursor.year)
        : format(content.rangeLabel, { start: yearsStart, end: yearsStart + YEARS_PER_PAGE - 1 });

  const titleId = `${id}-title`;

  const navButton = (direction) => {
    const enabled = canStep(direction);
    const icons = direction < 0 ? content.prevIcon : content.nextIcon;
    const labels = direction < 0 ? content.prevLabel : content.nextLabel;

    return (
      <button
        type="button"
        className={styles.nav}
        onClick={() => step(direction)}
        disabled={!enabled}
        aria-label={labels[view]}
      >
        <Image src={enabled ? icons.enabled : icons.disabled} alt="" aria-hidden="true" width={16} height={16} />
      </button>
    );
  };

  const head = (
    <div className={styles.head}>
      {navButton(-1)}
      {view === "years" ? (
        <span id={titleId} className={styles.title}>
          {titleText}
        </span>
      ) : (
        <button
          type="button"
          id={titleId}
          className={`${styles.title} ${styles.titleButton}`}
          onClick={() => setView(view === "days" ? "months" : "years")}
          aria-label={format(content.viewLabel[view], { current: titleText })}
        >
          {titleText}
        </button>
      )}
      {navButton(1)}
    </div>
  );

  // ---------------------------------------------------------------------------
  // The three grids.
  // ---------------------------------------------------------------------------
  const days = (
    <div
      ref={gridRef}
      role="grid"
      aria-labelledby={titleId}
      className={styles.days}
      onKeyDown={onGridKeyDown}
    >
      <div role="row" className={styles.weekdays}>
        {content.weekdays.map((weekday, index) => (
          <span key={weekday} role="columnheader" aria-label={content.weekdaysLong[index]} className={styles.weekday}>
            {weekday}
          </span>
        ))}
      </div>

      {weeksOf(cursor.year, cursor.month).map((week) => (
        <div role="row" key={toIso(week[0])} className={styles.week}>
          {week.map((day) => {
            const iso = toIso(day);
            const selectable = !day.outside && inRange(day);
            const isSelected = selected != null && dayKey(day) === dayKey(selected);

            return (
              <span role="gridcell" aria-selected={isSelected || undefined} key={iso} className={styles.cell}>
                {selectable ? (
                  <button
                    type="button"
                    data-iso={iso}
                    className={isSelected ? `${styles.day} ${styles.daySelected}` : styles.day}
                    // One tab stop for the whole grid; the arrows move it.
                    tabIndex={dayKey(day) === dayKey(focused) ? 0 : -1}
                    aria-label={format(content.dayLabel, {
                      day: day.day,
                      month: content.months[day.month - 1],
                      year: day.year,
                    })}
                    onFocus={() => setFocused((current) => (dayKey(current) === dayKey(day) ? current : day))}
                    onClick={() => onSelect(iso)}
                  >
                    {day.day}
                  </button>
                ) : (
                  // Figma draws the neighbouring months' days as grey text
                  // with no rule (1098:310437, the "31" and the trailing
                  // "1 2 3"); anything outside the allowed range reads the
                  // same way. A disabled button, not a span: it keeps the
                  // cell in the grid for a screen reader, and axe skips a
                  // disabled control when it checks contrast — #9BA4B8 on
                  // white is 2.6:1.
                  <button type="button" className={`${styles.day} ${styles.dayMuted}`} disabled tabIndex={-1}>
                    {day.day}
                  </button>
                )}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );

  const months = (
    <div className={`${styles.pickGrid} ${styles.pickMonths}`} aria-labelledby={titleId}>
      {content.months.map((month, index) => {
        const number = index + 1;
        const before = minParts && monthKey(cursor.year, number) < monthKey(minParts.year, minParts.month);
        const after = maxParts && monthKey(cursor.year, number) > monthKey(maxParts.year, maxParts.month);
        const current = selected?.year === cursor.year && selected?.month === number;

        return (
          <button
            key={month}
            type="button"
            className={current ? `${styles.pick} ${styles.pickSelected}` : styles.pick}
            disabled={Boolean(before || after)}
            aria-current={current || undefined}
            onClick={() => {
              setCursor((cell) => ({ ...cell, month: number }));
              setFocused((day) => ({
                year: cursor.year,
                month: number,
                day: Math.min(day.day, daysInMonth(cursor.year, number)),
              }));
              shouldFocus.current = true;
              setView("days");
            }}
          >
            {month}
          </button>
        );
      })}
    </div>
  );

  const years = (
    <div className={`${styles.pickGrid} ${styles.pickYears}`} aria-labelledby={titleId}>
      {Array.from({ length: YEARS_PER_PAGE }, (unused, index) => yearsStart + index).map((year) => {
        const outside = (minParts && year < minParts.year) || (maxParts && year > maxParts.year);
        const current = selected?.year === year;

        return (
          <button
            key={year}
            type="button"
            className={current ? `${styles.pick} ${styles.pickSelected}` : styles.pick}
            disabled={Boolean(outside)}
            aria-current={current || undefined}
            onClick={() => {
              setCursor((cell) => ({ ...cell, year }));
              setView("months");
            }}
          >
            {year}
          </button>
        );
      })}
    </div>
  );

  return (
    <DropdownSurface
      className={[styles.surface, className].filter(Boolean).join(" ")}
      sheetClassName={styles.sheet}
      rootRef={rootRef}
      onClose={onClose}
      modal
    >
      {/* Not `aria-modal`: the popover leaves the page behind it live, and the
          field it belongs to stays one Tab away. */}
      <div
        id={id}
        role="dialog"
        aria-label={label}
        className={styles.card}
        onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.stopPropagation();
          onClose();
        }}
      >
        {/* Sheet only: "<PopupModalHeader>" (I999:263696;6315:17003), a
            56-tall bar ruled underneath with the close button at its right
            edge. The popover has no such bar in Figma — the field it hangs
            from is still on screen beside it. */}
        {!isDesktop && (
          <div className={styles.sheetHead}>
            <button type="button" className={styles.close} onClick={onClose} aria-label={content.closeLabel}>
              <Image src={content.closeIcon} alt="" aria-hidden="true" width={24} height={24} />
            </button>
          </div>
        )}

        <div className={styles.body}>
          {head}
          {view === "days" ? days : view === "months" ? months : years}
        </div>
      </div>
    </DropdownSurface>
  );
}
