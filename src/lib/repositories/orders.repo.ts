import { createClient as createServerClient } from '@/lib/supabase/server'
import type { CreateOrderInput, Order, OrderItem, OrderStatus, OrderWithItems } from '@/types'

type WompiUpdateInput = {
  txId: string
  status: string
  paymentMethod: string
}

type OrderStats = {
  totalToday: number
  pendingCount: number
  totalThisMonth: number
  deliveredCount: number
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'object' && error !== null) {
    const message = Reflect.get(error, 'message')
    const details = Reflect.get(error, 'details')
    const hint = Reflect.get(error, 'hint')
    const code = Reflect.get(error, 'code')
    const parts = [message, details, hint, code].filter(
      (value): value is string => typeof value === 'string' && value.length > 0
    )

    if (parts.length > 0) {
      return parts.join(' | ')
    }
  }

  return 'Error desconocido'
}

/** Creates an order and its items using consecutive inserts. */
export async function createOrder(
  data: CreateOrderInput,
  userId?: string
): Promise<Pick<Order, 'id' | 'order_number'>> {
  let createdOrderId: string | null = null

  try {
    const supabase = await createServerClient()

    const subtotal = data.items.reduce((acc, item) => acc + item.quantity * item.unit_price, 0)
    const total = subtotal

    const { data: createdOrder, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: '',
        customer_id: userId ?? null,
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        customer_email: data.customer_email ?? null,
        delivery_type: data.delivery_type,
        delivery_address: data.delivery_address ?? null,
        notes: data.notes ?? null,
        subtotal,
        total,
      })
      .select('id, order_number')
      .single()

    if (orderError) {
      throw orderError
    }

    createdOrderId = createdOrder.id

    const orderItemsPayload = data.items.map((item) => ({
      order_id: createdOrder.id,
      product_id: item.product_id,
      product_name: item.product_name,
      product_image: item.product_image ?? null,
      quantity: item.quantity,
      unit_price: item.unit_price,
      lens_type: item.lens_type ?? null,
      lens_notes: item.lens_notes ?? null,
    }))

    const { error: itemsError } = await supabase.from('order_items').insert(orderItemsPayload)

    if (itemsError) {
      throw itemsError
    }

    return createdOrder as Pick<Order, 'id' | 'order_number'>
  } catch (error) {
    if (createdOrderId) {
      try {
        const admin = await createServerClient()
        await admin.from('orders').delete().eq('id', createdOrderId)
      } catch {
        // Best-effort rollback if item insertion fails.
      }
    }

    throw new Error(`No se pudo crear la orden: ${getErrorMessage(error)}`)
  }
}

/** Retrieves a single order with its nested items by id. */
export async function getOrderById(orderId: string): Promise<OrderWithItems> {
  try {
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single()

    if (error) {
      throw error
    }

    return {
      ...(data as Order),
      order_items: (data.order_items ?? []) as OrderItem[],
    }
  } catch (error) {
    throw new Error(`No se pudo obtener la orden: ${getErrorMessage(error)}`)
  }
}

/** Retrieves all orders for a customer ordered by created_at descending. */
export async function getOrdersByCustomer(customerId: string): Promise<OrderWithItems[]> {
  try {
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return (data ?? []).map((order) => ({
      ...(order as Order),
      order_items: (order.order_items ?? []) as OrderItem[],
    }))
  } catch (error) {
    throw new Error(`No se pudieron obtener las ordenes del cliente: ${getErrorMessage(error)}`)
  }
}

/** Updates the status of an order with admin privileges. */
export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
  try {
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    return data as Order
  } catch (error) {
    throw new Error(`No se pudo actualizar el estado de la orden: ${getErrorMessage(error)}`)
  }
}

/** Updates Wompi payment fields for an order from webhook data. */
export async function updateOrderPayment(
  orderId: string,
  wompiData: WompiUpdateInput
): Promise<Order> {
  try {
    const supabase = await createServerClient()

    const normalizedStatus = wompiData.status.toLowerCase()
    const mappedOrderStatus: OrderStatus = normalizedStatus === 'approved' ? 'confirmed' : 'pending'

    const { data, error } = await supabase
      .from('orders')
      .update({
        wompi_tx_id: wompiData.txId,
        wompi_status: wompiData.status,
        payment_method: wompiData.paymentMethod,
        status: mappedOrderStatus,
      })
      .eq('id', orderId)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    return data as Order
  } catch (error) {
    throw new Error(`No se pudo actualizar el pago de la orden: ${getErrorMessage(error)}`)
  }
}

/** Retrieves all orders with optional status filter using admin privileges. */
export async function getAllOrders(status?: OrderStatus): Promise<Order[]> {
  try {
    const supabase = await createServerClient()

    let query = supabase
      .from('orders')
      .select(
        'id, order_number, customer_name, customer_phone, customer_email, status, total, created_at, updated_at, channel, delivery_type, delivery_address, notes, subtotal, customer_id, payment_method, prescription_url, wompi_status, wompi_tx_id'
      )
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return (data ?? []) as Order[]
  } catch (error) {
    throw new Error(`No se pudieron obtener todas las ordenes: ${getErrorMessage(error)}`)
  }
}

/** Calculates high-level order stats for admin dashboards. */
export async function getOrderStats(): Promise<OrderStats> {
  try {
    const supabase = await createServerClient()

    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const startOfTomorrow = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    ).toISOString()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString()

    const [todayRes, pendingRes, monthRes, deliveredRes] = await Promise.all([
      supabase
        .from('orders')
        .select('total')
        .eq('status', 'confirmed')
        .gte('created_at', startOfToday)
        .lt('created_at', startOfTomorrow),
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase
        .from('orders')
        .select('total')
        .gte('created_at', startOfMonth)
        .lt('created_at', startOfNextMonth),
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'delivered')
        .gte('created_at', startOfMonth)
        .lt('created_at', startOfNextMonth),
    ])

    if (todayRes.error) throw todayRes.error
    if (pendingRes.error) throw pendingRes.error
    if (monthRes.error) throw monthRes.error
    if (deliveredRes.error) throw deliveredRes.error

    const totalToday = (todayRes.data ?? []).reduce((sum, row) => sum + Number(row.total ?? 0), 0)
    const totalThisMonth = (monthRes.data ?? []).reduce(
      (sum, row) => sum + Number(row.total ?? 0),
      0
    )

    return {
      totalToday,
      pendingCount: pendingRes.count ?? 0,
      totalThisMonth,
      deliveredCount: deliveredRes.count ?? 0,
    }
  } catch (error) {
    throw new Error(`No se pudieron calcular estadisticas de ordenes: ${getErrorMessage(error)}`)
  }
}
