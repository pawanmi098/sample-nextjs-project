import localFont from "next/font/local";
import commonContent from "@/data/commonContent.json";
import "@/styles/main.scss";

// Latin-subset woff2 files (see AGENTS.md → Fonts). Each weight is its own
// family exposed as a CSS variable consumed by src/styles/_mixins.scss.
const poppinsLight = localFont({
  src: "../../public/fonts/Poppins/Poppins-Light-latin.woff2",
  weight: "300",
  style: "normal",
  display: "swap",
  variable: "--font-family-poppins-light",
  fallback: ["Arial", "sans-serif"],
  // Only used below the fold — don't compete with above-the-fold fonts.
  preload: false,
});

const poppinsRegular = localFont({
  src: "../../public/fonts/Poppins/Poppins-Regular-latin.woff2",
  weight: "400",
  style: "normal",
  display: "swap",
  variable: "--font-family-poppins-regular",
  fallback: ["Arial", "sans-serif"],
});

const poppinsMedium = localFont({
  src: "../../public/fonts/Poppins/Poppins-Medium-latin.woff2",
  weight: "500",
  style: "normal",
  display: "swap",
  variable: "--font-family-poppins-medium",
  fallback: ["Arial", "sans-serif"],
  // Preload only the fonts of the LCP text (subtitle) and <h1>; every extra
  // high-priority request in <head> counts against simulated mobile LCP.
  preload: false,
});

const poppinsSemiBold = localFont({
  src: "../../public/fonts/Poppins/Poppins-SemiBold-latin.woff2",
  weight: "600",
  style: "normal",
  display: "swap",
  variable: "--font-family-poppins-semibold",
  fallback: ["Arial", "sans-serif"],
  preload: false,
});

const bauhausStdMedium = localFont({
  src: "../../public/fonts/BauhausStd/BauhausStd-Medium-latin.woff2",
  weight: "500",
  style: "normal",
  display: "swap",
  variable: "--font-family-bauhaus-std-medium",
  fallback: ["Arial", "sans-serif"],
});

const fontVariables = [
  poppinsLight,
  poppinsRegular,
  poppinsMedium,
  poppinsSemiBold,
  bauhausStdMedium,
]
  .map((font) => font.variable)
  .join(" ");

export const metadata = {
  title: {
    default: commonContent.meta.siteName,
    template: `%s | ${commonContent.meta.siteName}`,
  },
  description: commonContent.meta.description,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={fontVariables}>
      <body className="theme-cloud">{children}</body>
    </html>
  );
}
