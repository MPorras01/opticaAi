'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function ProductDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[ProductDetail] Error:', error)
  }, [error])

  return (
    <main className="bg-[#FAF8F3] px-6 py-20 text-[#0F0F0D]">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-[#E6DECF] bg-white px-8 py-12 text-center shadow-[0_28px_80px_-56px_rgba(15,15,13,0.4)]">
        <p className="text-[11px] font-medium tracking-[0.18em] text-[#8A6A2F] uppercase">
          Catalogo
        </p>
        <h1 className="mt-4 text-4xl font-semibold">Error al cargar el producto</h1>
        <p className="mt-4 text-sm leading-7 text-[#66665F]">
          Ocurrio un error inesperado. Puedes intentar de nuevo o volver al catalogo.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-11 items-center justify-center rounded-full bg-[#D4A853] px-6 text-sm font-semibold text-[#0F0F0D] transition hover:bg-[#C79D4C]"
          >
            Intentar de nuevo
          </button>
          <Link
            href="/catalogo"
            className="inline-flex h-11 items-center justify-center rounded-full border border-[#E6DECF] px-6 text-sm font-semibold text-[#0F0F0D] transition hover:bg-[#F6F2EA]"
          >
            Volver al catalogo
          </Link>
        </div>
      </div>
    </main>
  )
}
