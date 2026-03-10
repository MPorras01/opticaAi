import Link from 'next/link'
import { DM_Sans, Playfair_Display } from 'next/font/google'
import { Monitor, Phone, Store, TrendingUp } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { createClient as createServerClient } from '@/lib/supabase/server'

const dmSans = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '600'] })
const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['500', '600', '700'],
})

type MetricCardProps = {
  label: string
  value: string
  highlight?: boolean
  trendUp?: boolean
}

function MetricCard({ label, value, highlight, trendUp }: MetricCardProps) {
  return (
    <article className="rounded-xl border border-[#E8E2D8] bg-white p-5">
      <p
        className={
          dmSans.className + ' text-xs font-semibold tracking-[0.08em] text-[#7C7C74] uppercase'
        }
      >
        {label}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <p
          className={
            playfairDisplay.className +
            ` text-4xl font-semibold ${highlight ? 'text-[#D4A853]' : 'text-[#0F0F0D]'}`
          }
        >
          {value}
        </p>
        {trendUp ? <TrendingUp className="size-4 text-[#2D8C4A]" /> : null}
      </div>
    </article>
  )
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'confirmed':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'processing':
      return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'ready':
      return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'delivered':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

function ChannelIcon({ channel }: { channel: string }) {
  if (channel === 'whatsapp') {
    return <Phone className="size-4 text-[#0F0F0D]" />
  }
  if (channel === 'presencial') {
    return <Store className="size-4 text-[#0F0F0D]" />
  }
  return <Monitor className="size-4 text-[#0F0F0D]" />
}

function formatCOP(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)
}

export default async function AdminDashboardPage() {
  const supabase = await createServerClient()
  const todayIsoDate = new Date().toISOString().slice(0, 10)
  const yesterdayDate = new Date()
  yesterdayDate.setDate(yesterdayDate.getDate() - 1)
  const yesterdayIsoDate = yesterdayDate.toISOString().slice(0, 10)

  const [
    salesTodayRes,
    salesYesterdayRes,
    pendingOrdersRes,
    activeProductsRes,
    customersRes,
    latestOrdersRes,
    lowStockRes,
  ] = await Promise.all([
    supabase
      .from('orders')
      .select('total')
      .eq('status', 'confirmed')
      .gte('created_at', todayIsoDate),
    supabase
      .from('orders')
      .select('total')
      .eq('status', 'confirmed')
      .gte('created_at', yesterdayIsoDate)
      .lt('created_at', todayIsoDate),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
    supabase
      .from('orders')
      .select('order_number, customer_name, total, status, channel, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('products')
      .select('id, name, stock')
      .eq('is_active', true)
      .lt('stock', 5)
      .order('stock', { ascending: true })
      .limit(10),
  ])

  const salesToday = (salesTodayRes.data ?? []).reduce(
    (acc, row) => acc + Number(row.total ?? 0),
    0
  )
  const salesYesterday = (salesYesterdayRes.data ?? []).reduce(
    (acc, row) => acc + Number(row.total ?? 0),
    0
  )

  const pendingOrders = pendingOrdersRes.count ?? 0
  const activeProducts = activeProductsRes.count ?? 0
  const customers = customersRes.count ?? 0

  const latestOrders = latestOrdersRes.data ?? []
  const lowStockProducts = lowStockRes.data ?? []

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Ventas hoy"
          value={formatCOP(salesToday)}
          highlight
          trendUp={salesYesterday > 0 && salesToday > salesYesterday}
        />
        <MetricCard label="Pedidos pendientes" value={String(pendingOrders)} />
        <MetricCard label="Productos activos" value={String(activeProducts)} />
        <MetricCard label="Clientes totales" value={String(customers)} />
      </section>

      <section className="rounded-xl border border-[#E8E2D8] bg-white p-5">
        <h2 className={playfairDisplay.className + ' text-3xl font-semibold text-[#0F0F0D]'}>
          Ultimos pedidos
        </h2>

        <div className="mt-4 overflow-x-auto">
          <table className={dmSans.className + ' min-w-full text-sm'}>
            <thead>
              <tr className="border-b border-[#ECE7DE] text-left text-[#6F6F67]">
                <th className="py-2 pr-3"># Orden</th>
                <th className="py-2 pr-3">Cliente</th>
                <th className="py-2 pr-3">Total</th>
                <th className="py-2 pr-3">Estado</th>
                <th className="py-2 pr-3">Canal</th>
                <th className="py-2 pr-3">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {latestOrders.map((order) => (
                <tr key={order.order_number} className="border-b border-[#F3EFE7]">
                  <td className="py-2 pr-3 font-medium text-[#151510]">{order.order_number}</td>
                  <td className="py-2 pr-3">{order.customer_name}</td>
                  <td className="py-2 pr-3">{formatCOP(Number(order.total ?? 0))}</td>
                  <td className="py-2 pr-3">
                    <Badge className={getStatusBadgeClass(order.status)}>{order.status}</Badge>
                  </td>
                  <td className="py-2 pr-3">
                    <span className="inline-flex items-center gap-2">
                      <ChannelIcon channel={order.channel} />
                      {order.channel}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-[#66665F]">
                    {new Date(order.created_at).toLocaleDateString('es-CO')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-[#E8E2D8] bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className={playfairDisplay.className + ' text-3xl font-semibold text-[#0F0F0D]'}>
            Productos con stock bajo
          </h2>
        </div>

        <ul className={dmSans.className + ' mt-4 space-y-3'}>
          {lowStockProducts.length === 0 ? (
            <li className="text-sm text-[#6E6E67]">No hay productos con stock bajo.</li>
          ) : (
            lowStockProducts.map((product) => (
              <li
                key={product.id}
                className="flex items-center justify-between rounded-lg border border-[#EFEAE1] bg-[#FBF9F5] px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium text-[#151510]">{product.name}</p>
                  <p className="text-xs text-[#74746D]">Stock actual: {product.stock}</p>
                </div>
                <Link href={`/admin/productos/${product.id}`}>
                  <Button size="sm" variant="outline">
                    Editar
                  </Button>
                </Link>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  )
}
