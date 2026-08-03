import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = "senha123";

const COLABORADORES: Array<{ name: string; email: string }> = [
  { name: "Claudio Santin", email: "claudiojabuti74@gmail.com" },
  { name: "Cleiton Rodrigues da Conceição", email: "cleitonrodrigues7535@gmail.com" },
  { name: "Denis de Almeida Silva", email: "silvadenis200993@gmail.com" },
  { name: "Eder Mendes da Silva Rios", email: "eder.mendes98765@gmail.com" },
  { name: "Edileuza Felipe do Nascimento", email: "edileuza18felipe@hotmail.com" },
  { name: "Eduardo Farias da Silva", email: "e.f-celular@hotmail.com" },
  { name: "Elielson Santos de Sena", email: "elielsonsenna1716@gmail.com" },
  { name: "Georgeto da Silva", email: "silva.1987.mae@gmail.com" },
  { name: "Gilberto Ferreira da Silva", email: "gilbertoferreiradasilva317@gmail.com" },
  { name: "Gleyce Keli da Silva Rosa", email: "gleycekelidasilvarosa123@gmail.com" },
  { name: "Ikaro Gabriel Leandro de Sá", email: "euikarodesa@gmail.com" },
  { name: "Janiel Abreu da Silva", email: "janiela241@gmail.com" },
  { name: "Jessica Ingridy da Silva Ferreira", email: "jessica.ingridy@hotmail.com" },
  { name: "Jose Wilson Sales da Silva", email: "wilsonsales2019@gmail.com" },
  { name: "Jucirah de Jesus Gusmão", email: "jucirah2010@hotmail.com" },
  { name: "Junior Meloni de Carvalho", email: "junior.meloni15@gmail.com" },
  { name: "Larissa Stella Zirondi Rios", email: "zirondi.rios@gmail.com" },
  { name: "Luis Edinaldo Vasconcelos Bezerra", email: "luisderff12@gmail.com" },
  { name: "Luiz Magno Marques da Silva", email: "lisamarques173@gmail.com" },
  { name: "Marcos Aparecido Cruz", email: "marcoselaura87@gmail.com" },
  { name: "Marly de Souza", email: "dmarly917@gmail.com" },
  { name: "Rafael do Nascimento Rosa", email: "rafaeldonascimento642@gmail.com" },
  { name: "Rogério Ferreira Rios", email: "rogeriogrorios@gmail.com" },
  { name: "Samuel de Almeida Leão", email: "samuelsamukaleao@gmail.com" },
  { name: "Terezinha Ferreira Vieira", email: "terezinhaferreiravieira317@gmail.com" },
  { name: "Wesley Barbosa", email: "wesleybarbosa8282@gmail.com" },
];

async function main() {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  for (const colaborador of COLABORADORES) {
    const existing = await prisma.user.findUnique({ where: { email: colaborador.email } });
    if (existing) {
      console.log(`ja existe, pulando: ${colaborador.email}`);
      continue;
    }

    await prisma.user.create({
      data: {
        name: colaborador.name,
        email: colaborador.email,
        passwordHash,
        role: "COLLABORATOR",
        active: true,
        mustChangePassword: true,
      },
    });
    console.log(`criado: ${colaborador.name} <${colaborador.email}>`);
  }

  console.log(`\nConcluido. ${COLABORADORES.length} colaboradores processados.`);
  console.log("Nao incluido (dados pendentes): Damiao Alexandre da Silva (sem e-mail).");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
