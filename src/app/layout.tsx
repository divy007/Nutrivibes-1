import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DateWithDiet | Personalized Nutrition by Dt. Mansi Anajwala",
  description: "Official DateWithDiet app. Get personalized diet plans, expert nutrition guidance, and health tracking. Fall in love with healthy eating today.",
  metadataBase: new URL("https://datewithdiet.in"),
  keywords: ["diet plan", "nutritionist", "Dt. Mansi Anajwala", "health tracking", "weight loss", "DateWithDiet"],
  openGraph: {
    title: "DateWithDiet | Personalized Nutrition",
    description: "Your personal wellness journey starts here. Download the official app for iOS and Android.",
    url: "https://datewithdiet.in",
    siteName: "DateWithDiet",
    locale: "en_IN",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${jakarta.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
