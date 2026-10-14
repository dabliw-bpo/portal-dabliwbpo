# Controle de ponto digital — pesquisa preliminar (14/10/2026)

Objetivo: levantar o que o portal precisa ter para os colaboradores registrarem o ponto de qualquer
lugar, com geolocalização, incluindo motoristas, carga horária e banco de horas. **Isto é pesquisa,
não parecer jurídico**: as fontes são em boa parte artigos de consultorias e fornecedores; os pontos
marcados com ⚠ precisam ser conferidos no texto oficial e na convenção coletiva (CCT) da categoria
antes de qualquer regra virar código.

Contexto do portal hoje: 28 colaboradores ativos, todos da AMMLOG (transportadora), mais 2 admins na
Matriz. O cadastro do usuário não tem cargo, tipo de vínculo nem jornada contratual.

---

## 1. Base legal que governa o sistema de ponto

| Norma | O que decide |
|---|---|
| CLT art. 74 §2º (Lei 13.874/2019) | Registro de entrada e saída obrigatório em estabelecimento com **mais de 20 trabalhadores**; pode ser manual, mecânico ou eletrônico; permite pré-assinalar o intervalo. |
| Portaria MTP 671/2021 | Define os 3 registradores eletrônicos: REP-C (relógio), REP-A (alternativo, exige acordo/convenção coletiva) e **REP-P (programa/aplicativo, não exige acordo coletivo)**. |
| TST Súmula 338 | Sem os controles, presume-se verdadeira a jornada alegada pelo trabalhador; cartões com horários uniformes ("britânicos") perdem valor como prova. |
| Lei 13.103/2015 + ADI 5322 (STF) | Regime do motorista profissional empregado (seção 4). |

⚠ Fontes secundárias citam alterações recentes (Portaria 1.131/2025, sobre multas). Conferir a
versão consolidada da Portaria 671.

## 2. Funcionalidades — o que o sistema precisa ter

### 2.1 Exigências do REP-P (Portaria 671/2021)

1. **Identificação individual** do trabalhador em cada marcação; o sistema não pode permitir marcar por
   outra pessoa nem qualquer dispositivo que permita ao empregado alterar o dado gravado (art. 74).
2. **Marcação imutável**: número sequencial (NSR), data, hora **com fuso horário** e **hash SHA-256**.
   O programa de tratamento só pode *acrescentar* informação (faltas, banco de horas) ou sinalizar
   marcação indevida; não reescreve o original (arts. 74 e 82).
3. **Hora confiável**: relógio sincronizado com a Hora Legal Brasileira (Observatório Nacional), com
   variação máxima de 30 s (Anexo IX). Marcação offline só em caráter excepcional, preservando data e
   hora da operação e enviada quando voltar a conexão.
4. **Comprovante de Registro de Ponto do Trabalhador** (art. 79), em PDF, disponível após cada marcação
   e com a consulta das últimas 48 h (art. 80): título, NSR, identificação do empregador, nome e CPF do
   trabalhador, data e hora, hash e — **em atividade externa — o local da prestação do serviço**
   (art. 79, IV). ⚠ Assinatura digital do comprovante no REP-P: citada por fontes secundárias.
5. **Espelho de ponto** mensal acessível ao trabalhador, eletrônico ou impresso (art. 84, parágrafo único).
6. **Arquivos fiscais**: AFD (Arquivo Fonte de Dados, Anexo V) e AEJ (Arquivo Eletrônico de Jornada,
   Anexo VI), assinados com certificado ICP-Brasil, gerados e entregues quando a fiscalização pedir
   (arts. 81 a 85).
7. **Conformidade formal do programa**: certificado de registro do programa no **INPI**, **Atestado
   Técnico e Termo de Responsabilidade** do desenvolvedor (o empregador só pode usar o sistema se o
   tiver) e certificados ICP-Brasil (arts. 88, 89 e 91).
