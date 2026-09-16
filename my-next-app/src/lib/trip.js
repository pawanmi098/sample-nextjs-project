/**
 * Search criteria → the values the search result page renders.
 *
 * The home search form submits `GET /search-result` with the field names in
 * src/data/homeContent.json (`from`, `to`, `travelDate`, `travellers`,
 * `nationality`, `residence`, `purpose`). Everything that turns those raw
 * values into display text lives here, driven by the maps in
 * src/data/searchResultContent.json — so adding a nationality or a trip
 * purpose is a JSON edit, never a code edit.
 *
 * Pure and synchronous: callers `await searchParams` (a Promise in Next 16)
 * and hand the plain object in.
 */

/** Read one param, falling back to the configured default. */
function pick(searchParams, key, defaults) {
  const raw = searchParams?.[key];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return typeof value === "string" && value.trim() !== "" ? value.trim() : defaults[key];
}

export function resolveTrip(searchParams, config) {
  const { defaults, labels, travellers: travellersLabels } = config;

  const values = Object.fromEntries(
    Object.keys(defaults).map((key) => [key, pick(searchParams, key, defaults)]),
  );

  const purpose = labels.purpose[values.purpose] ?? labels.purpose[defaults.purpose];
  const count = Number.parseInt(values.travellers, 10);
  const travellers = Number.isNaN(count) ? null : count;

  // Order is shared by both viewports: the mobile-only fact comes first and
  // the desktop-only ones last, so each viewport renders a contiguous run.
  const facts = [
    { id: "purpose", label: purpose.fact, show: "mobile" },
    { id: "travelDate", label: values.travelDate, show: "both" },
    {
      id: "travellers",
      label:
        travellers === null
          ? null
          : `${travellers} ${travellers === 1 ? travellersLabels.one : travellersLabels.other}`,
      show: "both",
    },
    { id: "nationality", label: labels.nationality[values.nationality], show: "desktop" },
    { id: "residence", label: labels.residence[values.residence], show: "desktop" },
  ].filter((fact) => Boolean(fact.label));

  return {
    from: values.from,
    to: values.to,
    purposeAdjective: purpose.adjective,
    facts,
    // The raw criteria, so the header's edit panel can prefill its fields
    // with what this page is showing.
    values,
  };
}

/** Fill `{token}` placeholders in a copy string. */
export function format(template, tokens) {
  return template.replace(/\{(\w+)\}/g, (match, key) => tokens[key] ?? match);
}
