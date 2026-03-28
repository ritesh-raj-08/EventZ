
import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css";
import Header from "@/components/ui/header";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { ClerkClientProvider } from "./ClerkClientProvider";
import { Toaster } from "@/components/ui/sonner";
import Footer from "@/components/ui/footer";


export const metadata: Metadata = {
  title: "Eventz - Find Your Vibe",
  description: "A dynamic event management platform.",
  icons: {
    icon: "/EventZLogo.png",
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
        className={`bg-linear-to-br from-white via-gray-100 to-gray-200 text-black dark:from-gray-950 dark:via-zinc-900 dark:to-stone-900 dark:text-white`}
      >


        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* header  */}
          <ClerkClientProvider>
            <ConvexClientProvider>



              <Header />
              <main className="container mx-auto pt-40 md:pt-30 py-8 min-h-screen">
                {/* glow */}
                <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                  <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl" />
                  <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
                </div>

                <div className="relative z-10 min-h-[70vh]">
                  {children}
                </div>
                {/* footer  */}
                <footer className=" border-t border-gray-800/50 py-8 px-6 max-w-7xl mx-auto">
                  {/* <div className="text-sm text-gray-400">
                    &copy; {new Date().getFullYear()} Eventz. All rights reserved.
                  </div> */}
                  <Footer />
                  
                </footer>
                <Toaster position="top-center" richColors />
              </main>
            </ConvexClientProvider>
          </ClerkClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
