import { RegisterPage } from '@auth/register-page'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function getFirstValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0]
  }

  return value
}

export default async function RegisterRoute({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const redirectTo = getFirstValue(params.redirectTo)

  return <RegisterPage redirectTo={redirectTo} />
}
