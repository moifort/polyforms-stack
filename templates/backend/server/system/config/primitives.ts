import { make } from 'ts-brand'
import { z } from 'zod'
import type {
  AdminToken as AdminTokenType,
  PublicBaseUrl as PublicBaseUrlType,
  SentryDsn as SentryDsnType,
  SentryRelease as SentryReleaseType,
} from '~/system/config/types'

export const AdminToken = (value: unknown) => make<AdminTokenType>()(z.string().min(1).parse(value))

// Any non-empty string: Sentry.init validates the DSN itself (warns and disables
// on a bad one) rather than throwing, so a malformed value cannot take config() down.
export const SentryDsn = (value: unknown) => make<SentryDsnType>()(z.string().min(1).parse(value))

export const SentryRelease = (value: unknown) =>
  make<SentryReleaseType>()(z.string().min(1).parse(value))

export const PublicBaseUrl = (value: unknown) =>
  make<PublicBaseUrlType>()(z.string().url().parse(value))
