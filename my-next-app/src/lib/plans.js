/**
 * Visa plan list state — which plans the search result page shows, and the
 * hrefs its filter chips and sort button point at.
 *
 * The chips and the sort control are plain links that re-request
 * /search-result with one extra query param, so the whole block works with
 * JavaScript switched off and needs no client component. Every other param
 * already on the URL (the trip criteria that src/lib/trip.js reads) is
 * carried through untouched.
 *
 * Pure and synchronous, like src/lib/trip.js: callers `await searchParams`
 * and hand the plain object in.
 */

import { format } from "./trip";

/** Copy the current query, override one key, and return the resulting href. */
function hrefWith(searchParams, key, value) {
  const params = new URLSearchParams();

  for (const [name, raw] of Object.entries(searchParams ?? {})) {
    const values = Array.isArray(raw) ? raw : [raw];
    for (const entry of values) {
      if (typeof entry === "string" && entry !== "") params.append(name, entry);
    }
  }

  params.delete(key);
  params.append(key, value);

  return `/search-result?${params.toString()}`;
}

/** Read one param, falling back to the first option when it isn't recognised. */
function pickOption(searchParams, name, options) {
  const raw = searchParams?.[name];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return options.find((option) => option.id === value) ?? options[0];
}

export function resolvePlans(searchParams, config) {
  const { filters, sort, items, details } = config;

  const selectedFilter = pickOption(searchParams, filters.name, filters.options);
  const selectedSort = pickOption(searchParams, sort.name, sort.options);

  // Two sort states only, and the Figma order is already cheapest-first, so
  // "price-asc" is the default and the icon button flips between the two.
  const nextSort = sort.options.find((option) => option.id !== selectedSort.id);
  const direction = selectedSort.id === "price-desc" ? -1 : 1;

  const visible = items
    .filter((plan) => selectedFilter.id === "all" || plan.type === selectedFilter.id)
    .slice()
    .sort((a, b) => (a.price.amount - b.price.amount) * direction)
    .map((plan) => ({
      ...plan,
      // Two plans can share a title, so the "View Details" link needs more
      // than its own text to be distinguishable to a screen reader.
      detailsContext: format(details.context, { title: plan.title }),
    }));

  return {
    filters: filters.options.map((option) => ({
      ...option,
      href: hrefWith(searchParams, filters.name, option.id),
      selected: option.id === selectedFilter.id,
    })),
    sort: {
      icon: sort.icon,
      href: hrefWith(searchParams, sort.name, nextSort.id),
      label: format(sort.toggleLabel, { label: nextSort.label }),
    },
    items: visible,
  };
}
