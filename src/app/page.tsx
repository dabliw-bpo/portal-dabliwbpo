import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { homePathForRole } from "@/lib/authz";
import { LandingPage } from "@/components/marketing/landing-page";

export const metadata: Metadata = {
  title: "DABLIW BPO — Financeiro e RH para empresas",
  description:
    "BPO financeiro e de RH: análises, contas a pagar e a receber, folha de pagamento, admissões e um portal digital para acompanhar tudo.",
};

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    redirect(homePathForRole(session.user.role));
  }

  return <LandingPage />;
}
