type PageShellProps = {
  title: string
  description: string
}

export function PageShell({ title, description }: PageShellProps) {
  return (
    <section className="mx-auto flex min-h-[70vh] w-full max-w-3xl flex-col items-start justify-center gap-4 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="max-w-2xl text-base text-zinc-600">{description}</p>
    </section>
  )
}
