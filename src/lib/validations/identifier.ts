/**
 * O login aceita e-mail ou CPF. O CPF é gravado como veio da planilha — às
 * vezes com máscara, às vezes só dígitos — então a busca tenta as duas formas
 * em vez de assumir um formato.
 */
export type LoginIdentifier =
  | { kind: "email"; value: string }
  | { kind: "cpf"; digits: string; masked: string }
  | { kind: "invalid" };

export function parseLoginIdentifier(raw: unknown): LoginIdentifier {
  if (typeof raw !== "string") {
    return { kind: "invalid" };
  }

  const value = raw.trim();
  if (value === "") {
    return { kind: "invalid" };
  }

  if (value.includes("@")) {
    return { kind: "email", value: value.toLowerCase() };
  }

  const digits = value.replace(/\D/g, "");
  if (digits.length !== 11) {
    return { kind: "invalid" };
  }

  return {
    kind: "cpf",
    digits,
    masked: `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`,
  };
}
