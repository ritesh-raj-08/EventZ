import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";


export default function Home() {
  return (
    <main>
      <section className="pb-16 relative overflow-hidden ">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative z-10 ">
          {/* left  */}
          <div className="text-center lg:text-left">

            <span className="text-gray-500 font-light tracking-wide mb-6">
              EventZ
              <span className="text-purple-600 font-semibold">✌️</span>
            </span>

            <h1 className=" text-5xl sm:text-6xl md:text-7xl font-bold mb-6 leading-[0.95] tracking-tight">
              Because Every Event Deserves <br />

              the
              <span className=" bg-linear-to-r from-purple-600 via-gray-400 to-orange-400 bg-clip-text text-transparent font-semibold"> Spotlight </span> <br />
            </h1>

            <p className="text-lg sm:text-xl max-w-lg mb-12 font-light text-gray-600 mt-4 ">
              More than event management, it’s the art of meaningful experiences,
              crafted thoughtfully so every moment feels just right.
            </p>

            <Link href="/explore">
              <Button size="lg">Explore Events</Button>
            </Link>

          </div>

          {/* right  */}
          <div className="flex justify-center">
            <Image
              src="/hero.png"
              alt="Home Illustration"
              width={600}
              height={600}
              className=""
              priority
            />
          </div>
        </div>
      </section>
    </main>
  );
}
