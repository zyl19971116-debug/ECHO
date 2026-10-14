import "./globals.css"; import { Inter, Space_Grotesk } from "next/font/google"; import { Providers } from "@/components/providers"; import { Header } from "@/components/header";
const inter=Inter({subsets:["latin"],variable:"--font-inter"}); const space=Space_Grotesk({subsets:["latin"],variable:"--font-space"});
export const metadata={title:"ECHO MARKET — Ideas Have No Names",description:"Anonymous AI creative competition on Robinhood Chain"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body className={`${inter.variable} ${space.variable}`}><Providers><Header/>{children}</Providers></body></html>}
