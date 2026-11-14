/** Whether a fetch failed because its `AbortSignal.timeout` ran out, rather than
 *  because the host could not be reached or answered badly. The platform throws a
 *  `DOMException` named `TimeoutError` for it, with no subclass to test against. */
export const isTimeout = (error: unknown): boolean =>
  error instanceof DOMException && error.name === 'TimeoutError'

/** Who the server says it is to the free APIs it calls, which ask every client
 *  to name itself, and throttle or refuse those that don't. */
const APP_NAME = '{{APP_NAME}}'
const REPOSITORY = 'https://github.com/{{GITHUB_OWNER}}/{{GITHUB_REPO}}'
export const USER_AGENT = `${APP_NAME}/1.0 (${REPOSITORY})`

/** A JSON answer fetched under the server's name. Throws on an answer that is not a
 *  success, naming the host and the status; the caller decides what a failure
 *  means, and gives the timeout as `signal`. */
export const fetchJson = async <T>(
  url: string,
  { signal, headers }: { signal?: AbortSignal; headers?: Record<string, string> } = {},
): Promise<T> => {
  const response = await fetch(url, {
    headers: { 'user-agent': USER_AGENT, ...headers },
    signal,
  })
  if (!response.ok) throw new Error(`${new URL(url).host} answered ${response.status}`)
  return (await response.json()) as T
}
