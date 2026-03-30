import type { Metadata } from "next";
import "./globals.css";
import "./editor.css";

export const metadata: Metadata = {
  title: "PDF Template Creator",
  description: "WYSIWYG PDF template editor powered by react-pdf",
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({
  children,
}: Readonly<RootLayoutProps>) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}
