import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { homePathForRole } from "@/lib/authz";
import { LandingPage } from "@/components/marketing/landing-page";

export const metadata: Metadata = {
  title: "DABLIW BPO: Financeiro e RH para empresas",
  description:
    "Terceirize a gestão financeira da sua empresa e a burocracia com os documentos do RH. BPO financeiro e de RH, com portal digital para acompanhar cada etapa.",
};

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    redirect(homePathForRole(session.user.role));
  }

  return <LandingPage />;
}
