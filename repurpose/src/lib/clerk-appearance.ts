import { dark } from "@clerk/themes";

// Hex values intentionally mirror src/app/globals.css (Clerk can't resolve CSS vars).
export const clerkAppearance = {
  baseTheme: dark,
  variables: {
    colorPrimary: "#c8ff3d",
    colorTextOnPrimaryBackground: "#0a0a0b",
    colorBackground: "#111113",
    colorInputBackground: "#18181b",
    colorInputText: "#fafafa",
    colorText: "#fafafa",
    colorTextSecondary: "#a1a1aa",
    colorNeutral: "#fafafa",
    colorDanger: "#f87171",
    colorSuccess: "#4ade80",
    colorWarning: "#fbbf24",
    borderRadius: "10px",
    fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
  },
  elements: {
    cardBox: "shadow-none",
    card: "border border-line bg-bg-1 shadow-none raised",
    headerTitle: "font-serif text-2xl font-normal tracking-tight",
    headerSubtitle: "text-fg-1",
    socialButtonsBlockButton: "border-line bg-bg-2 hover:bg-bg-3",
    formFieldInput: "border-line-strong bg-bg-2 focus:ring-brand",
    formButtonPrimary: "shadow-none hover:bg-brand/90",
    footer: "bg-bg-1 [background-image:none]",
    footerActionLink: "text-brand hover:text-brand",
    userButtonPopoverCard: "border border-line bg-bg-2 shadow-none float",
  },
};
