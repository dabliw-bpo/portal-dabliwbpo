import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome.").max(200),
  email: z.string().trim().email("Email inválido."),
  password: z.string().min(10, "A senha deve ter ao menos 10 caracteres."),
  role: z.enum(["ADMIN", "COLLABORATOR", "CLIENT"]),
});
