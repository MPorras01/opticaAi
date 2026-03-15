import { getAllOrders } from '@/lib/repositories/orders.repo'
import { AdminOrdersPage } from '@/modules/admin/orders-page'
import type { Order } from '@/types'

export const metadata = { title: 'Pedidos · Admin · OpticaAI' }

export default async function AdminOrdersRoute() {
  let orders: Order[] = []

  try {
    orders = await getAllOrders()
  } catch {
    orders = []
  }

  return <AdminOrdersPage orders={orders} />
}
