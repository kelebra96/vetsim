---
name: VetSim
description: Sistema gamificado de simulação de manejo populacional veterinário universitário
colors:
  accent: "#3ab5a0"
  accent-light: "#52c8b4"
  navy-deep: "#0a1628"
  navy-mid: "#111c30"
  navy-teal: "#12302a"
  teal-mid: "#27897a"
  text-inverse: "#deecea"
  text-muted: "#7a9099"
  surface-glass: "#ffffff0e"
  border-subtle: "#ffffff1a"
  amber: "#d4890a"
  blue-stat: "#60a5fa"
  purple-level: "#a78bfa"
  error: "#f87171"
  success: "#6ee7b7"
typography:
  display:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "clamp(1.5rem, 3vw, 2.2rem)"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.3px"
  headline:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.4rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.3px"
  title:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.08rem"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.7rem"
    fontWeight: 700
    letterSpacing: "0.08em"
rounded:
  pill: "999px"
  card: "14px"
  panel: "16px"
  button: "10px"
  input: "8px"
  chip: "6px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "20px"
  lg: "28px"
  xl: "40px"
components:
  button-accent:
    backgroundColor: "{colors.accent}"
    textColor: "#071a17"
    rounded: "{rounded.button}"
    padding: "10px 24px"
  button-accent-hover:
    backgroundColor: "{colors.accent-light}"
    textColor: "#071a17"
    rounded: "{rounded.button}"
    padding: "10px 24px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.accent}"
    rounded: "{rounded.button}"
    padding: "8px 16px"
  nav-link-default:
    backgroundColor: "transparent"
    textColor: "rgba(255,255,255,0.60)"
    rounded: "{rounded.chip}"
    padding: "8px 12px"
  nav-link-active:
    backgroundColor: "rgba(58,181,160,0.14)"
    textColor: "{colors.accent}"
    rounded: "{rounded.chip}"
    padding: "8px 12px"
  card:
    backgroundColor: "{colors.surface-glass}"
    rounded: "{rounded.card}"
    padding: "18px 20px"
  input-field:
    backgroundColor: "rgba(0,0,0,0.20)"
    textColor: "#ffffff"
    rounded: "{rounded.input}"
    padding: "10px 14px"
---

# Design System: VetSim

## 1. Overview

**Creative North Star: "A Arena de Aprendizado"**

VetSim vive num momento de consequência. Cada round que um aluno preenche é uma decisão real com peso real: animais, custo, resultado. O sistema visual não decora essa experiência — ele amplifica a gravidade dela. O fundo é escuro não por moda, mas porque dados populacionais e gráficos de simulação respiram melhor no escuro. O teal acadêmico pulsa como sinal vital, aparecendo onde a ação é concreta: botões de salvar, barras de XP, estados ativos, indicadores de progresso.

O sistema segue a filosofia de **presença antes de decoração**: cada elemento visual precisa justificar sua existência em termos funcionais. Cards têm bordas sutis porque ajudam a definir grupos de informação — não por estética. Gradientes nos botões de ação carregam energia cinética — sinalizam que algo vai acontecer. A gamificação (XP, VIDA, nível, streak) é institucional, não infantil: pill-badges em teal discreto, barras de progresso precisas, números em tabular-nums.

A hierarquia entre professor e aluno se reflete na densidade das telas: alunos vêem uma tarefa clara com contexto gamificado; professores vêem tabelas densas, filtros e ações em batch. O mesmo sistema de design serve os dois sem conflito porque os tokens são consistentes — só a composição muda.

**Key Characteristics:**
- Dark-first com gradiente navy-teal como ambiente permanente, não como acento
- Teal acadêmico usado exclusivamente em estados ativos, ações primárias e indicadores de progresso
- Hierarquia tipográfica funcional: weight 800 para títulos de seção, 700 para títulos de card, 500 para links de navegação, 400 para corpo
- Glass-tonal hybrid para elevação: opacidade tonal nas camadas do dia-a-dia, backdrop-filter apenas nos containers mais proeminentes (login, modais)
- Gamificação com peso acadêmico: métricas visíveis, progressão legível, sem elementos visuais infantis
- Componentes confiantes e táteis: botões com box-shadow de accent glow, inputs com focus glow teal, cards com hover lift sutil

## 2. Colors: A Paleta Acadêmica

Dois polos. O navy universitário define o ambiente: fundo controlado e sério onde dados se destacam. O teal acadêmico marca o que está vivo: ação em andamento, progresso, estados ativos.

### Primary

- **Teal Acadêmico** (`#3ab5a0`): O sinal vital do sistema. Usado exclusivamente em ações primárias (botões CTA, links de round aberto), estados ativos da navegação, barras de XP, rings de focus, e indicadores de progresso. A regra é: se algo requer atenção ou ação imediata, usa teal.
- **Teal Claro** (`#52c8b4`): Extremidade clara do gradiente de ação. Aparece como destino de gradientes em botões accent, barras de progresso e CTA secundários. Nunca usado sozinho como cor de fundo — apenas em gradientes.

