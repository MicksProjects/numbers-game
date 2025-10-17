import { ThemeProvider } from "@/components/ThemeProvider"
import "./globals.css"
import { SiteNavbar } from "@/components/Navbar"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <html lang="en" suppressHydrationWarning>
        <head />
        <body>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SiteNavbar />
            {children}
          </ThemeProvider>
        </body>
      </html>
    </>
  )
}
