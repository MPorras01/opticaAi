'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Alert, AlertDescription } from '@/components/ui/alert'
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
import { createClient } from '@/lib/supabase/client'

const resetPasswordSchema = z
  .object({
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

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>

export function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [isRecoveryReady, setIsRecoveryReady] = useState(false)

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    let active = true

    async function verifyRecoveryLink() {
      const tokenHash = searchParams.get('token_hash')
      const type = searchParams.get('type')

      if (!tokenHash || type !== 'recovery') {
        setFormError('El enlace de recuperacion no es valido o ya expiro.')
        setIsVerifying(false)
        return
      }

      const supabase = createClient()
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: 'recovery',
      })

      if (!active) {
        return
      }

      if (error) {
        setFormError('No se pudo validar el enlace. Solicita uno nuevo.')
        setIsVerifying(false)
        return
      }

      setIsRecoveryReady(true)
      setIsVerifying(false)
    }

    verifyRecoveryLink()

    return () => {
      active = false
    }
  }, [searchParams])

  async function onSubmit(values: ResetPasswordValues) {
    setFormError(null)
    setIsLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({
      password: values.password,
    })

    setIsLoading(false)

    if (error) {
      setFormError(error.message)
      return
    }

    await supabase.auth.signOut()
    router.push('/login?reset=true')
    router.refresh()
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Restablecer contrasena</CardTitle>
          <CardDescription>Define una nueva contrasena segura para tu cuenta.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {isVerifying ? (
            <div className="flex items-center gap-2 text-sm text-[#6E6E67]">
              <Loader2 className="size-4 animate-spin" />
              Validando enlace seguro...
            </div>
          ) : null}

          {formError ? (
            <Alert className="border-red-200 bg-red-50 text-red-800">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}

          {isRecoveryReady ? (
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="space-y-2">
                <Label htmlFor="password">Nueva contrasena</Label>
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
                    {showConfirmPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                {form.formState.errors.confirmPassword ? (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.confirmPassword.message}
                  </p>
                ) : null}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Actualizando contrasena...
                  </>
                ) : (
                  'Guardar nueva contrasena'
                )}
              </Button>
            </form>
          ) : null}
        </CardContent>

        <CardFooter className="flex-col gap-2">
          <p className="text-muted-foreground text-sm">
            <Link href="/recuperar-contrasena" className="text-primary font-medium hover:underline">
              Solicitar un nuevo enlace
            </Link>
          </p>
        </CardFooter>
      </Card>
    </main>
  )
}
