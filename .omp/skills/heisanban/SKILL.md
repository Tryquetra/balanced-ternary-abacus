---
name: heisanban
description: "Trabalhar no Hei-San-Ban, o ábaco ternário balanceado: repositório Tryquetra/balanced-ternary-abacus (site em bta.robsoncassiano.software, clone local em /home/robson/coding/heisanban), app estático com 7 hastes, trits -1/0/+1, i18n PT/EN, PWA offline e deploy em Cloudflare Pages; inclui o modelo físico do ábaco no Blender (script paramétrico verificado, export STL para impressão 3D). Use quando o pedido envolver esse repo, o ábaco ternário, o modelo 3D ou a versão imprimível. Triggers: heisanban, hei-san-ban, ábaco ternário, ábaco balanceado, balanced ternary abacus, bta.robsoncassiano.software, balanced-ternary-abacus, trit, hastes 729, modelo 3D do ábaco, ábaco para impressão 3D, STL do ábaco, Blender ábaco."
triggers:
  - heisanban
  - hei-san-ban
  - ábaco ternário
  - ábaco balanceado
  - balanced ternary abacus
  - bta.robsoncassiano.software
  - balanced-ternary-abacus
  - trit
  - modelo 3D do ábaco
  - ábaco impressão 3D
  - STL do ábaco
  - Blender ábaco
---

# Hei-San-Ban — ábaco ternário balanceado

Simulador web de ábaco ternário balanceado (trits −1, 0, +1) com 7 hastes,
±1093, guias didáticos e conversão decimal. Tem também um modelo físico
paramétrico para impressão 3D, gerado no Blender.

## 1. Repositório

| | |
|---|---|
| Repo | `github.com/Tryquetra/balanced-ternary-abacus` (branch `main`) |
| Clone local | `/home/robson/coding/heisanban` |
| Produção | `https://bta.robsoncassiano.software/` (Cloudflare Pages) |
| Stack | HTML + JS puro, Tailwind via CDN, Bun no dev, sem build |
| Testes | `bun test` (10 testes em `tests/ternary-math.test.js`) |

**Cuidado:** existe um clone obsoleto em `/home/robson/coding/balanced-ternary-abacus`
(mesmo remote, parado em `eb2fc91`, 2026-09-13, histórico divergente do atual).
Não edite lá. O diretório ativo é `/home/robson/coding/heisanban`, com a skill
em `.omp/skills/heisanban/` versionada junto do código.

```bash
cd /home/robson/coding/heisanban
bun test                    # 10 testes
bun server.js               # http://localhost:8000 (porta fixa, ignora PORT)
git log --oneline -5
```

## 2. Arquitetura

| Arquivo | Papel |
|---|---|
| `index.html` | markup, metas SEO/OG, JSON-LD (WebApplication, Person, FAQPage), CSP em meta |
| `assets/js/ternary-math.js` | núcleo puro: `decimalToBalanced`, `balancedToDecimal`, `invertTrits`, `addTrits`, `getCapacity`; exporta `window.TernaryMath` via UMD |
| `assets/js/app.js` | estado do ábaco, contas, notação, acordeão dos guias, i18n do conteúdo (~600 linhas) |
| `assets/js/main.js` | idioma, tema, menu, registro do service worker (~330 linhas) |
| `assets/css/styles.css` | tokens, moldura, temas claro/escuro, utilidades |
| `service-worker.js` | precache, navegação network-first, CDN em runtime cache |
| `functions/_middleware.js` | log de borda + `X-Edge-Served-By` |
| `_headers` | fonte única dos headers de segurança e do CSP |
| `wrangler.toml` | `pages_build_output_dir = "."` |
| `AGENTS.md` | regras de SEO/AEO e performance do repo |
| `conductor/` | guias de estilo e produto |

Modelo de dados: `rodValues[0..6]`, índice 0 = 3⁰ (menos significativa),
mas a moldura coloca a mais significativa à **esquerda** (`prepend` com `i`
crescente). Cada haste tem duas contas: cima = +1, baixo = −1, ambas = 0,
nenhuma = 0. `updateDisplay` soma `rodValues[i] * 3**i`.

## 3. Convenções que o repo exige

- **i18n em dois lugares.** Texto de conteúdo vai em `translations` do `app.js`;
  texto de UI/menu vai em `translations` do `main.js`. Os dois arquivos precisam
  ficar em paridade. O `main.js` chama `window.setPageLanguage()` do `app.js`.
- **Versão dos ativos.** `index.html` referencia CSS/JS com `?v=YYYYMMDD`. O SW
  usa a URL exata como chave de cache, então **toda mudança de CSS/JS precisa
  bumpar o `?v=`**, senão quem já tem o SW continua no arquivo antigo.
