'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { DM_Sans, Playfair_Display } from 'next/font/google'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type { PrescriptionData, PrescriptionEyeValues } from '@/types'

type PrescriptionFormProps = {
  onSubmit: (data: PrescriptionData) => void
  defaultValues?: Partial<PrescriptionData>
  isLoggedIn?: boolean
}

type EyeFormValues = PrescriptionEyeValues & {
  add?: string
}

const dmSans = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '600'] })
const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  style: ['normal', 'italic'],
})

const numRegex = /^[-+]?\d+(\.\d+)?$/

const optionalDecimal = (min: number, max: number, label: string) =>
  z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .refine((value) => !value || numRegex.test(value), `${label} debe ser numerico`)
    .refine((value) => {
      if (!value) return true
      const n = Number(value)
      return n >= min && n <= max
    }, `${label} debe estar entre ${min} y ${max}`)

const optionalInt = (min: number, max: number, label: string) =>
  z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .refine((value) => !value || /^\d+$/.test(value), `${label} debe ser entero`)
    .refine((value) => {
      if (!value) return true
      const n = Number(value)
      return n >= min && n <= max
    }, `${label} debe estar entre ${min} y ${max}`)

const eyeSchema = z.object({
  sphere: optionalDecimal(-20, 20, 'SPH'),
  cylinder: optionalDecimal(-8, 0, 'CYL'),
  axis: optionalInt(0, 180, 'AXIS'),
  add: optionalDecimal(0, 4, 'ADD'),
})

const formSchema = z
  .object({
    rightEye: eyeSchema,
    leftEye: eyeSchema,
    pdDual: z.boolean(),
    pdSingle: optionalDecimal(40, 80, 'PD'),
    pdRight: optionalDecimal(20, 40, 'PD OD'),
    pdLeft: optionalDecimal(20, 40, 'PD OI'),
    notes: z.string().max(1000).optional().or(z.literal('')),
    legalConsent: z.boolean().refine((value) => value === true, {
      message: 'Debes confirmar la declaracion legal para continuar.',
    }),
    saveToAccount: z.boolean(),
  })
  .refine(
    (data) => {
      if (!data.pdDual) return Boolean(data.pdSingle?.trim())
      return Boolean(data.pdRight?.trim()) && Boolean(data.pdLeft?.trim())
    },
    {
      message: 'Completa la distancia pupilar (PD).',
      path: ['pdSingle'],
    }
  )

type FormValues = z.input<typeof formSchema>
type FormSubmitValues = z.output<typeof formSchema>

function splitPd(pd?: string): {
  pdDual: boolean
  pdSingle: string
  pdRight: string
  pdLeft: string
} {
  const raw = (pd ?? '').trim()
  if (!raw) {
    return { pdDual: false, pdSingle: '', pdRight: '', pdLeft: '' }
  }

  const dualMatch = raw.match(/^(\d+(?:\.\d+)?)\s*[\/-]\s*(\d+(?:\.\d+)?)$/)
  if (dualMatch) {
    return {
      pdDual: true,
      pdSingle: '',
      pdRight: dualMatch[1],
      pdLeft: dualMatch[2],
    }
  }

  return { pdDual: false, pdSingle: raw, pdRight: '', pdLeft: '' }
}

function toTrimmedOrUndefined(value?: string): string | undefined {
  const trimmed = (value ?? '').trim()
  return trimmed || undefined
}

function mapDefaultValues(values?: Partial<PrescriptionData>): FormValues {
  const pd = splitPd(values?.pd)

  return {
    rightEye: {
      sphere: values?.rightEye?.sphere ?? '',
      cylinder: values?.rightEye?.cylinder ?? '',
      axis: values?.rightEye?.axis ?? '',
      add: values?.addPower ?? '',
    },
    leftEye: {
      sphere: values?.leftEye?.sphere ?? '',
      cylinder: values?.leftEye?.cylinder ?? '',
      axis: values?.leftEye?.axis ?? '',
      add: values?.addPower ?? '',
    },
    pdDual: pd.pdDual,
    pdSingle: pd.pdSingle,
    pdRight: pd.pdRight,
    pdLeft: pd.pdLeft,
    notes: values?.notes ?? '',
    legalConsent: Boolean(values?.legalConsent),
    saveToAccount: false,
  }
}

