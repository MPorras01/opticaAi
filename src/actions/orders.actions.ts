'use server'

import { revalidatePath } from 'next/cache'
import { createClient as createServerClient } from '@/lib/supabase/server'
import {
  createOrder,
  getAllOrders,
  getOrderById,
  getOrdersByCustomer,
  getOrderStats,
  updateOrderPayment,
  updateOrderStatus,
} from '@/lib/repositories/orders.repo'
import type { CreateOrderInput, Order, OrderStatus, OrderWithItems } from '@/types'

type ActionResult<T> = {
  success: boolean
  data?: T
  error?: string
}

type WompiUpdateInput = {
  txId: string
  status: string
  paymentMethod: string
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'object' && error !== null) {
    const message = Reflect.get(error, 'message')
    const details = Reflect.get(error, 'details')
    const hint = Reflect.get(error, 'hint')
    const parts = [message, details, hint].filter(
      (value): value is string => typeof value === 'string' && value.length > 0
    )

    if (parts.length > 0) {
      return parts.join(' | ')
    }
  }

  return 'Error desconocido'
}

export async function createOrderAction(
  input: CreateOrderInput
): Promise<ActionResult<{ id: string; order_number: string }>> {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const data = await createOrder(input, user?.id)

    revalidatePath('/(dashboard)/admin/pedidos')

    return { success: true, data }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function getOrderByIdAction(orderId: string): Promise<ActionResult<OrderWithItems>> {
  try {
    const data = await getOrderById(orderId)
    return { success: true, data }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function getMyOrdersAction(): Promise<ActionResult<OrderWithItems[]>> {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      throw error
    }

    if (!user) {
      throw new Error('No autorizado')
    }

    const data = await getOrdersByCustomer(user.id)
    return { success: true, data }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function getAllOrdersAction(status?: OrderStatus): Promise<ActionResult<Order[]>> {
  try {
    const data = await getAllOrders(status)
    return { success: true, data }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function updateOrderStatusAction(
  orderId: string,
  status: OrderStatus
): Promise<ActionResult<Order>> {
  try {
    const data = await updateOrderStatus(orderId, status)

    revalidatePath('/(dashboard)/admin/pedidos')

    return { success: true, data }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function updateOrderPaymentAction(
  orderId: string,
  wompiData: WompiUpdateInput
): Promise<ActionResult<Order>> {
  try {
    const data = await updateOrderPayment(orderId, wompiData)

    revalidatePath('/(dashboard)/admin/pedidos')
    revalidatePath('/(public)/pedido')

    return { success: true, data }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function getOrderStatsAction(): Promise<
  ActionResult<{
    totalToday: number
    pendingCount: number
    totalThisMonth: number
    deliveredCount: number
  }>
> {
  try {
    const data = await getOrderStats()
    return { success: true, data }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}
