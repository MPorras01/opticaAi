'use server'

import { createClient as createServerClient } from '@/lib/supabase/server'

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

export type AuthUser = {
  id: string
  email: string
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Error desconocido'
}

export async function signInWithPasswordAction(
  email: string,
  password: string
): Promise<ActionResult<AuthUser>> {
  try {
    const supabase = await createServerClient()

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      throw error
    }

    if (!data.user?.email) {
      throw new Error('No se pudo autenticar el usuario')
    }

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

    const { data, error } = await supabase.auth.signUp({ email, password })

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

    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          full_name: input.full_name,
          phone: input.phone,
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

    return { success: true, data: null }
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
