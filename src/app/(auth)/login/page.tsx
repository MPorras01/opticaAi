import { LoginPage } from '@auth/login-page'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function getFirstValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0]
  }

  return value
}

export default async function LoginRoute({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const registered = getFirstValue(params.registered) === 'true'
  const expired = getFirstValue(params.expired) === 'true'
  const reset = getFirstValue(params.reset) === 'true'
  const redirectTo = getFirstValue(params.redirectTo)

  return (
    <LoginPage registered={registered} redirectTo={redirectTo} expired={expired} reset={reset} />
  )
}
