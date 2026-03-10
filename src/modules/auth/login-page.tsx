'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { loginAction } from '@/actions/auth.actions'
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

const loginSchema = z.object({
  email: z.string().email('Correo invalido'),
  password: z.string().min(6, 'La contrasena debe tener al menos 6 caracteres'),
})

type LoginFormValues = z.infer<typeof loginSchema>

type LoginPageProps = {
  registered?: boolean
  redirectTo?: string
}

export function LoginPage({ registered = false, redirectTo }: LoginPageProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  async function onSubmit(values: LoginFormValues) {
    setFormError(null)
    setIsLoading(true)

    const result = await loginAction(values.email, values.password)

    setIsLoading(false)

    if (!result.success) {
      setFormError(result.error ?? 'No se pudo iniciar sesion')
      return
    }

    router.push(redirectTo || '/dashboard')
    router.refresh()
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">OpticaAI</CardTitle>
          <CardDescription>Inicia sesion para acceder a tu cuenta y pedidos.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {registered ? (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <AlertDescription>Cuenta creada exitosamente. Inicia sesion.</AlertDescription>
            </Alert>
          ) : null}

          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="email">Correo electronico</Label>
              <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
              {form.formState.errors.email ? (
                <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contrasena</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
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

            <div className="flex justify-end">
              <Link href="#" className="text-muted-foreground text-sm hover:underline">
                ?Olvidaste tu contrasena?
              </Link>
            </div>

            {formError ? <p className="text-sm text-red-600">{formError}</p> : null}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Iniciando sesion...
                </>
              ) : (
                'Iniciar sesion'
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex-col gap-2">
          <p className="text-muted-foreground text-sm">
            ?No tienes cuenta?{' '}
            <Link href="/registro" className="text-primary font-medium hover:underline">
              Registrate
            </Link>
          </p>
        </CardFooter>
      </Card>
    </main>
  )
}