- **Sem build.** Tailwind vem do Play CDN. Não introduza bundler sem decisão
  explícita: o deploy é o diretório como está.
- **Headers de segurança só em `_headers`.** O middleware não repete CSP.
- **Commits por escopo**, convenção `fix(area):`/`feat(area):`/`docs:`. O repo
  tem 7 commits de 2026-10-28 como referência de granularidade.
- **Idioma padrão é PT.** `?lang` → `localStorage` → `<html lang>` → pt. A URL
  canônica de PT não leva parâmetro; EN é `?lang=en-us`, igual ao hreflang.

## 4. Armadilhas já pagas

1. `caches.match(request, { ignoreSearch: true })` anulava o `?v=`. Hoje a chave
   é exata (commit `de9fc4f`). Não reintroduza `ignoreSearch`.
2. O estado recolhido dos guias usava a classe `hidden` do Tailwind. Sem CDN,
   os quatro abriam com `aria-expanded=false`. Há regra `.hidden` própria no CSS.
3. O acordeão era quatro `wireToggle` independentes: os painéis empilhavam
   (`<main>` de 840px a 2701px). Hoje `registerAccordionItem` fecha os irmãos.
4. `role="img"` com `aria-label` fixo escondia o valor do leitor de tela. A
   notação usa `<sup>` com `aria-hidden` mais um `<span class="sr-only">` falado.
5. `document.title` era sobrescrito pelo nome curto. Existe `document-title`
   por idioma.
6. O formulário de conversão tinha validação nativa (`min`/`max`) que bloqueava
   o submit antes do clamp em JS. Hoje é `novalidate` e o JS ajusta o valor.
7. Tailwind e MathJax vêm de CDN. O SW guarda os dois em `runtime-cache`
   (aceitando resposta opaca), senão o app abre sem estilo offline.
8. `functions/_middleware.js` roda em toda requisição, inclusive `/assets/*`.
   Não há `_routes.json`; se a latência incomodar, é por aí.
9. MathJax só é carregado quando um guia abre. Não mova para o `<head>`.
10. `server.js` ignora `PORT` e escuta 8000.

## 5. Modelo físico e Blender

A receita completa está em `skill://heisanban/blender-abaco.md` e o gerador
verificado em `skill://heisanban/scripts/abacus_model.py`.

Resumo do que já está decidido:

- Mecanismo de soroban: duas contas deslizantes por haste contra uma barra
  central. É o único que preserva a demonstração `1 + (−1) = 0`.
- Moldura impressa, contas e hastes compradas (conta Ø16 mm com furo 4 mm,
  dowel 4 mm). O atrito conta/haste é a interface crítica; FDM varia demais.
- 7 hastes, passo 25 mm, curso 45 mm, moldura 186 × 132 × 30 mm.
- Haste mais significativa à esquerda (729), igual ao app.

Ambiente Blender já instalado nesta máquina:

```bash
blender                       # 4.5.15 LTS portátil, ~/.local/bin/blender
# addon "MCP for Blender" habilitado em ~/.config/blender/4.5/scripts/addons/
# servidor do addon: localhost:9876, sobe junto com o Blender
```

Ferramentas MCP `blender_*` (`get_scene_info`, `execute_blender_code`, `look`,
`get_addon_status`, `import_asset`, `search_assets`, `generate_3d`,
`record_trajectory_feedback`, `disable_telemetry`) aparecem só com o Blender
aberto. Sem Blender, o servidor conecta e falha ao falar com o addon.

Fluxo recomendado:

1. Abrir o Blender (`blender`), conferir `get_addon_status`.
2. `execute_blender_code` com `exec(open('<skill>/scripts/abacus_model.py').read())`
   e depois `info = build()` e `apply_value(42)`.
3. Conferir com `look` (render) antes de exportar.
4. Exportar STL por peça (`export_all`) ou fatiar direto.

## 6. Verificação

Antes de dizer que terminou:

```bash
cd /home/robson/coding/heisanban
bun test                                   # 10 pass
bun server.js &                            # :8000
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8000/
```

No navegador, o mínimo: ábaco renderiza 7 hastes, clique em conta muda o valor,
conversão `42` posiciona as contas, PT/EN troca e a URL vira `?lang=en-us`,
acordeão abre um painel por vez, `#math-notation` tem texto falado, tema claro
aplica, offline (DevTools → Offline) mantém layout e MathJax.

Modelo 3D: `blender --background --python scripts/abacus_model.py -- /tmp/out`
deve imprimir `PECAS 19` (14 contas + 5 peças de moldura) e STLs com as medidas
da seção 5.
