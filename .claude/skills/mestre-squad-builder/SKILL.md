---
name: mestre-squad-builder
description: Cria autonomamente a estrutura completa de squads multi-agente para Claude Code — arquitetura, infraestrutura, filosofia de experiência e organização operacional — sem o usuário precisar pedir cada peça.
---

# Squad Builder — Construção Autônoma de Sistemas Multi-Agente

## Missão

Você cria squads completos de forma autônoma. O usuário não deve precisar pedir arquivos manualmente, explicar infraestrutura, definir arquitetura ou descrever padrões de organização. Você detecta estrutura, ferramentas, filosofia, fluxo e infraestrutura — e constrói tudo sozinho.

Um squad não é um conjunto de agentes com scripts. É um sistema operacional especializado: arquitetura coordenada, experiência consistente, ecossistema multi-agente. O objetivo não é apenas funcionar — é coerência, escalabilidade, reutilização e autonomia operacional.

---

## Princípios invioláveis

**1. Orquestrador não executa.** O `CLAUDE.md` define que o orquestrador decompõe, delega, coordena e sintetiza. Nunca faz o trabalho diretamente.

**2. Sub-agentes têm escopo único.** Cada agente tem uma responsabilidade. Se um agente faz X *e* Y, são dois agentes.

**3. Skills são procedurais; agentes são executores.** Skills explicam *como* fazer; agentes executam tarefas específicas.

**4. Saída sempre estruturada.** Sub-agentes retornam JSON, YAML ou schema estrito — nunca texto solto imprevisível.

**5. Secrets nunca globais.** Chaves sempre em `.env`, carregadas via `python-dotenv`. Nunca hardcoded, em shell global, `.bashrc` ou `.zshrc`.

**6. Infraestrutura é automática.** Você cria `.env`, `.gitignore`, `requirements.txt`, `outputs/`, `inputs/`, `scripts/`, assets, manifests e helpers sem o usuário pedir.

**7. Sistemas perceptivos precisam de consistência.** Se o squad gera imagens, vídeos, textos, apresentações, landing pages, dashboards, PDFs ou qualquer output multimídia, você cria automaticamente um sistema de consistência (visual grammar, writing system, UX rules, output spec, design language). O sistema não pode depender de prompts isolados.

---

## Fase 1 — Reconhecimento de contexto

Liste arquivos com `ls -la`. Se houver `CLAUDE.md`, `.claude/agents/` ou `.claude/skills/`, leia para entender padrão arquitetural, naming e topologia existente. Se a pasta estiver vazia, aplique o padrão default desta skill. Resuma em uma frase o que será criado.

---

## Fase 2 — Entrevista adaptativa

Faça perguntas em pares (máximo 2 por vez). Se o briefing inicial já respondeu algo, avance sem repetir.

1. **Objetivo.** Qual o objetivo final do squad? Que problema concreto resolve?
2. **Input/Output.** Qual input típico? Qual output esperado? Onde salvar?
3. **Decomposição.** Quais sub-tarefas independentes existem (3 a 8)?
4. **Topologia.** Fluxo sequencial, paralelo ou híbrido? Desenhe em texto.
5. **Skills reutilizáveis.** Que conhecimento procedural merece virar skill?
6. **Ferramentas e modelos.** Que ferramentas cada agente precisa? Algum exige modelo mais forte?

### Arquitetura de experiência (obrigatória antes de gerar agentes)

Defina explicitamente e propague para todos os agentes e skills:

- `creative_philosophy` — visual-first, texto-first, automação-first, análise-first, UX-first
- `output_philosophy` — o que define qualidade neste sistema
- `experience_mode` — estética e percepção desejadas
- `communication_style` — tom e voz
- `density_profile` — quanta informação por unidade
- `consistency_rules` — o que precisa permanecer constante entre outputs

### Detecção autônoma de infraestrutura (não pergunta — detecta)

| Sinal detectado | Cria automaticamente |
|---|---|
| APIs externas (OpenAI, Anthropic, OpenRouter, Gemini, webhooks, tokens) | `.env`, `.env.example`, `.gitignore`, `python-dotenv` |
| Scripts Python (Pillow, Pandas, requests, OpenCV, NumPy) | `requirements.txt`, `scripts/` |
| Outputs (exportar, salvar, gerar, renderizar) | `outputs/`, manifests, convenção por timestamp |
| Inputs (upload, imagens, PDFs, planilhas) | `inputs/` com subpastas organizadas |

---

## Fase 3 — Arquitetura do squad

Defina agentes, skills, topologia, fluxo, responsabilidades, contratos JSON e dependências.

---

## Fase 4 — Geração da estrutura

Gere automaticamente: `CLAUDE.md`, `.claude/agents/...`, `.claude/skills/...`, `.env`, `.env.example`, `.gitignore`, `requirements.txt`, `scripts/`, `inputs/`, `outputs/`, `assets/` e manifests.

---

## Fase 5 — Contratos e consistência

Todo agente deve declarar: escopo único, input, output, regras, limites e JSON estrito.
Toda skill deve declarar: quando usar, regras, exemplos, padrões e boas práticas.

---

## Manual final obrigatório

Sempre entregue ao fim: arquitetura final, fluxo do sistema, agentes criados, skills criadas, variáveis necessárias, comandos de execução, custo estimado, próximos passos e checklist de configuração.

---

## Regra final

Você não é um gerador de arquivos. Você é um arquiteto de sistemas multi-agente completos.
