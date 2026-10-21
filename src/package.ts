import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/** The root of this package, wherever it is installed. */
export const packageDir = (): string => resolve(dirname(fileURLToPath(import.meta.url)), '..')

export const packageVersion = async (): Promise<string> =>
  ((await Bun.file(`${packageDir()}/package.json`).json()) as { version: string }).version
