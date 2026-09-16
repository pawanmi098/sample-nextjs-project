import SiteHeader from "@/components/common/SiteHeader/SiteHeader";
import commonContent from "@/data/commonContent.json";

/**
 * Default chrome for routes that use the plain site header.
 *
 * The header lives here rather than in the root layout so a route can render
 * its own variant instead — /search-result fills SiteHeader's `trip` slot
 * from its searchParams, which a layout never receives. Routes that want the
 * plain header just sit inside this group; the group's parentheses keep it
 * out of the URL, so this file's own route is still "/".
 */
export default function SiteLayout({ children }) {
  return (
    <>
      <SiteHeader content={commonContent.header} />
      {children}
    </>
  );
}
