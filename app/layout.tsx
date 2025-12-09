import { ThemeProvider } from "@/components/ThemeProvider"
import "./globals.css"
import { SiteNavbar } from "@/components/Navbar"
import { Toaster } from "@/components/ui/sonner"

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
