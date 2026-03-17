'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { registerAction } from '@/actions/auth.actions'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { isValidColombianPhone } from '@/lib/utils/validators'

const registerSchema = z
  .object({
    full_name: z.string().min(3, 'Nombre muy corto'),
    email: z.string().email('Correo invalido'),
    phone: z.string().refine((value) => isValidColombianPhone(value), 'Numero colombiano invalido'),
    password: z
      .string()
      .min(10, 'La contrasena debe tener minimo 10 caracteres')
      .regex(/[A-Z]/, 'La contrasena debe incluir al menos 1 mayuscula')
      .regex(/[a-z]/, 'La contrasena debe incluir al menos 1 minuscula')
      .regex(/\d/, 'La contrasena debe incluir al menos 1 numero')
      .regex(/[^A-Za-z0-9]/, 'La contrasena debe incluir al menos 1 simbolo'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contrasenas no coinciden',
    path: ['confirmPassword'],
  })

type RegisterFormValues = z.infer<typeof registerSchema>

type RegisterPageProps = {
  redirectTo?: string
}

type PasswordStrength = {
  label: 'debil' | 'media' | 'fuerte'
  className: string
}

function getPasswordStrength(password: string): PasswordStrength {
  const hasUpper = /[A-Z]/.test(password)
  const hasLower = /[a-z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSymbol = /[^A-Za-z0-9]/.test(password)
  const score = [hasUpper, hasLower, hasNumber, hasSymbol].filter(Boolean).length

  if (password.length >= 12 && score >= 4) {
    return { label: 'fuerte', className: 'text-green-600' }
  }

  if (password.length >= 10 && score >= 3) {
    return { label: 'media', className: 'text-amber-600' }
  }

  return { label: 'debil', className: 'text-red-600' }
}

export function RegisterPage({ redirectTo }: RegisterPageProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  })

  const passwordValue = useWatch({
    control: form.control,
    name: 'password',
    defaultValue: '',
  })

  const passwordStrength = getPasswordStrength(passwordValue)

  async function onSubmit(values: RegisterFormValues) {
    setFormError(null)
    setIsLoading(true)

    const result = await registerAction({
      full_name: values.full_name,
      email: values.email,
      phone: values.phone,
      password: values.password,
    })

    setIsLoading(false)

    if (!result.success) {
      setFormError(result.error ?? 'No se pudo completar el registro')
      return
    }

    const query = new URLSearchParams({ registered: 'true' })
    if (redirectTo) {
      query.set('redirectTo', redirectTo)
    }

    router.push(`/login?${query.toString()}`)
    router.refresh()
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">OpticaAI</CardTitle>
          <CardDescription>Crea tu cuenta para guardar pedidos y compras.</CardDescription>
        </CardHeader>

        <CardContent>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="full_name">Nombre completo</Label>
              <Input id="full_name" autoComplete="name" {...form.register('full_name')} />
              {form.formState.errors.full_name ? (
                <p className="text-sm text-red-600">{form.formState.errors.full_name.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Correo electronico</Label>
              <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
              {form.formState.errors.email ? (
                <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Celular</Label>
              <Input
                id="phone"
                placeholder="3001234567"
                autoComplete="tel"
                {...form.register('phone')}
              />
              {form.formState.errors.phone ? (
                <p className="text-sm text-red-600">{form.formState.errors.phone.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contrasena</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="pr-10"
                  {...form.register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="text-muted-foreground absolute inset-y-0 right-0 flex items-center pr-3"
                  aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <p className={`text-sm ${passwordStrength.className}`}>
                Fortaleza: {passwordStrength.label}
              </p>
              {form.formState.errors.password ? (
                <p className="text-sm text-red-600">{form.formState.errors.password.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contrasena</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="pr-10"
                  {...form.register('confirmPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  className="text-muted-foreground absolute inset-y-0 right-0 flex items-center pr-3"
                  aria-label={showConfirmPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                >
                  {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {form.formState.errors.confirmPassword ? (
                <p className="text-sm text-red-600">
                  {form.formState.errors.confirmPassword.message}
                </p>
              ) : null}
            </div>

            {formError ? <p className="text-sm text-red-600">{formError}</p> : null}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                'Crear cuenta'
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex-col gap-2">
          <p className="text-muted-foreground text-sm">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Inicia sesion
            </Link>
          </p>
        </CardFooter>
      </Card>
    </main>
  )
}
