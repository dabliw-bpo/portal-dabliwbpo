import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseLoginIdentifier } from "@/lib/validations/identifier";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email ou CPF", type: "text" },
        password: { label: "Senha", type: "password" },
      },
      authorize: async (credentials) => {
        const password = credentials?.password;
        const identifier = parseLoginIdentifier(credentials?.email);
        if (typeof password !== "string" || identifier.kind === "invalid") {
          return null;
        }

        const user =
          identifier.kind === "email"
            ? await prisma.user.findUnique({ where: { email: identifier.value } })
            : await prisma.user.findFirst({
                where: { OR: [{ cpf: identifier.digits }, { cpf: identifier.masked }] },
              });

        if (!user || !user.active) {
          return null;
        }

        const passwordMatches = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatches) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
          companyId: user.companyId,
        };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
        token.mustChangePassword = (user as { mustChangePassword: boolean }).mustChangePassword;
        token.companyId = (user as { companyId: string | null }).companyId;
      }
      return token;
    },
    session: async ({ session, token }) => {
      session.user.id = token.id as string;
      session.user.role = token.role as Role;
      session.user.mustChangePassword = token.mustChangePassword as boolean;
      session.user.companyId = token.companyId as string | null;
      return session;
    },
  },
});
