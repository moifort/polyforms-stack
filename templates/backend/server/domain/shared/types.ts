import type { Brand } from 'ts-brand'

/** A Firebase Auth user id: the owner named on every private document. */
export type UserId = Brand<string, 'UserId'>
/** A person the user knows by name: themselves, asked once during onboarding. */
export type PersonName = Brand<string, 'PersonName'>
export type Count = Brand<number, 'Count'>
export type Percentage = Brand<number, 'Percentage'>
export type Eur = Brand<number, 'Eur'>
export type Year = Brand<number, 'Year'>
/** A calendar month, `"2026-10"`. */
export type Month = Brand<string, 'Month'>
/** A calendar day in UTC, `"2026-10-04"`. */
export type Day = Brand<string, 'Day'>
