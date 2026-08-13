import { listTodaysBirthdaysToGreet, todayInBrazil } from "@/lib/birthdays";
import { sendBirthdayEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

/**
 * Sends the birthday greeting, once per person per year. Vercel Cron calls
 * this daily with `Authorization: Bearer $CRON_SECRET`; without that variable
 * configured the route refuses every request, so nothing is ever sent by
 * accident.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { year, users } = await listTodaysBirthdaysToGreet();
  const today = todayInBrazil();

  let sent = 0;
  const failed: string[] = [];

  for (const user of users) {
    const result = await sendBirthdayEmail({
      to: user.email,
      recipientName: user.name,
      companyName: user.company?.name ?? null,
    });

    if (result.ok) {
      // Marked only after a successful send, so a failure is retried tomorrow
      // rather than silently skipped for the rest of the year.
      await prisma.user.update({
        where: { id: user.id },
        data: { birthdayGreetedYear: year },
      });
      sent += 1;
    } else {
      failed.push(user.name);
    }
  }

  return Response.json({
    date: `${String(today.day).padStart(2, "0")}/${String(today.month).padStart(2, "0")}/${today.year}`,
    candidates: users.length,
    sent,
    failed,
  });
}
