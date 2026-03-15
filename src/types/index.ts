import type { Database, Tables, TablesInsert } from './database.types'

// Category types
export type Category = Tables<'categories'>
export type CategoryInsert = TablesInsert<'categories'>
export type CategoryUpdate = Partial<CategoryInsert>

// Product types
export type Product = Tables<'products'>
export type ProductWithCategory = Product & {
  categories: Tables<'categories'> | null
}
export type ProductInsert = TablesInsert<'products'>
export type ProductUpdate = Partial<ProductInsert>

export interface ProductFilters {
  categorySlug?: string
  gender?: Product['gender']
  minPrice?: number
  maxPrice?: number
  frameShape?: Product['frame_shape']
  hasArOverlay?: boolean
  searchQuery?: string
}

// Order types
export type Order = Tables<'orders'>
export type OrderItem = Tables<'order_items'>
export type OrderWithItems = Order & {
  order_items: OrderItem[]
}
export type OrderInsert = TablesInsert<'orders'>
export type OrderDeliveryType = 'pickup' | 'delivery'
export type LensType = 'sin-lente' | 'monofocal' | 'bifocal' | 'progresivo' | 'solar'
export type LensFilterOption =
  | 'blue-light'
  | 'photochromic'
  | 'anti-reflective'
  | 'uv-protection'
  | 'polarized'
export type PrescriptionMode = 'manual' | 'pending'
export type PrescriptionEyeValues = {
  sphere?: string
  cylinder?: string
  axis?: string
}
export type PrescriptionData = {
  mode: PrescriptionMode
  rightEye: PrescriptionEyeValues
  leftEye: PrescriptionEyeValues
  pd?: string
  addPower?: string
  notes?: string
  legalConsent: boolean
  legalAcceptedAt?: string | null
}
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'ready'
  | 'delivered'
  | 'cancelled'

export interface CreateOrderInput {
  items: Array<{
    product_id: string
    product_name: OrderItem['product_name']
    product_image?: OrderItem['product_image']
    quantity: OrderItem['quantity']
    unit_price: OrderItem['unit_price']
    lens_type?: LensType
    lens_notes?: OrderItem['lens_notes']
    lens_filters?: LensFilterOption[]
    prescription?: PrescriptionData | null
  }>
  delivery_type: OrderDeliveryType
  delivery_address?: Order['delivery_address']
  notes?: Order['notes']
  customer_name: Order['customer_name']
  customer_phone: Order['customer_phone']
  customer_email?: Order['customer_email']
}

// Auth/profile types
export type Profile = Tables<'profiles'>
export type ProfileUpdate = Partial<TablesInsert<'profiles'>>
export type UserRole = ('customer' | 'admin') & Profile['role']

// Form types
export type LoginFormValues = {
  email: string
  password: string
}

export type RegisterFormValues = {
  email: string
  password: string
  confirmPassword: string
  full_name: string
  phone: string
}

export type DbTables = Database['public']['Tables']
