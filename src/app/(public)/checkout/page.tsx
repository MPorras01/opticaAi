import type { Metadata } from 'next'

import { CheckoutPage } from '@public/checkout-page'

export const metadata: Metadata = {
  title: 'Finalizar pedido · OpticaAI',
  description: 'Completa tu pedido en OpticaAI',
}

export default function CheckoutRoute() {
  return <CheckoutPage />
}
