import Image from 'next/image'
import Link from 'next/link'
import { DM_Sans, Playfair_Display } from 'next/font/google'
import { ArrowRight, MessageCircle } from 'lucide-react'

import { siteConfig } from '@/config/site.config'
import { getCategories, getFeaturedProducts } from '@/lib/repositories'
import { cn, formatCOP } from '@/lib/utils'
import type { Category, Product } from '@/types'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
})

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['500', '600', '700'],
})

const categoryBackgroundClasses = ['bg-[#E9DDD0]', 'bg-[#D8DFEB]', 'bg-[#E5D7D2]', 'bg-[#DCE5DC]']

const steps = [
  { number: '01', icon: '🕶️', title: 'Elige tu montura' },
  { number: '02', icon: '📋', title: 'Trae tu formula' },
  { number: '03', icon: '✅', title: 'Recoge listo' },
]

export async function HomePage() {
  let categories: Category[] = []
  let featuredProducts: Product[] = []

  try {
    ;[categories, featuredProducts] = await Promise.all([getCategories(), getFeaturedProducts(6)])
  } catch {
    categories = []
    featuredProducts = []
  }

  const whatsappNumber = siteConfig.whatsapp.number.replace(/\D/g, '')
  const whatsappHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(siteConfig.whatsapp.message)}`

  return (
    <div className="bg-[#FAFAF8] text-[#0F0F0D]">
      <section className="relative isolate overflow-hidden">
        <div className="mx-auto grid min-h-[100svh] w-full max-w-[1280px] items-center gap-12 px-4 py-12 md:grid-cols-2 md:px-8 md:py-20">
          <div className="space-y-8">
            <h1
              className={cn(
                playfairDisplay.className,
                'hero-reveal hero-delay-1 text-5xl leading-[0.96] font-semibold tracking-tight md:text-8xl'
              )}
            >
              Ve el mundo con otro estilo
            </h1>

            <p
              className={cn(
                dmSans.className,
                'hero-reveal hero-delay-2 max-w-xl text-lg leading-relaxed text-[#3A3A36] md:text-xl'
              )}
            >
              Encuentra tu montura perfecta y pruebatela virtualmente desde casa
            </p>

            <div className="hero-reveal hero-delay-3 flex flex-wrap items-center gap-3">
              <Link
                href="/probador-virtual"
                className={cn(
                  dmSans.className,
                  'inline-flex items-center rounded-full bg-[#D4A853] px-5 py-2.5 text-sm font-semibold text-[#0F0F0D] shadow-[0_18px_36px_-20px_rgba(212,168,83,0.95)] transition duration-300 hover:scale-[1.02] hover:shadow-[0_22px_44px_-20px_rgba(212,168,83,1)] md:px-6 md:py-3'
                )}
              >
                Probarme unas gafas
              </Link>

              <Link
                href="/catalogo"
                className={cn(
                  dmSans.className,
                  'inline-flex items-center rounded-full border border-[#0F0F0D] px-5 py-2.5 text-sm font-medium text-[#0F0F0D] transition duration-300 hover:scale-[1.02] hover:bg-[#F0EDE6] md:px-6 md:py-3'
                )}
              >
                Ver catalogo
              </Link>
            </div>
          </div>

          <div className="relative hidden md:flex md:justify-end">
            <div className="pointer-events-none absolute top-1/2 left-1/2 -z-10 size-[460px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#E8E3D9] blur-[60px]" />
            <div className="hero-reveal hero-delay-4 w-full max-w-[430px] -rotate-2 rounded-[2rem] border border-[#E2DDD6] bg-gradient-to-b from-[#F0EDE6] to-[#E7E1D6] p-4 shadow-[0_42px_70px_-40px_rgba(15,15,13,0.45)]">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem] border border-[#E2DDD6]/70 bg-[#EFEAE0]">
                <Image
                  src="/placeholder.svg"
                  alt="Guía visual para subir tu foto"
                  fill
                  className="object-cover opacity-70"
                  sizes="(min-width: 768px) 430px, 100vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F0D]/18 via-transparent to-transparent" />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center">
                  <div className="rounded-full border border-[#D4A853]/60 bg-white/80 px-4 py-1.5 text-xs font-semibold tracking-[0.18em] text-[#8A6A2F] uppercase backdrop-blur">
                    Probador virtual
                  </div>
                  <div className={cn(playfairDisplay.className, 'text-3xl font-semibold text-[#0F0F0D]')}>
                    Tu foto aquí
                  </div>
                  <p className={cn(dmSans.className, 'max-w-[16rem] text-sm leading-6 text-[#4B4B44]')}>
                    Sube una selfie frontal y prueba monturas en segundos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1280px] px-4 py-18 md:px-8">
        <h2 className={cn(playfairDisplay.className, 'text-4xl leading-tight font-semibold md:text-5xl')}>
          Encuentra tu estilo
        </h2>

        <div className="mt-8 grid grid-cols-2 gap-3 md:mt-10 md:grid-cols-4 md:gap-5">
          {categories.map((category, index) => (
            <Link
              key={category.id}
              href={`/catalogo?category=${category.slug}`}
              className={cn(
                'group rounded-2xl border border-[#E2DDD6] p-2 shadow-[0_14px_36px_-28px_rgba(15,15,13,0.4)] transition duration-300 hover:scale-[1.03] hover:shadow-[0_24px_54px_-26px_rgba(15,15,13,0.5)]',
                categoryBackgroundClasses[index % categoryBackgroundClasses.length]
              )}
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-xl border border-[#E2DDD6]/70 bg-[#F4F1EA]">
                <Image
                  src={category.image_url ?? '/placeholder.svg'}
                  alt={category.name}
                  fill
                  className="object-cover transition duration-300 group-hover:scale-[1.04]"
                  sizes="(min-width: 768px) 25vw, 50vw"
                />
              </div>
              <div className="flex items-center justify-between p-2.5">
                <span className={cn(dmSans.className, 'text-sm font-semibold md:text-base')}>
                  {category.name}
                </span>
                <span className="text-lg transition-transform duration-300 group-hover:translate-x-1">→</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1280px] px-4 py-18 md:px-8">
        <h2 className={cn(playfairDisplay.className, 'text-4xl leading-tight font-semibold md:text-5xl')}>
          Lo mas nuevo
        </h2>
        <p className={cn(dmSans.className, 'mt-2 text-base text-[#5A5A53]')}>
          Monturas seleccionadas para ti
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3 md:mt-10 md:grid-cols-3 md:gap-5">
          {featuredProducts.map((product) => (
            <Link
              key={product.id}
              href={`/catalogo/${product.slug}`}
              className="group rounded-2xl border border-[#E2DDD6] bg-[#F0EDE6] p-2 shadow-[0_14px_36px_-28px_rgba(15,15,13,0.35)] transition duration-300 hover:scale-[1.03] hover:shadow-[0_24px_54px_-26px_rgba(15,15,13,0.5)]"
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-xl border border-[#E2DDD6]/70 bg-[#ECE7DD]">
                <Image
                  src={product.images[0] ?? '/placeholder.svg'}
                  alt={product.name}
                  fill
                  className="object-cover transition duration-300 group-hover:scale-[1.03]"
                  sizes="(min-width: 768px) 33vw, 50vw"
                />
              </div>
              <div className="space-y-1 p-2.5">
                <h3 className={cn(dmSans.className, 'line-clamp-1 text-sm font-semibold md:text-base')}>
                  {product.name}
                </h3>
                <p className={cn(dmSans.className, 'text-sm font-medium text-[#D4A853]')}>
                  {formatCOP(product.price)}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 flex justify-center md:mt-10">
          <Link
            href="/catalogo"
            className={cn(
              dmSans.className,
              'inline-flex items-center rounded-full border border-[#0F0F0D] px-6 py-3 text-sm font-medium transition duration-300 hover:scale-[1.02] hover:bg-[#F0EDE6]'
            )}
          >
            Ver todo el catalogo
          </Link>
        </div>
      </section>

      <section className="bg-[#0F0F0D] text-[#FAFAF8]">
        <div className="mx-auto grid w-full max-w-[1280px] gap-10 px-4 py-16 md:grid-cols-2 md:items-center md:px-8">
          <div className="space-y-4">
            <h2 className={cn(playfairDisplay.className, 'text-4xl leading-tight font-semibold md:text-5xl')}>
              Pruebate las gafas sin salir de casa
            </h2>
            <p className={cn(dmSans.className, 'max-w-xl text-[#CACAC2]')}>
              Activa nuestro probador virtual y descubre en segundos cual montura te favorece mas
              antes de comprar.
            </p>
            <Link
              href="/probador-virtual"
              className={cn(
                dmSans.className,
                'inline-flex items-center gap-2 rounded-full bg-[#D4A853] px-5 py-2.5 text-sm font-semibold text-[#0F0F0D] transition duration-300 hover:scale-[1.02] hover:bg-[#C79D4C]'
              )}
            >
              Probar ahora <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="flex items-center justify-center md:justify-end">
            <div className={cn(playfairDisplay.className, 'text-8xl md:text-9xl')} aria-hidden="true">
              👓
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#F0EDE6]">
        <div className="mx-auto w-full max-w-[1280px] px-4 py-16 md:px-8 md:py-20">
          <h2 className={cn(playfairDisplay.className, 'text-4xl leading-tight font-semibold md:text-5xl')}>
            Asi de facil
          </h2>

          <div className="relative mt-10 grid gap-8 md:mt-12 md:grid-cols-3 md:gap-10">
            <div className="pointer-events-none absolute top-11 left-[16.66%] hidden h-px w-[66.66%] bg-[#D4A853]/50 md:block" />

            {steps.map((step) => (
              <article key={step.number} className="relative rounded-2xl border border-[#E2DDD6] bg-[#FAFAF8] p-6 shadow-[0_18px_38px_-32px_rgba(15,15,13,0.42)]">
                <p className={cn(playfairDisplay.className, 'text-4xl leading-none font-semibold text-[#D4A853]')}>
                  {step.number}
                </p>
                <p className="mt-3 text-3xl" aria-hidden="true">
                  {step.icon}
                </p>
                <h3 className={cn(dmSans.className, 'mt-4 text-lg font-semibold text-[#0F0F0D]')}>
                  {step.title}
                </h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#D4A853]">
        <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-4 py-12 md:flex-row md:items-center md:justify-between md:px-8 md:py-14">
          <div>
            <h2 className={cn(playfairDisplay.className, 'text-4xl leading-tight font-semibold text-[#0F0F0D] md:text-5xl')}>
              Prefieres pedir por WhatsApp?
            </h2>
            <p className={cn(dmSans.className, 'mt-2 text-base text-[#31270F] md:text-lg')}>
              Escribenos y te asesoramos en minutos
            </p>
          </div>

          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            className={cn(
              dmSans.className,
              'inline-flex items-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-sm font-semibold text-[#0F0F0D] shadow-[0_18px_40px_-24px_rgba(15,15,13,0.5)] transition duration-300 hover:scale-[1.02] hover:bg-[#1EB85A]'
            )}
          >
            <MessageCircle className="size-4" />
            Pedir por WhatsApp
          </a>
        </div>
      </section>
    </div>
  )
}