### Secondary

- **Teal Médio** (`#27897a`): Ponto médio do gradiente de fundo do corpo da página. Ancora o ambiente geral sem competir com o accent.

### Tertiary

- **Âmbar do Streak** (`#d4890a`): Cor de energia de sequência/streak. Usada exclusivamente no componente de streak diário na sidebar e em avisos de prazo. Não usar em outros contextos.
- **Azul Estatística** (`#60a5fa`): Cor de indicador de dados secundário. Aparece em stat cards de informações complementares (ex: total de rounds, alunos por semestre). Nunca como cor primária de ação.
- **Roxo de Nível** (`#a78bfa`): Cor de progressão de nível. Aparece em badges de nível e conquistas. Reservado para contextos de gamificação de nível alto.

### Neutral

- **Night Navy** (`#0a1628`): Fundo da sidebar e superfície mais escura do sistema. Cria a camada de profundidade máxima.
- **Midnight Lab** (`#111c30`): Início do gradiente de fundo principal do corpo. Cor de fundo de elementos secundários e navbar.
- **Teal Depth** (`#12302a`): Fim do gradiente de fundo do corpo. Dá o charme levemente orgânico ao fundo escuro.
- **Mint White** (`#deecea`): Texto primário sobre fundos escuros. Levemente tintado de teal — não branco puro — para reduzir fadiga ocular em sessões longas.
- **Muted Blue-Gray** (`#7a9099`): Texto secundário e rótulos em contextos de fundo claro. Raramente usado no tema escuro onde opacidades de branco cumprem o papel.
- **Glass Surface** (`#ffffff0e`): Fundo de cards e painéis (rgba(255,255,255,0.055)). A camada tonal padrão para containers de primeiro nível sobre o gradiente.
- **Subtle Border** (`#ffffff1a`): Bordas de cards, separadores de seção, divisores de sidebar (rgba(255,255,255,0.10)).

### Named Rules

**A Regra do Sinal Vital.** O teal acadêmico (`#3ab5a0`) aparece em no máximo 10% de qualquer tela. A sua raridade é o ponto — quando aparece, o usuário sabe que precisa olhar. Nunca usar como cor de fundo de superfícies grandes, decoração, ou texto corrido.

**A Regra do Ambiente Escuro.** O gradiente navy-teal é o fundo permanente da aplicação, não um tema. Nunca introduzir superfícies brancas ou claras como fundo de página. Glass e opacidade de branco criam profundidade sem quebrar o ambiente.

## 3. Typography: Sistema em Peso

**Body/UI Font:** System-ui stack: `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`

**Character:** Uma família única em múltiplos pesos. Títulos em weight 800 com letter-spacing negativo para densidade acadêmica. Rótulos em weight 700 uppercase com tracking generoso para legibilidade em tamanho micro. Corpo em weight 400-500 em tamanho compacto para densidade de informação.

### Hierarchy

- **Display** (weight 800, `clamp(1.5rem, 3vw, 2.2rem)`, line-height 1.1, letter-spacing -0.3px): Saudação de dashboard, hero de XP, títulos de telas principais de boas-vindas.
- **Headline** (weight 800, `1.35rem–1.6rem`, line-height 1.2, letter-spacing -0.3px): Títulos de páginas (`/rounds`, `/register`, `/logs`). Aparece uma vez por tela.
- **Title** (weight 700–800, `1.08rem–1.15rem`, line-height 1.3): Títulos de painéis, cards de seção, cabeçalhos de formulários.
- **Body** (weight 400–500, `0.84rem–0.88rem`, line-height 1.5): Texto descritivo, subtítulos de seção, missões. Linha máxima 65ch em contextos de prosa.
- **Label** (weight 700, `0.62rem–0.78rem`, letter-spacing 0.08em–0.10em, uppercase): Rótulos de seção na sidebar, kickers de painel, nomes de campo de formulário, metadados de round. Reservado para textos de até 4 palavras.

### Named Rules

**A Regra do Peso 800.** Títulos de tela usam weight 800. Títulos de card usam weight 700. Links de navegação usam weight 500–600. Nunca usar 800 em elementos interativos ou rótulos — sinaliza hierarquia de leitura, não de clique.

**A Regra do Tabular.** Todos os valores numéricos (saldo VIDA, XP, contagens de castração, custos) usam `font-variant-numeric: tabular-nums`. Isso impede que os números "pulem" ao serem atualizados e mantém alinhamento em tabelas.

## 4. Elevation

O sistema usa um **híbrido glass-tonal** ao invés de sombras tradicionais empilhadas. A profundidade é comunicada por diferença de opacidade de branco, não por z-axis visual.

