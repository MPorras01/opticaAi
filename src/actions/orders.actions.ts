'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
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

function toSlug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function getFileExtension(file: File): string {
  const explicit = file.name.split('.').pop()?.toLowerCase()
  if (explicit) {
    return explicit
  }

  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/webp') return 'webp'
  return 'jpg'
}

export async function uploadPrescriptionImageAction(
  file: File,
  productSlug: string
): Promise<ActionResult<{ path: string; fileName: string }>> {
  try {
    if (!file || file.size === 0) {
      throw new Error('Archivo de fórmula inválido')
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error('La fórmula no puede superar 5MB')
    }

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      throw new Error('La fórmula debe estar en PNG, JPG o WEBP')
    }

    const supabase = createAdminClient()
    const safeSlug = toSlug(productSlug || 'producto')
    const extension = getFileExtension(file)
    const fileName = `${safeSlug}-formula-${Date.now()}.${extension}`
    const path = `intake/${new Date().getFullYear()}/${fileName}`

    const { error } = await supabase.storage.from('prescriptions').upload(path, file, {
      contentType: file.type,
      upsert: false,
    })

    if (error) {
      throw error
    }

    return { success: true, data: { path, fileName: file.name } }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
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
