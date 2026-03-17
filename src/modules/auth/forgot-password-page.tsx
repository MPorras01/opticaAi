'use client'

import Link from 'next/link'
import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { requestPasswordResetAction } from '@/actions/auth.actions'
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

const forgotPasswordSchema = z.object({
  email: z.string().email('Correo invalido'),
})

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  async function onSubmit(values: ForgotPasswordValues) {
    setFormError(null)
    setSuccessMessage(null)
    setIsLoading(true)

    const result = await requestPasswordResetAction(values.email)

    setIsLoading(false)

    if (!result.success) {
      setFormError(result.error ?? 'No se pudo enviar el enlace de recuperacion')
      return
    }

    setSuccessMessage('Si el correo existe, te enviamos un enlace para restablecer tu contrasena.')
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Recuperar contrasena</CardTitle>
          <CardDescription>
            Ingresa tu correo y te enviaremos un enlace seguro para restablecer la clave.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="email">Correo electronico</Label>
              <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
              {form.formState.errors.email ? (
                <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
              ) : null}
            </div>

            {successMessage ? (
              <Alert className="border-green-200 bg-green-50 text-green-800">
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            ) : null}

            {formError ? (
              <Alert className="border-red-200 bg-red-50 text-red-800">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            ) : null}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Enviando enlace...
                </>
              ) : (
                'Enviar enlace de recuperacion'
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex-col gap-2">
          <p className="text-muted-foreground text-sm">
            <Link href="/login" className="text-primary font-medium hover:underline">
              Volver a iniciar sesion
            </Link>
          </p>
        </CardFooter>
      </Card>
    </main>
  )
}