**Camadas de profundidade (mais escuro para mais claro):**
1. `#0a1628` (sidebar, topbar mobile) — camada mais profunda
2. `#111c30` (gradiente de fundo) — ambiente geral
3. `rgba(255,255,255,0.04–0.055)` (cards e painéis de conteúdo) — primeira camada de conteúdo
4. `rgba(255,255,255,0.08–0.12)` (hover states, itens focados) — estados elevados
5. `backdrop-filter: blur(5–10px)` (modais, login shell) — superfície máxima de destaque

Sombras aparecem como reforço estrutural nos containers mais proeminentes (login card, modais) e como **accent glow** em botões de ação para comunicar energia cinética.

### Shadow Vocabulary

- **Card Ambient** (`0 10px 30px rgba(0,0,0,0.35)`): Elevação padrão de cards e painéis. Comunica que o elemento está acima do fundo.
- **Modal Structural** (`0 22px 50px rgba(0,0,0,0.35)`): Login shell e diálogos de tela cheia. Separação física clara do fundo.
- **Accent Glow Low** (`0 6px 18px rgba(58,181,160,0.22)`): Botões accent em estado padrão. Comunica potencial de ação.
- **Accent Glow High** (`0 10px 24px rgba(58,181,160,0.35)`): Botões accent em estado hover. Amplifica a energia cinética ao aproximar.
- **Focus Ring** (`0 0 0 3px rgba(58,181,160,0.12)`): Input e select em estado focus. Área de conforto visual ao redor do campo ativo.

### Named Rules

**A Regra do Flat-by-Default.** Superfícies estão planas em estado de repouso. Sombras e glows aparecem apenas em resposta a estado: hover adiciona accent glow, focus adiciona focus ring, modal usa structural shadow. Nunca aplicar sombras em elementos estáticos não-interativos.

## 5. Components

### Buttons

Confiantes e decisivos. Cada botão diz exatamente o que vai acontecer e parece clicável antes de ser clicado.

- **Shape:** Bordas suavemente arredondadas (10px radius). Não circular, não quadrado.
- **Primary (Accent):** Background `linear-gradient(90deg, #3ab5a0, #52c8b4)`, texto `#071a17` (quase preto), padding `10px 24px`, `box-shadow: 0 6px 18px rgba(58,181,160,0.22)`. Nunca usar para ações destrutivas.
- **Primary Hover:** `transform: translateY(-1px)`, `box-shadow: 0 10px 24px rgba(58,181,160,0.35)`, `filter: brightness(1.05)`. O lift comunica responsividade.
- **Ghost:** Background transparente, texto teal, borda `1px solid rgba(58,181,160,0.35)`, background `rgba(58,181,160,0.09)`. Para ações secundárias e links de seção.
- **Dark:** Background `#111c30`, texto `#deecea`, borda sutil branca. Para ações neutras em contexto de formulário.
- **Disabled:** `opacity: 0.5`, `cursor: not-allowed`, sem transform. Nunca remover visualmente — estado disabled precisa ser reconhecível.

### Cards / Containers

- **Corner Style:** 14px radius (cards de conteúdo), 16px (painéis de seção), 18px (hero XP, login shell).
- **Background:** `rgba(255,255,255,0.04–0.055)` — variações de glass surface baseadas em proeminência.
- **Shadow Strategy:** Card Ambient padrão; Modal Structural apenas para containers de tela cheia.
- **Border:** `1px solid rgba(255,255,255,0.08–0.11)` — presente sempre, nunca colorido exceto em estados de focus/active (borda teal em foco).
- **Hover:** `border-color: rgba(58,181,160,0.35)`, `transform: translateY(-2px)` em cards clicáveis. Cards informativos não têm hover.
- **Internal Padding:** `18px 20px` padrão, `10px 14px` em cards compactos (custo, balance).

### Inputs / Fields

- **Style:** Background `rgba(0,0,0,0.18–0.20)`, borda `1px solid rgba(255,255,255,0.09–0.11)`, radius 8–10px, texto branco.
- **Focus:** `border-color: rgba(58,181,160,0.45–0.55)`, `box-shadow: 0 0 0 3px rgba(58,181,160,0.12)`. O focus glow define a área de trabalho ativa.
- **Placeholder:** `rgba(255,255,255,0.20–0.26)` — suficientemente claro para não competir com o valor preenchido.
- **Autofill:** Tratamento especial via `-webkit-box-shadow inset` para manter o tema escuro no autofill do navegador.
- **Error:** Borda `rgba(220,38,58,0.3)`, background sutil vermelho, texto `#fecaca`.

### Navigation (Sidebar)

