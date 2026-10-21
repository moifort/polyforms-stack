import { make } from 'ts-brand'
import { z } from 'zod'
import type {
  Count as CountType,
  Day as DayType,
  Eur as EurType,
  Month as MonthType,
  Percentage as PercentageType,
  PersonName as PersonNameType,
  UserId as UserIdType,
  Year as YearType,
} from '~/domain/shared/types'

const number = z.preprocess((v) => (typeof v === 'string' ? Number(v) : v), z.number())

export const UserId = (value: unknown) => make<UserIdType>()(z.string().min(1).parse(value))
export const PersonName = (value: unknown) =>
  make<PersonNameType>()(z.string().trim().min(1).max(200).parse(value))
export const Count = (value: unknown) =>
  make<CountType>()(number.pipe(z.number().int().nonnegative()).parse(value))
export const Percentage = (value: unknown) =>
  make<PercentageType>()(number.pipe(z.number().min(0).max(100)).parse(value))
export const Eur = (value: unknown) =>
  make<EurType>()(number.pipe(z.number().nonnegative()).parse(value))
export const Year = (value: unknown) =>
  make<YearType>()(
    number
      .pipe(
        z
          .number()
          .int()
          .min(1000)
          .max(new Date().getUTCFullYear() + 10),
      )
      .parse(value),
  )
export const Month = (value: unknown) =>
  make<MonthType>()(
    z
      .string()
      .regex(/^\d{4}-\d{2}$/)
      .parse(value),
  )
export const Day = (value: unknown) =>
  make<DayType>()(
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .parse(value),
  )