8. **Vedações** (art. 74): restringir a marcação, marcação automática, exigir autorização prévia para
   marcar hora extra.

> **Ponto de decisão nº 1.** O item 7 é o que pesa: construir o ponto dentro do portal implica obter o
> registro no INPI, o atestado técnico e o certificado digital para assinar AFD/AEJ. O caminho
> alternativo é integrar uma solução de mercado já conforme e usar o portal como porta de entrada.

### 2.2 Funcionalidades de gestão (não são exigência legal, mas sem elas o ponto não fecha)

- **Cadastro da jornada contratual** por colaborador: dias, entrada, saída, intervalo, carga semanal e
  regime (jornada fixa, 12x36, flexível, externo com controle).
- **Calendário de feriados** (o gerador de atividades já sofre com a falta dele).
- **Tratamento de ocorrências**: esquecimento de marcação, atestado, falta justificada, folga de
  compensação — sempre como *lançamento novo* com justificativa e aprovação, nunca sobrescrevendo a
  marcação original (trilha de auditoria).
- **Cálculo da jornada**: horas trabalhadas, extras, adicional noturno, atrasos dentro da tolerância,
  interjornada, DSR.
- **Alertas** para o colaborador e o gestor (jornada sem saída, intervalo não cumprido, excesso de horas).
- **Fechamento mensal**: espelho de ponto, banco de horas, exportação para a folha e **aceite/assinatura
  do espelho pelo colaborador** (reaproveita o módulo de assinatura com trilha de auditoria e selfie).
- **Relatórios** por empresa, por colaborador e para a fiscalização (AFD/AEJ).

### 2.3 Geolocalização

**O que a norma exige:** a Portaria 671 não impõe coordenada de GPS; exige o *local da prestação* no
comprovante quando o trabalho é externo (art. 79, IV). A geolocalização é uma camada de prova adicional,
decisão do empregador. O art. 100 menciona sistemas como rastreamento por satélite como meio admitido
quando o Auditor-Fiscal solicitar.

**O que registrar a cada marcação:** latitude, longitude, precisão (m), carimbo de hora do servidor, e
(opcional) endereço aproximado e o estabelecimento/área de trabalho (cerca virtual).

**Regras de uso (LGPD e jurisprudência):**
- Coletar **somente no instante da marcação**, nunca rastreamento contínuo e nunca fora da jornada;
  nada durante intervalos e repousos.
- Aviso de privacidade específico (finalidade, quem acessa, por quanto tempo), minimização e prazo de
  retenção definidos; acesso restrito a RH/admin.
- O TST (SDI-2, ROT-23218-21.2023.5.04.0000) aceitou geolocalização como prova de jornada por ser
  adequada, necessária e proporcional, **limitada aos horários alegados**.
- Base legal: o registro de jornada decorre de obrigação legal; para a localização há divergência entre
  consentimento e execução do contrato — ⚠ definir com o jurídico e fazer o relatório de impacto (RIPD).
- Aparelho: a tendência é exigir equipamento da empresa ou acordo/indenização pelo uso do particular.

**Antifraude (prática de mercado, sem avaliação independente):** selfie na marcação (o portal já tem a
captura de selfie da assinatura), horário do servidor e não do aparelho, vínculo da conta ao dispositivo,
comparação marcação × cerca virtual × histórico, e marcação fora da área sempre permitida porém
**sinalizada** (a norma proíbe bloquear a marcação). Limite técnico: em navegador/PWA não há como
detectar GPS falso com segurança.

## 3. Marcações adequadas para motoristas

A jornada do motorista não é só "entrada/saída": há tempos diferentes com tratamento diferente. As
fontes (Lei 13.103 e a prática dos sistemas de ponto "modo motorista") convergem nesta lista:

