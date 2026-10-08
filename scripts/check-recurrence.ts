import { loadEnvConfig } from "@next/env";

/**
 * Checagem de regressão da aritmética de recorrência e das validações de
 * contrato — a lógica mais fácil de quebrar em silêncio de todo o módulo de
 * atividades. Roda inteiramente em memória: não lê nem escreve no banco.
 *
 *     npm run atividades:checar
 *
 * Já pegou um caso real: `Number(undefined)` virando NaN e atravessando
 * `.optional()`, o que fazia um contrato semanal sem dia da semana passar na
 * validação e cair no padrão silencioso do gerador.
 */
loadEnvConfig(process.cwd());

let failures = 0;
function check(label: string, condition: boolean, detail = "") {
  if (condition) {
    console.log(`  ok   ${label}`);
  } else {
    failures += 1;
    console.log(`  FAIL ${label} ${detail}`);
  }
}

async function main() {
  const { expandOccurrences, describeRecurrence } = await import("../src/lib/tasks/recurrence");
  const { serviceContractSchema, checklistSchema } = await import("../src/lib/validations/service");

  const base = {
    dayOfMonth: null as number | null,
    weekday: null as number | null,
    months: [] as number[],
    deadlineTime: "18:00",
    adjustment: "POSTERGAR" as const,
    targetOffsetDays: 1,
    startsOn: new Date(Date.UTC(2026, 0, 1)),
    endsOn: null as Date | null,
  };
  const from = new Date(Date.UTC(2026, 7, 5)); // 05/08/2026, quarta
  const iso = (d: Date) => d.toISOString().slice(0, 10);

  console.log("\n--- MENSAL dia 5, horizonte 120d ---");
  const mensal = expandOccurrences(
    { ...base, recurrenceType: "MENSAL", dayOfMonth: 5 },
    from,
    new Date(Date.UTC(2026, 11, 10))
  );
  console.log("   ", mensal.map((o) => iso(o.dueDateLegal)).join(" "));
  check("gera 5 meses (ago a dez)", mensal.length === 5, `veio ${mensal.length}`);
  check("agosto vence dia 05", iso(mensal[0].dueDateLegal) === "2026-08-05");
  check(
    "setembro (05 = sábado) posterga para 07",
    iso(mensal[1].dueDateLegal) === "2026-09-07",
    iso(mensal[1].dueDateLegal)
  );
  check(
    "período de agosto vai de 01 a 31",
    iso(mensal[0].periodStart) === "2026-08-01" && iso(mensal[0].periodEnd) === "2026-08-31"
  );

  console.log("\n--- MENSAL dia 31, clamp em meses curtos ---");
  const clamp = expandOccurrences(
    { ...base, recurrenceType: "MENSAL", dayOfMonth: 31, adjustment: "MANTER" },
    new Date(Date.UTC(2026, 8, 1)),
    new Date(Date.UTC(2026, 10, 30))
  );
  console.log("   ", clamp.map((o) => iso(o.dueDateLegal)).join(" "));
  check(
    "setembro cai no dia 30, não estoura para outubro",
    clamp.some((o) => iso(o.dueDateLegal) === "2026-09-30")
  );

  console.log("\n--- TRIMESTRAL dia 20, meses 1/4/7/10 ---");
  const trimestral = expandOccurrences(
    { ...base, recurrenceType: "TRIMESTRAL", dayOfMonth: 20, months: [1, 4, 7, 10] },
    from,
    new Date(Date.UTC(2027, 4, 1))
  );
  console.log("   ", trimestral.map((o) => iso(o.dueDateLegal)).join(" "));
  check("só outubro/2026, janeiro e abril/2027", trimestral.length === 3, `veio ${trimestral.length}`);
  check("nenhum mês fora da lista", trimestral.every((o) => [9, 0, 3].includes(o.periodStart.getUTCMonth())));

  console.log("\n--- DIARIA: só dias úteis ---");
  const diaria = expandOccurrences(
    { ...base, recurrenceType: "DIARIA", deadlineTime: "14:00", targetOffsetDays: 0 },
    from,
    new Date(Date.UTC(2026, 7, 16))
  );
  console.log("   ", diaria.map((o) => iso(o.dueDateLegal)).join(" "));
  check("8 dias úteis entre 05 e 16/08", diaria.length === 8, `veio ${diaria.length}`);
  check(
    "nenhum sábado ou domingo",
    diaria.every((o) => ![0, 6].includes(o.dueDateLegal.getUTCDay()))
  );
  check(
    "corte 14:00 BRT vira 17:00 UTC",
    diaria[0].dueDateLegal.toISOString().includes("T17:00")
  );

  console.log("\n--- QUINZENAL ancorado no início da vigência ---");
  const quinzenal = expandOccurrences(
    { ...base, recurrenceType: "QUINZENAL", startsOn: new Date(Date.UTC(2026, 7, 6)) },
    from,
    new Date(Date.UTC(2026, 8, 20))
  );
  console.log("   ", quinzenal.map((o) => iso(o.dueDateLegal)).join(" "));
  check("intervalos de 14 dias", quinzenal.length >= 2);
  check("primeira ocorrência na âncora 06/08", iso(quinzenal[0].periodStart) === "2026-08-06");

  console.log("\n--- não gera retroativo ---");
  const retro = expandOccurrences(
    { ...base, recurrenceType: "MENSAL", dayOfMonth: 1 },
    from,
    new Date(Date.UTC(2026, 8, 30))
  );
  console.log("   ", retro.map((o) => iso(o.dueDateLegal)).join(" "));
  check("descarta 01/08 (já passou)", retro.every((o) => iso(o.dueDateLegal) >= "2026-08-05"));

  console.log("\n--- validação do contrato ---");
  const valid = {
    serviceId: "s1",
    recurrenceType: "MENSAL",
    dayOfMonth: "5",
    deadlineTime: "12:00",
    adjustment: "POSTERGAR",
    targetOffsetDays: "1",
    startsOn: "2026-08-05",
    months: [],
  };
  check("contrato mensal válido passa", serviceContractSchema.safeParse(valid).success);
  check(
    "mensal sem dia do mês é rejeitado",
    !serviceContractSchema.safeParse({ ...valid, dayOfMonth: "" }).success
  );
  check(
    "semanal sem dia da semana é rejeitado",
    !serviceContractSchema.safeParse({ ...valid, recurrenceType: "SEMANAL", dayOfMonth: "" }).success
  );
  check(
    "trimestral sem meses é rejeitado",
    !serviceContractSchema.safeParse({ ...valid, recurrenceType: "TRIMESTRAL" }).success
  );
  check(
    "fim antes do início é rejeitado",
    !serviceContractSchema.safeParse({ ...valid, endsOn: "2026-08-01" }).success
  );
  check(
    "hora inválida é rejeitada",
    !serviceContractSchema.safeParse({ ...valid, deadlineTime: "25:99" }).success
  );

  console.log("\n--- checklist vindo do editor ---");
  const parsedChecklist = checklistSchema.safeParse(
    JSON.stringify([
      { text: "Importar extrato", required: true },
      { text: "Conferir saldo", required: false },
    ])
  );
  check("JSON do editor é aceito", parsedChecklist.success);
  check(
    "preserva a flag de obrigatório",
    parsedChecklist.success && parsedChecklist.data[0].required === true
  );
  check("item vazio é rejeitado", !checklistSchema.safeParse(JSON.stringify([{ text: "", required: false }])).success);
  check("campo ausente vira lista vazia", checklistSchema.safeParse("").success);

  console.log("\n--- descrição da regra ---");
  console.log(
    "   ",
    describeRecurrence({
      recurrenceType: "SEMANAL",
      weekday: 1,
      dayOfMonth: null,
      months: [],
      deadlineTime: "12:00",
    })
  );
  console.log(
    "   ",
    describeRecurrence({
      recurrenceType: "TRIMESTRAL",
      weekday: null,
      dayOfMonth: 20,
      months: [1, 4, 7, 10],
      deadlineTime: "18:00",
    })
  );

  console.log(failures === 0 ? "\nTODAS AS VERIFICACOES PASSARAM" : `\n${failures} FALHA(S)`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
