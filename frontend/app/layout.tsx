import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI-Integrated Decentralized E-Voting System",
  description: "AI-Integrated Decentralized E-Voting System Using Ethereum Blockchain for Secure and Inclusive Elections — with 3-factor authentication, face verification, and encrypted secret ballots.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="font-sans antialiased"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
