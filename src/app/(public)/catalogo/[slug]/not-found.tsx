import Link from 'next/link'

export default function ProductNotFound() {
  return (
    <main className="bg-[#FAF8F3] px-6 py-20 text-[#0F0F0D]">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-[#E6DECF] bg-white px-8 py-12 text-center shadow-[0_28px_80px_-56px_rgba(15,15,13,0.4)]">
        <p className="text-[11px] font-medium tracking-[0.18em] text-[#8A6A2F] uppercase">
          Catalogo
        </p>
        <h1 className="mt-4 text-4xl font-semibold">Este producto no esta disponible</h1>
        <p className="mt-4 text-sm leading-7 text-[#66665F]">
          El enlace puede haber cambiado o el producto ya no esta activo. Puedes volver al catalogo
          y seguir explorando otras monturas.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/catalogo"
            className="inline-flex h-11 items-center justify-center rounded-full bg-[#D4A853] px-6 text-sm font-semibold text-[#0F0F0D] transition hover:bg-[#C79D4C]"
          >
            Volver al catalogo
          </Link>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-full border border-[#E6DECF] px-6 text-sm font-semibold text-[#0F0F0D] transition hover:bg-[#F6F2EA]"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </main>
  )
}
