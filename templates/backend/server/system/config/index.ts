import { AdminToken, PublicBaseUrl, SentryDsn, SentryRelease } from '~/system/config/primitives'

/** Every value the server reads from its environment, validated once. A new
 *  variable is added here, in nitro.config.ts, in .env.example, in
 *  infra/variables.tf and in the deploy workflow, in the same commit. */
export const config = () => {
  const runtimeConfig = useRuntimeConfig()
  return {
    adminToken: runtimeConfig.adminToken ? AdminToken(runtimeConfig.adminToken) : undefined,
    sentryDsn: runtimeConfig.sentryDsn ? SentryDsn(runtimeConfig.sentryDsn) : undefined,
    sentryRelease: runtimeConfig.sentryRelease
      ? SentryRelease(runtimeConfig.sentryRelease)
      : undefined,
    devUserId: runtimeConfig.devUserId || undefined,
    gcpProjectId: runtimeConfig.firebaseProjectId || undefined,
    publicBaseUrl: PublicBaseUrl(runtimeConfig.publicBaseUrl),
  }
}
