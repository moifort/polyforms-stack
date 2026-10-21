import { z } from 'zod'

export const STACKS = ['backend', 'ios', 'ai', 'paid', 'admin', 'e2e', 'site'] as const
export type Stack = (typeof STACKS)[number]

export const StackConfig = z.object({
  stacks: z.array(z.enum(STACKS)).default([]),
  placeholders: z.record(z.string(), z.string()).default({}),
  exclude: z.array(z.string()).default([]),
})
export type StackConfig = z.infer<typeof StackConfig>

export const CONFIG_FILE = 'stack.config.json'

export const readConfig = async (projectDir: string): Promise<StackConfig> => {
  const file = Bun.file(`${projectDir}/${CONFIG_FILE}`)
  if (!(await file.exists()))
    throw new Error(`${CONFIG_FILE} not found in ${projectDir}: run init first`)
  return StackConfig.parse(await file.json())
}