| Marcação (evento) | Conta como jornada? | Para que serve |
|---|---|---|
| Início de jornada / Fim de jornada | Delimita a jornada | Base de tudo, incluindo interjornada |
| Início / fim de **direção** | Sim | Controle da direção contínua (máx. 5h30) e da pausa de 30 min |
| Início / fim de **espera** (fila de carga, descarga, fiscalização) | **Sim**, desde a ADI 5322 | Antes excluído da jornada e indenizado a 30% — hoje deve ser registrado como trabalho |
| Início / fim de **refeição** (intervalo intrajornada) | Não | Mínimo de 1 h; sujeito a ajuste por norma coletiva |
| Início / fim de **descanso / pausa de direção** | Não | 30 min a cada 6 h de direção (carga) ou 4 h (passageiros) |
| **Pernoite / repouso interjornada** | Não | 11 h ininterruptas entre jornadas |
| Repouso semanal | Não | 35 h (24 h + 11 h) |
| Tempo de reserva (dupla no veículo) | ⚠ | ⚠ Status do dispositivo divergente entre as fontes — conferir texto vigente |

Cada marcação deve guardar **local** (coordenadas), pois o trabalho é externo, e o sistema deve
exigir **pares coerentes** (quem abre uma espera precisa fechá-la).

**Meios de controle previstos em lei** (Lei 13.103, art. 2º, V, "b"; CLT art. 235-C §§14 e 15): diário
de bordo, papeleta, ficha de trabalho externo, ou sistemas e meios eletrônicos instalados nos
veículos; os dados podem ser enviados à distância a critério do empregador. A responsabilidade pela
exatidão das anotações é do motorista; o meio de coletar é do empregador. O ponto pelo celular é um
meio eletrônico adequado, mas ⚠ **não substitui** o registrador de velocidade e tempo (tacógrafo)
exigido pelo CTB, que é outro controle.

**Art. 62, I da CLT (trabalho externo sem controle de horário):** a jurisprudência tem entendido que
alegar trabalho externo **não basta**, porque hoje há meios eletrônicos de controle. Para motorista com
celular/rastreamento, o enquadramento no art. 62 é de difícil defesa — o desenho seguro é controlar.

## 4. Regras do motorista profissional (Lei 13.103/2015, pós-ADI 5322)

| Tema | Regra |
|---|---|
| Jornada | 8 h diárias, 44 h semanais; prorrogação de até **2 h extras**, ou até **4 h por convenção/acordo coletivo** (mantido pelo STF). Jornada flexível sem horário fixo e 12x36 **por norma coletiva** também mantidas. |
| Direção contínua | Máx. **5h30**; 30 min de pausa a cada 6 h de direção (carga) ou a cada 4 h (passageiros); pode ser fracionada. Mantido pelo STF (CTB art. 67-C). |
| Intervalo intrajornada | Mínimo de 1 h de refeição; redução/fracionamento só por norma coletiva (CLT art. 71 §5º, mantido). |
| **Interjornada** | **11 h ininterruptas.** O STF derrubou o fracionamento e a coincidência com as paradas obrigatórias. |
| **Descanso semanal** | **35 h** ininterruptas, **sem fracionar nem acumular** e podendo ser gozado onde o motorista estiver (a regra de gozo só no retorno à base foi derrubada). |
| **Tempo de espera** | **Conta como jornada**; a exclusão da jornada e a indenização de 30% foram derrubadas. ⚠ Fontes divergem sobre o valor (hora normal × hora extra); conferir acórdão e CCT. |
| Dupla de motoristas | Repouso com o veículo em movimento foi derrubado: o descanso deve ser com o veículo parado. |
| Efeitos | Acórdão publicado em 30/08/2023; ⚠ fonte setorial informa embargos julgados em 11/10/2024 com efeitos a partir de **12/07/2023**. |

Alertas que o sistema precisa gerar: direção contínua > 5h30; pausa de 30 min não cumprida; interjornada
< 11 h; DSR < 35 h; extras acima do teto (2 h ou 4 h); espera registrada como descanso.

## 5. Carga horária — regras gerais (CLT)

