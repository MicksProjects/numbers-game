import { ThemeProvider } from "@/components/ThemeProvider"
import "./globals.css"
import { SiteNavbar } from "@/components/Navbar"
import { Toaster } from "@/components/ui/sonner"
import Script from "next/script"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
          <Script
            src="https://www.googletagmanager.com/gtag/js?id=G-1WH36J7F55"
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-1WH36J7F55');
            `}
          </Script>
        </head>
        <body suppressHydrationWarning>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Toaster />
            <SiteNavbar />
            <div className="p-2">{children}</div>
          </ThemeProvider>
        </body>
      </html>
    </>
  )
}
