'use server'

import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

import { siteConfig } from '@/config/site.config'
import {
  SESSION_ABSOLUTE_TTL_MS,
  SESSION_IDLE_TTL_MS,
  SESSION_LAST_ACTIVITY_COOKIE,
  SESSION_STARTED_COOKIE,
  getSessionCookieOptions,
} from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { isValidColombianPhone } from '@/lib/utils/validators'

type ActionResult<T> = {
  success: boolean
  data?: T
  error?: string
}

type RegisterInput = {
  full_name: string
  email: string
  phone: string
  password: string
}

type UpdateProfileInput = {
  full_name: string
  phone: string
  address?: string
  city?: string
}

type ResetPasswordInput = {
  currentPassword: string
  newPassword: string
}

export type AuthUser = {
  id: string
  email: string
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Error desconocido'
}

function isStrongPassword(password: string): boolean {
  return (
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password) &&
    password.length >= 10
  )
}

async function setSessionStartedCookie() {
  const cookieStore = await cookies()
  const now = String(Date.now())
  cookieStore.set(
    SESSION_STARTED_COOKIE,
    now,
    getSessionCookieOptions(Math.floor(SESSION_ABSOLUTE_TTL_MS / 1000))
  )
  cookieStore.set(
    SESSION_LAST_ACTIVITY_COOKIE,
    now,
    getSessionCookieOptions(Math.floor(SESSION_IDLE_TTL_MS / 1000))
  )
}

async function clearSessionStartedCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_STARTED_COOKIE)
  cookieStore.delete(SESSION_LAST_ACTIVITY_COOKIE)
}

async function createEphemeralSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase server environment variables')
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function signInWithPasswordAction(
  email: string,
  password: string
): Promise<ActionResult<AuthUser>> {
  try {
    const supabase = await createServerClient()
    const normalizedEmail = email.trim().toLowerCase()

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    })

    if (error) {
      return { success: false, error: 'Credenciales invalidas' }
    }

    if (!data.user?.email) {
      throw new Error('No se pudo autenticar el usuario')
    }

    await setSessionStartedCookie()

    return {
      success: true,
      data: {
        id: data.user.id,
        email: data.user.email,
      },
    }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function loginAction(
  email: string,
  password: string
): Promise<ActionResult<AuthUser>> {
  return signInWithPasswordAction(email, password)
}