| Tema | Regra |
|---|---|
| Duração | 8 h/dia e **44 h/semana** (CF art. 7º, XIII); extras limitadas a 2 h/dia (CLT art. 59) com adicional mínimo de 50%. |
| Intervalo intrajornada | Jornada > 6 h: mínimo **1 h** (máx. 2 h); jornada de 4 a 6 h: **15 min** (art. 71). Supressão: indenização do período suprimido com +50% (art. 71 §4º). |
| Interjornada | **11 h** consecutivas entre duas jornadas (art. 66). |
| Descanso semanal | **24 h** consecutivas, preferencialmente aos domingos (art. 67). |
| Noturno (urbano) | 22h–5h, adicional de **20%** e hora de **52 min 30 s** (art. 73). |
| Tolerância | Variações de até **5 min** por marcação, limite de **10 min por dia**, não são descontadas nem computadas como extra (art. 58 §1º). Passou do limite, **todo** o tempo é extra (Súmula 366). ⚠ Há divergência sobre elastecer a tolerância por norma coletiva (Súmula 449 × decisão de 2023 da 5ª Turma do TST). |
| 12x36 | Por acordo individual escrito ou norma coletiva (art. 59-A). |
| Pré-assinalação | O intervalo pode vir pré-assinalado no registro (art. 74 §2º). |

## 6. Banco de horas

| Tema | Regra (CLT art. 59, reforma de 2017) |
|---|---|
| Acordo individual escrito | Compensação em até **6 meses** (§5º). |
| Convenção ou acordo coletivo | Compensação em até **12 meses**. |
| Compensação no mesmo mês | Aceita acordo individual, tácito ou escrito (§6º) — prova do acordo tácito é difícil; preferir escrito. |
| Limites | Jornada diária com extras ≤ 10 h; ⚠ para motorista vale o teto da seção 4 (2 h, ou 4 h por norma coletiva). |
| Saldo não compensado | Na rescisão ou ao fim do prazo, paga-se como hora extra (§3º). |
| Descumprimento formal | O art. 59-B afasta a repetição do pagamento das horas, mas o adicional continua devido. |
| Ônus da prova | É do empregador demonstrar a compensação dia a dia — por isso o saldo precisa ser individual e auditável. |

**O que o sistema precisa fazer:** manter **saldo individual** (créditos e débitos) por colaborador;
guardar a **base do acordo** (individual escrito, CCT/ACT) e sua vigência; **vencer** créditos em 6/12
meses e sinalizar antes; separar horas compensáveis de horas que já são pagas (extras acima do teto,
noturno, feriado, DSR); mostrar o saldo no espelho e no portal do colaborador; zerar/pagar no
fechamento ou na rescisão.

⚠ **Tudo isso depende da convenção coletiva** do transporte rodoviário de cargas aplicável à AMMLOG
(jornada, banco de horas, tolerância, intervalo, tempo de espera). A CCT prevalece em vários pontos e
precisa ser lida antes de definir as regras.

## 7. O que já existe no portal e pode ser reaproveitado

- Autenticação por colaborador, papéis e recorte por empresa/departamento.
- Captura de **selfie** e **geração de PDF com hash** (módulo de assinatura) — base para a selfie na
  marcação e para o comprovante e o espelho.
- **Assinatura manuscrita com relatório de auditoria** — aceite mensal do espelho.
- E-mail (Gmail), **cron diário**, tela "Minhas atividades" e módulo de tarefas.
- Faltam: cadastro de jornada, cargo/vínculo, feriados, eventos de marcação, cálculo e banco de horas.

## 8. Decisões que precisam ser tomadas antes de construir

1. **Conformidade REP-P:** construir (INPI + atestado técnico + ICP-Brasil) ou integrar solução de
   mercado e manter o portal como interface?
