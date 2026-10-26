import { useEffect, useState } from "react"
import { Header } from "@/components/sections/Header"
import { Hero } from "@/components/sections/Hero"
import { Compare, Fabric, Features, Uses } from "@/components/sections/Showcase"
import { Prices, type Estimate } from "@/components/sections/Prices"
import { Faq, Footer, Lead, MobileBar, Process } from "@/components/sections/Closing"

export default function App() {
  const [estimate, setEstimate] = useState<Estimate | null>(null)

  // Ссылка вида /#prices: браузер ищет якорь до того, как React отрисует страницу
  useEffect(() => {
    if (location.hash) document.querySelector(location.hash)?.scrollIntoView()
  }, [])

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-white">
        Перейти к содержанию
      </a>
      <Header />
      <main id="main">
        <Hero />
        <Compare />
        <Features />
        <Uses />
        <Fabric />
        <Prices onEstimate={setEstimate} />
        <Process />
        <Faq />
        <Lead estimate={estimate} />
      </main>
      <Footer />
      <MobileBar />
    </>
  )
}
