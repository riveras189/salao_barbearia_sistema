import "./globals.css";
import "./theme-barbearia.css";
import ThemeScript from "@/components/theme/ThemeScript";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeScript />
        {children}
      </body>
    </html>
  );
}
