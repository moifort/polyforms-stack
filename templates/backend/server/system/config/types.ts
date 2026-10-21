import type { Brand } from 'ts-brand'

export type AdminToken = Brand<string, 'AdminToken'>
export type SentryDsn = Brand<string, 'SentryDsn'>
/** The deployed revision, as `<app>-node@<git sha>`: ties errors to source maps. */
export type SentryRelease = Brand<string, 'SentryRelease'>
/** Development only: the origin this server is reachable at from the simulator. */
export type PublicBaseUrl = Brand<string, 'PublicBaseUrl'>
