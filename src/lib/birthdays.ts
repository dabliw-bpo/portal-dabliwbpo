import { APP_TIME_ZONE } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export type Birthday = {
  id: string;
  name: string;
  email: string;
  day: number;
  companyName: string | null;
  turningAge: number | null;
};

/**
 * Today in Brasília, the app's official time. The server runs in
 * UTC, so asking it for "the current month" would roll over a few hours early.
 */
export function todayInBrazil(now: Date = new Date()): {
  year: number;
  month: number;
  day: number;
} {
  const [year, month, day] = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(now)
    .split("-")
    .map(Number);

  return { year, month, day };
}

/**
 * Birth dates are stored at UTC midnight, so the day and month read back off
 * the UTC parts. The row count here is in the dozens, so filtering in memory
 * keeps this readable without a raw query.
 */
export async function listMonthBirthdays(now: Date = new Date()): Promise<Birthday[]> {
  const { year, month } = todayInBrazil(now);

  const users = await prisma.user.findMany({
    where: { birthDate: { not: null }, active: true },
    select: {
      id: true,
      name: true,
      email: true,
      birthDate: true,
      company: { select: { name: true } },
    },
  });

  return users
    .filter((user) => user.birthDate!.getUTCMonth() + 1 === month)
    .map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      day: user.birthDate!.getUTCDate(),
      companyName: user.company?.name ?? null,
      turningAge: year - user.birthDate!.getUTCFullYear(),
    }))
    .sort((a, b) => a.day - b.day || a.name.localeCompare(b.name, "pt-BR"));
}

/** Everyone whose birthday falls today and who has not been greeted this year. */
export async function listTodaysBirthdaysToGreet(now: Date = new Date()) {
  const { year, month, day } = todayInBrazil(now);

  const users = await prisma.user.findMany({
    where: {
      birthDate: { not: null },
      active: true,
      OR: [{ birthdayGreetedYear: null }, { birthdayGreetedYear: { lt: year } }],
    },
    select: {
      id: true,
      name: true,
      email: true,
      birthDate: true,
      company: { select: { name: true } },
    },
  });

  return {
    year,
    users: users.filter(
      (user) =>
        user.birthDate!.getUTCMonth() + 1 === month && user.birthDate!.getUTCDate() === day
    ),
  };
}
