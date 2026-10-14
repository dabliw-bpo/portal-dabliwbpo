import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { homePathForRole } from "@/lib/authz";
import { ShellInterno } from "@/components/layout/shell-interno";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  if (session.user.role !== "ADMIN") {
    redirect(homePathForRole(session.user.role));
  }

  return (
    <ShellInterno
      title="Admin"
      userName={session?.user?.name ?? ""}
      links={[
        { href: "/admin", label: "Painel", exact: true },
        { href: "/admin/empresas", label: "Empresas" },
      ]}
    >
      {children}
    </ShellInterno>
  );
}
