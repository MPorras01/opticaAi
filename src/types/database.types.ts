export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.1'
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          slug?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          lens_notes: string | null
          lens_type: string | null
          order_id: string
          product_id: string | null
          product_image: string | null
          product_name: string
          quantity: number
          subtotal: number | null
          unit_price: number
        }
        Insert: {
          id?: string
          lens_notes?: string | null
          lens_type?: string | null
          order_id: string
          product_id?: string | null
          product_image?: string | null
          product_name: string
          quantity?: number
          subtotal?: number | null
          unit_price: number
        }
        Update: {
          id?: string
          lens_notes?: string | null
          lens_type?: string | null
          order_id?: string
          product_id?: string | null
          product_image?: string | null
          product_name?: string
          quantity?: number
          subtotal?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: 'order_items_order_id_fkey'
            columns: ['order_id']
            isOneToOne: false
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'order_items_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
        ]
      }
      orders: {
        Row: {
          channel: string
          created_at: string
          customer_email: string | null
          customer_id: string | null
          customer_name: string
          customer_phone: string
          delivery_address: string | null
          delivery_type: string
          id: string
          notes: string | null
          order_number: string
          payment_method: string | null
          prescription_url: string | null
          status: string
          subtotal: number
          total: number
          updated_at: string
          wompi_status: string | null
          wompi_tx_id: string | null
        }
        Insert: {
          channel?: string
          created_at?: string
          customer_email?: string | null
          customer_id?: string | null
          customer_name: string
          customer_phone: string
          delivery_address?: string | null
          delivery_type?: string
          id?: string
          notes?: string | null
          order_number: string
          payment_method?: string | null
          prescription_url?: string | null
          status?: string
          subtotal: number
          total: number
          updated_at?: string
          wompi_status?: string | null
          wompi_tx_id?: string | null
        }
        Update: {
          channel?: string
          created_at?: string
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string
          delivery_address?: string | null
          delivery_type?: string
          id?: string
          notes?: string | null
          order_number?: string
          payment_method?: string | null
          prescription_url?: string | null
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          wompi_status?: string | null
          wompi_tx_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'orders_customer_id_fkey'
            columns: ['customer_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      prescriptions: {
        Row: {
          add_power: number | null
          created_at: string
          customer_id: string | null
          doctor_name: string | null
          id: string
          image_url: string
          issued_date: string | null
          notes: string | null
          od_axis: number | null
          od_cylinder: number | null
          od_sphere: number | null
          order_id: string | null
          os_axis: number | null
          os_cylinder: number | null
          os_sphere: number | null
          pd: number | null
        }
        Insert: {
          add_power?: number | null
          created_at?: string
          customer_id?: string | null
          doctor_name?: string | null
          id?: string
          image_url: string
          issued_date?: string | null
          notes?: string | null
          od_axis?: number | null
          od_cylinder?: number | null
          od_sphere?: number | null
          order_id?: string | null
          os_axis?: number | null
          os_cylinder?: number | null
          os_sphere?: number | null
          pd?: number | null
        }
        Update: {
          add_power?: number | null
          created_at?: string
          customer_id?: string | null
          doctor_name?: string | null
          id?: string
          image_url?: string
          issued_date?: string | null
          notes?: string | null
          od_axis?: number | null
          od_cylinder?: number | null
          od_sphere?: number | null
          order_id?: string | null
          os_axis?: number | null
          os_cylinder?: number | null
          os_sphere?: number | null
          pd?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'prescriptions_customer_id_fkey'
            columns: ['customer_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'prescriptions_order_id_fkey'
            columns: ['order_id']
            isOneToOne: false
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
        ]
      }
      products: {
        Row: {
          ar_overlay_url: string | null
          brand: string | null
          category_id: string | null
          color: string | null
          compare_at_price: number | null
          created_at: string
          description: string | null
          frame_shape: string | null
          gender: string | null
          has_ar_overlay: boolean
          id: string
          images: string[]
          is_active: boolean
          material: string | null
          metadata: Json
          name: string
          price: number
          slug: string
          stock: number
          updated_at: string
        }
        Insert: {
          ar_overlay_url?: string | null
          brand?: string | null
          category_id?: string | null
          color?: string | null
          compare_at_price?: number | null
          created_at?: string
          description?: string | null
          frame_shape?: string | null
          gender?: string | null
          has_ar_overlay?: boolean
          id?: string
          images?: string[]
          is_active?: boolean
          material?: string | null
          metadata?: Json
          name: string
          price: number
          slug: string
          stock?: number
          updated_at?: string
        }
        Update: {
          ar_overlay_url?: string | null
          brand?: string | null
          category_id?: string | null
          color?: string | null
          compare_at_price?: number | null
          created_at?: string
          description?: string | null
          frame_shape?: string | null
          gender?: string | null
          has_ar_overlay?: boolean
          id?: string
          images?: string[]
          is_active?: boolean
          material?: string | null
          metadata?: Json
          name?: string
          price?: number
          slug?: string
          stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'products_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          city: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          role: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
