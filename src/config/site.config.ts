const siteConfig = {
  name: 'OpticaAI',
  description:
    'OpticaAI es una optica colombiana con catalogo digital, probador virtual y proceso de compra en linea.',
  url: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  whatsapp: {
    number: '57',
    message: 'Hola, quiero asesoria para elegir mis gafas en OpticaAI.',
  },
  social: {
    instagram: '',
    facebook: '',
  },
  business: {
    address: 'Direccion principal por definir',
    city: 'Colombia',
    schedule: 'Lunes a sabado 9:00 a.m. - 7:00 p.m.',
  },
} as const

export type SiteConfig = typeof siteConfig

export { siteConfig }