export async function signUpAction(
  email: string,
  password: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = await createServerClient()
    const normalizedEmail = email.trim().toLowerCase()

    if (!isStrongPassword(password)) {
      return {
        success: false,
        error:
          'La contrasena debe tener minimo 10 caracteres, mayuscula, minuscula, numero y simbolo.',
      }
    }

    const { data, error } = await supabase.auth.signUp({ email: normalizedEmail, password })

    if (error) {
      throw error
    }

    if (!data.user?.id) {
      throw new Error('No se pudo crear el usuario')
    }

    return {
      success: true,
      data: {
        id: data.user.id,
      },
    }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function registerAction(input: RegisterInput): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = await createServerClient()
    const email = input.email.trim().toLowerCase()
    const fullName = input.full_name.trim()
    const phone = input.phone.trim()

    if (fullName.length < 3) {
      return { success: false, error: 'El nombre es demasiado corto' }
    }

    if (!isValidColombianPhone(phone)) {
      return { success: false, error: 'El numero de telefono no es valido' }
    }

    if (!isStrongPassword(input.password)) {
      return {
        success: false,
        error:
          'La contrasena debe tener minimo 10 caracteres, mayuscula, minuscula, numero y simbolo.',
      }
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password: input.password,
      options: {
        data: {
          full_name: fullName,
          phone,
        },
      },
    })

    if (error) {
      throw error
    }

    if (!data.user?.id) {
      throw new Error('No se pudo crear el usuario')
    }

    return {
      success: true,
      data: {
        id: data.user.id,
      },
    }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function signOutAction(): Promise<ActionResult<null>> {
  try {
    const supabase = await createServerClient()

    const { error } = await supabase.auth.signOut()

    if (error) {
      throw error
    }

    await clearSessionStartedCookie()

    return { success: true, data: null }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function updateProfileAction(
  input: UpdateProfileInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'Debes iniciar sesion nuevamente' }
    }

    const fullName = input.full_name.trim()
    const phone = input.phone.trim()

    if (fullName.length < 3) {
      return { success: false, error: 'El nombre es demasiado corto' }
    }

    if (!isValidColombianPhone(phone)) {
      return { success: false, error: 'El numero de telefono no es valido' }
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        phone,
        address: input.address?.trim() || null,
        city: input.city?.trim() || 'Colombia',
      })
      .eq('id', user.id)

    if (error) {
      throw error
    }

    return { success: true, data: { id: user.id } }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function updatePasswordAction(input: ResetPasswordInput): Promise<ActionResult<null>> {
  try {
    if (!isStrongPassword(input.newPassword)) {
      return {
        success: false,
        error:
          'La contrasena debe tener minimo 10 caracteres, mayuscula, minuscula, numero y simbolo.',
      }
    }

    const supabase = await createServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user?.email) {
      return { success: false, error: 'Debes iniciar sesion nuevamente' }
    }

    const verificationClient = await createEphemeralSupabaseClient()
    const { error: signInError } = await verificationClient.auth.signInWithPassword({
      email: user.email,
      password: input.currentPassword,
    })

    if (signInError) {
      return { success: false, error: 'La contrasena actual no es correcta' }
    }

    if (input.currentPassword === input.newPassword) {
      return {
        success: false,
        error: 'La nueva contrasena debe ser diferente a la actual',
      }
    }

    const { error } = await supabase.auth.updateUser({ password: input.newPassword })

    if (error) {
      throw error
    }

    return { success: true, data: null }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function requestPasswordResetAction(email: string): Promise<ActionResult<null>> {
  try {
    const supabase = await createServerClient()
    const normalizedEmail = email.trim().toLowerCase()

    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${siteConfig.url}/restablecer-contrasena`,
    })

    if (error) {
      throw error
    }

    return { success: true, data: null }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function createTestUserAction(): Promise<
  ActionResult<{ email: string; password: string }>
> {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'Debes iniciar sesion como administrador' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return { success: false, error: 'Solo administradores pueden crear usuarios de prueba' }
    }

    const adminClient = createAdminClient()
    const testEmail = 'cliente.pruebas@opticaai.local'
    const testPassword = 'OpticaAI.Test.2026!'

    const listedUsers = await adminClient.auth.admin.listUsers({ page: 1, perPage: 200 })
    const existingUser = listedUsers.data.users.find(
      (authUser) => authUser.email?.toLowerCase() === testEmail
    )

    const authUserId = existingUser?.id
      ? existingUser.id
      : (
          await adminClient.auth.admin.createUser({
            email: testEmail,
            password: testPassword,
            email_confirm: true,
            user_metadata: {
              full_name: 'Cliente de Pruebas',
              phone: '3001234567',
            },
          })
        ).data.user?.id

    if (!authUserId) {
      throw new Error('No se pudo crear el usuario de prueba')
    }

    const { error: profileError } = await adminClient.from('profiles').upsert({
      id: authUserId,
      full_name: 'Cliente de Pruebas',
      phone: '3001234567',
      city: 'Bogota',
      address: 'Carrera 11 # 93-12',
      role: 'customer',
    })

    if (profileError) {
      throw profileError
    }

    return {
      success: true,
      data: {
        email: testEmail,
        password: testPassword,
      },
    }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function getCurrentUserAction(): Promise<ActionResult<AuthUser | null>> {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      throw error
    }

    if (!user?.email) {
      return { success: true, data: null }
    }

    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
      },
    }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}
