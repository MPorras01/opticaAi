import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { getOrderById } from '@/lib/repositories/orders.repo'
import { OrderConfirmationPage } from '@public/order-confirmation-page'

export const metadata: Metadata = {
  title: 'Confirmación de pedido · OpticaAI',
}

type Params = Promise<{ orderId: string }>

export default async function PedidoRoute({ params }: { params: Params }) {
  const { orderId } = await params

  const order = await getOrderById(orderId).catch(() => null)

  if (!order) notFound()

  return <OrderConfirmationPage order={order} />
}
