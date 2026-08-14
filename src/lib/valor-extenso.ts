const UNITS = [
  "",
  "um",
  "dois",
  "três",
  "quatro",
  "cinco",
  "seis",
  "sete",
  "oito",
  "nove",
  "dez",
  "onze",
  "doze",
  "treze",
  "quatorze",
  "quinze",
  "dezesseis",
  "dezessete",
  "dezoito",
  "dezenove",
];

const TENS = [
  "",
  "",
  "vinte",
  "trinta",
  "quarenta",
  "cinquenta",
  "sessenta",
  "setenta",
  "oitenta",
  "noventa",
];

const HUNDREDS = [
  "",
  "cento",
  "duzentos",
  "trezentos",
  "quatrocentos",
  "quinhentos",
  "seiscentos",
  "setecentos",
  "oitocentos",
  "novecentos",
];

/** Escalas a partir do milhar, na ordem dos grupos de três dígitos. */
const SCALES: { singular: string; plural: string }[] = [
  { singular: "", plural: "" },
  { singular: "mil", plural: "mil" },
  { singular: "milhão", plural: "milhões" },
  { singular: "bilhão", plural: "bilhões" },
  { singular: "trilhão", plural: "trilhões" },
];

/** 1..999 por extenso. 100 exato é "cem"; 101+ vira "cento e …". */
function threeDigitsToWords(value: number): string {
  if (value === 100) return "cem";

  const hundreds = Math.floor(value / 100);
  const rest = value % 100;

  const parts: string[] = [];
  if (hundreds > 0) parts.push(HUNDREDS[hundreds]);

  if (rest > 0) {
    if (rest < 20) {
      parts.push(UNITS[rest]);
    } else {
      const tens = Math.floor(rest / 10);
      const units = rest % 10;
      parts.push(units > 0 ? `${TENS[tens]} e ${UNITS[units]}` : TENS[tens]);
    }
  }

  return parts.join(" e ");
}

/**
 * Inteiro por extenso, em português do Brasil.
 *
 * A conjunção antes do último grupo é "e" quando ele é menor que cem ou é
 * centena exata ("mil e quinhentos", "mil e cinquenta"); nos demais casos a
 * separação é por vírgula ("mil, duzentos e trinta e quatro").
 */
export function integerToWords(value: number): string {
  if (value === 0) return "zero";

  const groups: number[] = [];
  let remaining = value;
  while (remaining > 0) {
    groups.push(remaining % 1000);
    remaining = Math.floor(remaining / 1000);
  }

  const rendered: string[] = [];
  // A conjunção final depende do último grupo escrito, que nem sempre é o das
  // unidades: em 1.500.000 o último escrito é "quinhentos mil".
  let lastRenderedGroup = 0;

  for (let index = groups.length - 1; index >= 0; index -= 1) {
    const group = groups[index];
    if (group === 0) continue;
    lastRenderedGroup = group;

    const scale = SCALES[index];
    if (index === 0) {
      rendered.push(threeDigitsToWords(group));
    } else if (index === 1) {
      // "mil" não leva "um" na frente.
      rendered.push(group === 1 ? "mil" : `${threeDigitsToWords(group)} mil`);
    } else {
      rendered.push(
        `${threeDigitsToWords(group)} ${group === 1 ? scale.singular : scale.plural}`
      );
    }
  }

  if (rendered.length === 1) return rendered[0];

  const last = rendered[rendered.length - 1];
  const head = rendered.slice(0, -1);

  const joinWithE = lastRenderedGroup < 100 || lastRenderedGroup % 100 === 0;
  return joinWithE ? `${head.join(", ")} e ${last}` : `${head.join(", ")}, ${last}`;
}

/**
 * Valor em centavos por extenso, para a via impressa do recibo.
 *
 * Milhões e bilhões redondos pedem "de" ("um milhão de reais"), mas milhares
 * não ("mil reais").
 */
export function centsToWords(cents: number): string {
  const reais = Math.floor(cents / 100);
  const centavos = cents % 100;

  const parts: string[] = [];

  if (reais > 0) {
    const needsDe = reais >= 1_000_000 && reais % 1_000_000 === 0;
    const noun = reais === 1 ? "real" : "reais";
    parts.push(`${integerToWords(reais)}${needsDe ? " de" : ""} ${noun}`);
  }

  if (centavos > 0) {
    parts.push(`${integerToWords(centavos)} ${centavos === 1 ? "centavo" : "centavos"}`);
  }

  if (parts.length === 0) return "zero reais";
  return parts.join(" e ");
}