- **Style:** Sidebar fixa à esquerda, `260px` de largura, background `#0a1628` (mais escura que o fundo da página), borda direita `1px solid rgba(255,255,255,0.07)`.
- **Link default:** Padding `8px 12px`, radius `8px`, cor `rgba(255,255,255,0.60)`, ícone Bootstrap Icons de `0.95rem`.
- **Link hover:** Background `rgba(255,255,255,0.07)`, cor branco total. Transição `150ms`.
- **Link active:** Background `rgba(58,181,160,0.14)`, cor `#3ab5a0`, weight 600. O teal no active é o único uso de cor de destaque na navegação.
- **Brand area:** Logo + nome em weight 800, cor branca, padding `1.25rem`.
- **HUD (alunos):** Saldo VIDA e XP com ícone teal, valores em `rgba(255,255,255,0.80)`, rótulos em `rgba(255,255,255,0.45)`.
- **Mobile:** Sidebar se transforma em drawer com overlay (`rgba(0,0,0,0.55)`), ativado por botão de menu no topbar fixo de 52px.

### Status Badges

- **Open/Active:** Background `rgba(58,181,160,0.14)`, borda `rgba(58,181,160,0.25)`, texto `#3ab5a0`. Sinaliza que ação é possível agora.
- **Closed/Inactive:** Background `rgba(220,38,58,0.12)`, borda `rgba(220,38,58,0.20)`, texto `#f87171`. Sinaliza que a janela de ação passou.
- **Positive delta:** `#6ee7b7` — ganho populacional, crescimento favorável.
- **Negative delta:** `#fca5a5` — perda, resultado desfavorável.
- **Shape:** Pill (`border-radius: 999px`), padding `0.3rem 0.85rem`.

### XP Bar (Componente Signature)

Barra de progresso de XP do semestre — elemento central da gamificação. Altura 8px, background `rgba(255,255,255,0.18)`, fill com `linear-gradient(90deg, #3ab5a0, #52c8b4)`, radius `999px`, transição `width 600ms ease`. Nunca animar `width` em outros contextos — essa transição lenta é intencional e reservada para progressão gamificada.

### Toasts

- **Position:** `fixed` canto superior direito, `z-index: 1080`, pointer-events habilitados.
- **Variants:** Success (`rgba(30,110,98,0.92)`), Warn (`rgba(180,120,20,0.92)`), Error (`rgba(160,38,58,0.92)`), Default (`rgba(0,0,0,0.65)`).
- **Entrance:** `opacity 0→1 + translateY(-6px)→0`, `220ms ease-out`.

## 6. Do's and Don'ts

### Do:

- **Do** usar `#3ab5a0` exclusivamente em ações primárias, estados ativos e indicadores de progresso. Sua raridade é o que dá poder à cor.
- **Do** aplicar `font-variant-numeric: tabular-nums` em todos os valores numéricos: saldo, XP, contagens, custos.
- **Do** construir empty states com ícone, título explicativo e um CTA claro — nunca deixar área em branco sem instrução.
- **Do** usar `border-radius: 999px` em badges de status, pills de XP e indicadores de streak — pill shapes pertencem à gamificação.
- **Do** aplicar focus ring teal (`outline: 2px solid #3ab5a0; outline-offset: 2px`) em todos os elementos interativos para acessibilidade e consistência visual.
- **Do** usar `transform` e `opacity` para animações — nunca `width`, `height`, `padding` ou `margin`.
- **Do** incluir `@media (prefers-reduced-motion: reduce)` para cada animação — alguns alunos têm sensibilidade a movimento.
- **Do** usar `text-wrap: balance` em títulos h1–h3 para evitar quebras de linha ímpares.

### Don't:

- **Don't** usar Bootstrap out-of-the-box sem tematização — nenhuma superfície branca, azul primária Bootstrap, ou border padrão deve aparecer no app.
- **Don't** usar gamificação cartunesca: sem confetti nas ações, sem mascotes durante preenchimento de dados, sem animações bounce ou elastic — o assunto é sério.
- **Don't** usar `border-left` maior que 1px como acento colorido em cards, alertas ou itens de lista. Use background tint ou sem borda decorativa.
- **Don't** usar `background-clip: text` com gradiente. Texto usa cor sólida. Ênfase via peso ou tamanho.
- **Don't** vazar estética de landing page SaaS para dentro do app: sem fundos cream ou off-white, sem fotografias de estilo de vida, sem copy inspiracional em títulos de página.
- **Don't** usar ERP-style (campos cinza em fundo branco, tabelas com zebra-stripe em cinza claro) — manter o vocabulário dark glass em todas as telas.
- **Don't** usar `transition: width` em elementos de UI genéricos — reservado exclusivamente para barras de XP.
- **Don't** usar display fonts (serifa, script, decorativa) em labels, botões ou dados — o sistema usa uma família sem-serifa em múltiplos pesos.
- **Don't** adicionar sombras em elementos estáticos não-interativos — sombras comunicam interatividade e elevação, não decoração.