2. **Escopo:** só a AMMLOG (28 colaboradores) ou todas as empresas atendidas?
3. **CCT da categoria:** obter a convenção/acordo coletivo vigente da AMMLOG.
4. **Motoristas:** quantos são, carga ou passageiros, urbano ou viagem longa, usam tacógrafo/rastreador?
5. **Geolocalização:** obrigatória ou apenas registrada? selfie obrigatória? bloquear fora da cerca
   (a norma proíbe restringir a marcação — o desenho é sinalizar)?
6. **Aparelho:** celular pessoal ou da empresa?
7. **Banco de horas:** acordo individual escrito (6 meses) ou coletivo (12 meses)?
8. **Retenção e privacidade:** prazo de guarda (a prescrição trabalhista é de 5 anos; a prática é
   guardar mais), aviso de privacidade e RIPD, validados pelo jurídico.

## 9. Sugestão de fases

- **Fase 0 — Jurídico e CCT:** decisões acima; leitura da convenção; definição do caminho REP-P.
- **Fase 1 — Marcação:** cadastro de jornada e feriados, marcação com hora do servidor, localização,
  selfie opcional, comprovante em PDF com hash, histórico do colaborador.
- **Fase 2 — Motorista:** eventos (direção, espera, refeição, descanso, pernoite), pares coerentes,
  alertas da Lei 13.103.
- **Fase 3 — Fechamento:** cálculo da jornada, ocorrências com aprovação, banco de horas, espelho
  mensal com aceite, AFD/AEJ e exportação para a folha.

---

## Fontes

- Portaria MTP 671/2021 (texto): https://www.normaslegais.com.br/legislacao/portaria-mtp-671-2021.htm
- Portaria 671 — guias: https://www.ortep.com.br/portaria-671-guia-completo/ ,
  https://solides.com.br/blog/portaria-671/
- Anexo IX (REP-P) citado por: https://tdn.totvs.com.br/download/attachments/809504336/ANEXO-IX-REQUISITOS-DO-REGISTRADOR-ELETRONICO-DE-PONTO-VIA-PROGRAMA-REP-P.pdf?api=v2
- ADI 5322 — NTC&Logística: https://www.portalntc.org.br/a-decisao-do-stf-na-adi-5322-e-as-alteracoes-na-lei-do-motorista/
- ADI 5322 — acórdão (TRT-3): https://portal.trt3.jus.br/internet/jurisprudencia/repercussao-geral-e-controle-concentrado-adi-adc-e-adpf-stf/downloads/adi-5322-acordao.pdf
- ADI 5322 — embargos e modulação: https://setcommg.com/stf-encerra-o-julgamento-dos-embargos-de-declaracao-e-modula-os-efeitos-da-adi-5322/
- Lei 13.103/2015 (texto atualizado): https://www2.camara.leg.br/legin/fed/lei/2015/lei-13103-2-marco-2015-780193-normaatualizada-pl.html
- Controle de jornada do caminhoneiro (Conjur): https://www.conjur.com.br/2023-ago-29/barbara-freitas-cabe-controle-jornada-caminhoneiro2//?print=1
- Banco de horas e tolerância: https://www.pontotel.com.br/artigo-59-clt/ ,
  https://www.contabilidadezen.com.br/blog/banco-de-horas-regras-implementacao-2026/ ,
  https://conexaotrabalho.portaldaindustria.com.br/noticias/detalhe/trabalhista/-geral/5-turma-do-tst-e-valida-norma-coletiva-que-flexibilizava-tolerancia-de-5-minutos-para-bater-o-ponto/
- Art. 74 CLT e Súmula 338: https://www.peticoesonline.com.br/art-74-clt
- Geolocalização como prova (TST): https://www.hondatar.com.br/geolocalizacao-de-celulares-corporativos-passa-a-ser-usada-como-prova-na-justica-do-trabalho/
- Marcação "modo motorista": https://documentacao.senior.com.br/seniorxplatform/manual-do-usuario/hcm/marcacao-de-ponto/marcacao-ponto-modo-motorista
- Interjornada do motorista: https://www.pontotel.com.br/interjornada-motorista/
