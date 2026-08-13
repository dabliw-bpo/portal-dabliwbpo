import { z } from "zod";

/**
 * What the collaborator is asking for. The last option sells days back
 * (abono pecuniário) instead of taking time off.
 */
export const VACATION_OPTIONS = [
  "DAYS_5",
  "DAYS_10",
  "DAYS_15",
  "DAYS_20",
  "DAYS_30",
  "SELL_10",
] as const;

export type VacationOption = (typeof VACATION_OPTIONS)[number];

export const VACATION_OPTION_LABELS: Record<VacationOption, string> = {
  DAYS_5: "5 dias",
  DAYS_10: "10 dias",
  DAYS_15: "15 dias",
  DAYS_20: "20 dias",
  DAYS_30: "30 dias",
  SELL_10: "Vender 10",
};

export function vacationOptionLabel(option: string | null): string | null {
  return option && option in VACATION_OPTION_LABELS
    ? VACATION_OPTION_LABELS[option as VacationOption]
    : null;
}

export const createVacationRequestSchema = z.object({
  startDate: z.string().min(1, "Informe o primeiro dia de férias."),
  option: z.enum(VACATION_OPTIONS, { message: "Escolha uma das opções." }),
  notes: z.string().trim().max(1000).optional(),
});

export const reviewVacationRequestSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT"]),
  reviewNotes: z.string().trim().max(1000).optional(),
});