function EyeColumn({
  title,
  prefix,
  register,
  errors,
}: {
  title: string
  prefix: 'rightEye' | 'leftEye'
  register: ReturnType<typeof useForm<FormValues>>['register']
  errors: ReturnType<typeof useForm<FormValues>>['formState']['errors']
}) {
  return (
    <section className="rounded-xl border border-[#E5E2DC] bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-[#0F0F0D]">{title}</h3>

      <div className="grid gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-[#2C3E6B]">SPH</label>
          <Input
            type="number"
            step="0.25"
            min={-20}
            max={20}
            placeholder="0.00"
            {...register(`${prefix}.sphere`)}
          />
          {errors[prefix]?.sphere?.message && (
            <p className="mt-1 text-xs text-red-600">{errors[prefix]?.sphere?.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-[#2C3E6B]">CYL</label>
          <Input
            type="number"
            step="0.25"
            min={-8}
            max={0}
            placeholder="0.00"
            {...register(`${prefix}.cylinder`)}
          />
          {errors[prefix]?.cylinder?.message && (
            <p className="mt-1 text-xs text-red-600">{errors[prefix]?.cylinder?.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-[#2C3E6B]">AXIS</label>
          <Input
            type="number"
            step="1"
            min={0}
            max={180}
            placeholder="0"
            {...register(`${prefix}.axis`)}
          />
          {errors[prefix]?.axis?.message && (
            <p className="mt-1 text-xs text-red-600">{errors[prefix]?.axis?.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-[#2C3E6B]">ADD</label>
          <Input
            type="number"
            step="0.25"
            min={0}
            max={4}
            placeholder="0.00"
            {...register(`${prefix}.add`)}
          />
          {errors[prefix]?.add?.message && (
            <p className="mt-1 text-xs text-red-600">{errors[prefix]?.add?.message}</p>
          )}
        </div>
      </div>
    </section>
  )
}

export function PrescriptionForm({
  onSubmit,
  defaultValues,
  isLoggedIn = false,
}: PrescriptionFormProps) {
  const form = useForm<FormValues, undefined, FormSubmitValues>({
    resolver: zodResolver(formSchema),
    defaultValues: mapDefaultValues(defaultValues),
    mode: 'onSubmit',
  })

  const pdDual = form.watch('pdDual')

  const submitHandler = (values: FormSubmitValues) => {
    const rightAdd = toTrimmedOrUndefined(values.rightEye.add)
    const leftAdd = toTrimmedOrUndefined(values.leftEye.add)

    let addPower: string | undefined
    if (rightAdd || leftAdd) {
      if (rightAdd && leftAdd && rightAdd === leftAdd) {
        addPower = rightAdd
      } else if (rightAdd && leftAdd) {
        addPower = `OD ${rightAdd} | OI ${leftAdd}`
      } else {
        addPower = rightAdd ?? leftAdd
      }
    }

    const payload: PrescriptionData & { saveToAccount?: boolean } = {
      mode: 'manual',
      rightEye: {
        sphere: toTrimmedOrUndefined(values.rightEye.sphere),
        cylinder: toTrimmedOrUndefined(values.rightEye.cylinder),
        axis: toTrimmedOrUndefined(values.rightEye.axis),
      },
      leftEye: {
        sphere: toTrimmedOrUndefined(values.leftEye.sphere),
        cylinder: toTrimmedOrUndefined(values.leftEye.cylinder),
        axis: toTrimmedOrUndefined(values.leftEye.axis),
      },
      pd: values.pdDual
        ? `${(values.pdRight ?? '').trim()}/${(values.pdLeft ?? '').trim()}`
        : (values.pdSingle ?? '').trim(),
      addPower,
      notes: toTrimmedOrUndefined(values.notes),
      legalConsent: values.legalConsent,
      legalAcceptedAt: new Date().toISOString(),
      saveToAccount: isLoggedIn ? values.saveToAccount : undefined,
    }

    onSubmit(payload)
  }

  return (
    <form
      onSubmit={form.handleSubmit(submitHandler)}
      className={`${dmSans.className} space-y-6 rounded-2xl border border-[#E9E6DF] bg-[#FAFAF8] p-6 text-[#0F0F0D]`}
    >
      <header>
        <h2 className={`${playfairDisplay.className} text-3xl font-semibold text-[#0F0F0D]`}>
          Tu fórmula óptica
        </h2>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <EyeColumn
          title="Ojo Derecho (OD)"
          prefix="rightEye"
          register={form.register}
          errors={form.formState.errors}
        />
        <EyeColumn
          title="Ojo Izquierdo (OI)"
          prefix="leftEye"
          register={form.register}
          errors={form.formState.errors}
        />
      </div>

      <section className="space-y-3 rounded-xl border border-[#E5E2DC] bg-white p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">PD (Distancia pupilar)</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#2C3E6B]">PD dual</span>
            <Switch
              checked={pdDual}
              onCheckedChange={(checked) => {
                form.setValue('pdDual', checked, { shouldValidate: true })
                form.clearErrors('pdSingle')
              }}
              className="data-checked:bg-[#2C3E6B]"
            />
          </div>
        </div>

        {!pdDual ? (
          <div>
            <label className="mb-1 block text-xs font-medium text-[#2C3E6B]">PD</label>
            <Input
              type="number"
              min={40}
              max={80}
              step="0.5"
              placeholder="64"
              {...form.register('pdSingle')}
            />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-[#2C3E6B]">OD</label>
              <Input
                type="number"
                min={20}
                max={40}
                step="0.5"
                placeholder="32"
                {...form.register('pdRight')}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[#2C3E6B]">OI</label>
              <Input
                type="number"
                min={20}
                max={40}
                step="0.5"
                placeholder="32"
                {...form.register('pdLeft')}
              />
            </div>
          </div>
        )}

        {form.formState.errors.pdSingle?.message && (
          <p className="text-xs text-red-600">{form.formState.errors.pdSingle.message}</p>
        )}
      </section>

      <section className="space-y-2">
        <label className="text-sm font-medium">Notas adicionales</label>
        <Textarea rows={3} placeholder="Opcional" {...form.register('notes')} />
      </section>

      <section className="space-y-3 rounded-xl border border-[#E5E2DC] bg-white p-4">
        <label className="flex items-start gap-3">
          <Checkbox
            checked={form.watch('legalConsent')}
            onCheckedChange={(checked) => form.setValue('legalConsent', checked === true)}
            className="mt-0.5 data-checked:border-[#D4A853] data-checked:bg-[#D4A853]"
          />
          <span className="text-sm leading-6 text-[#0F0F0D]">
            Confirmo que esta fórmula fue prescrita por un profesional de la salud visual
            registrado. OpticaAI no realiza exámenes visuales.
          </span>
        </label>

        {form.formState.errors.legalConsent?.message && (
          <p className="text-sm text-red-600">{form.formState.errors.legalConsent.message}</p>
        )}
      </section>

      {isLoggedIn ? (
        <section className="flex items-center justify-between rounded-xl border border-[#E5E2DC] bg-white p-4">
          <span className="text-sm text-[#0F0F0D]">
            Guardar fórmula en mi cuenta para futuros pedidos
          </span>
          <Switch
            checked={form.watch('saveToAccount')}
            onCheckedChange={(checked) => form.setValue('saveToAccount', checked)}
            className="data-checked:bg-[#2C3E6B]"
          />
        </section>
      ) : null}

      <Button
        type="submit"
        className="h-11 w-full rounded-full bg-[#D4A853] font-semibold text-[#0F0F0D] hover:bg-[#C79D4C]"
      >
        Continuar
      </Button>
    </form>
  )
}
