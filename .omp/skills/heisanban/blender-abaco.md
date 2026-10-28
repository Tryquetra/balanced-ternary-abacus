# Modelo físico do ábaco no Blender

Receita para gerar o Hei-San-Ban imprimível. O script
`scripts/abacus_model.py` é a fonte de verdade das medidas; este documento
explica as decisões e o que conferir.

## 1. Por que duas contas por haste

Cada haste tem uma conta em cima e uma embaixo, contra uma barra central:

| Estado físico | Contribuição |
|---|---|
| conta de cima encostada na barra | +1 |
| conta de baixo encostada na barra | −1 |
| nenhuma encostada | 0 |
| as duas encostadas | 0 |

Quatro estados físicos, três valores. É a demonstração tangível de
`1 + (−1) = 0`, que um seletor de três posições não oferece. Por isso o
mecanismo é soroban de duas contas, não conta única com detentes.

## 2. Medidas

| Parâmetro | Valor | Nota |
|---|---|---|
| `NUM_RODS` | 7 | ±1093; 9 hastes dariam ±9841 |
| `ROD_SPACING` | 25 mm | 3 hastes por grupo, como o agrupamento do CSS |
| `BEAD_D` | 16 mm | conta comprada de madeira, confortável para dedo adulto |
| `BEAD_H` | 8 mm | espessura |
| `BEAD_BORE` | 4,15 mm | dowel de 4 mm com 0,15 mm de folga |
| `ROD_D` | 4 mm | dowel de bambu ou latão |
| `BEAM_T` | 6 mm | espessura da barra central |
| `BEAM_H` | 12 mm | profundidade |
| `TRAVEL` | 45 mm | curso entre a barra e o batente |
| `RAIL_T` / `RAIL_D` | 10 / 30 mm | trilhos superior e inferior |
| `WALL` | 8 mm | laterais |
| `GAP` | 2 mm | folga entre a conta da ponta e a lateral |

Resultado: moldura 186 × 132 × 30 mm, vão interno 170 mm, haste útil 112 mm,
contas a ±7 mm (na barra) ou ±52 mm (afastadas) do centro.

Cabe em cama de 220 × 220 mm impressa em duas metades ou com os trilhos em pé.

## 3. Peças geradas

`build()` cria objetos com nomes estáveis:

- `rail_superior`, `rail_inferior`: 170 × 30 × 10 mm, 7 furos passantes de 4,15 mm
- `barra_central`: 170 × 12 × 6 mm
- `lateral_esquerda`, `lateral_direita`: 8 × 30 × 132 mm
- `conta_cima_0..6`, `conta_baixo_0..6`: anel 16 × 8 mm com furo 4,15 mm
- `haste_0..6`: cilindros de referência (não exportados, o físico usa dowel)

`export_all()` grava 19 STLs, um por peça.

## 4. Uso

### Headless

```bash
blender --background --python scripts/abacus_model.py -- /tmp/abaco-stl
# MEDIDAS {...} / PECAS 19
```

### Via MCP, com o Blender aberto

```python
exec(open('/home/robson/coding/heisanban/.omp/skills/heisanban/scripts/abacus_model.py').read())
info = build(num_rods=7, bead_away=True)   # estado neutro
apply_value(42)                            # posiciona as contas para 42
```

`apply_value` usa a mesma conversão do app (divisão por 3 com resto
normalizado) e valida o limite de ±1093.

### Export

```python
export_all('/tmp/abaco-stl')
```

### Render de conferência

```python
import math, bpy
cam_data = bpy.data.cameras.new("cam"); cam = bpy.data.objects.new("cam", cam_data)
bpy.context.collection.objects.link(cam); bpy.context.scene.camera = cam
cam.location = (0, -430, 20); cam.rotation_euler = (math.radians(88), 0, 0)
sc = bpy.context.scene
sc.render.engine = 'BLENDER_WORKBENCH'
sc.display.shading.light = 'STUDIO'
sc.render.resolution_x, sc.render.resolution_y = 900, 700
sc.render.filepath = '/tmp/abaco.png'
bpy.ops.render.render(write_still=True)
```

## 5. Impressão

| Peça | Orientação | Camada | Suporte |
|---|---|---|---|
| conta | furo na vertical | 0,12 mm | não |
| trilho | deitado, furos na vertical | 0,2 mm | não |
| barra | deitada | 0,2 mm | não |
| lateral | em pé, deitada na face maior | 0,2 mm | não |

Regras que evitam retrabalho:

- Imprima as 14 contas com o mesmo gcode e o mesmo fio. Atrito desigual entre
  contas é o defeito mais chato de diagnosticar.
- Furo impresso encolhe. Antes de imprimir o jogo, faça um cupom com furos de
  4,0 / 4,1 / 4,2 / 4,3 / 4,4 mm e escolha o que desliza com resistência.
- Conta de 16 mm em PLA pesa 2 a 4 g, ou seja 0,02 a 0,04 N. Qualquer
  interferência leve segura o estado afastado; o risco real é atrito alto demais.
- Não imprima as hastes. Dowel comprado tem diâmetro constante; 112 mm de
  cilindro impresso em pé varia e empena.
- Alternativa híbrida: moldura em compensado 3 mm a laser, contas e hastes
  compradas, impressas só as peças de encaixe e os rótulos em relevo.

## 6. Montagem e leitura

- Trilhos e laterais formam o retângulo; a barra central encaixa entre as
  laterais na altura zero.
- As hastes atravessam os furos dos trilhos; a barra central passa entre as
  duas contas de cada haste.
- Gravação ou etiqueta com 729, 243, 81, 27, 9, 3, 1 da esquerda para a
  direita, mais −1 / 0 / +1 na lateral, igual à interface.
- O objeto não tem leitor decimal. Se for material didático, imprima a tabela
  de conversão na base ou use o app como gabarito.

## 7. Verificação do modelo

```python
info = build()
assert round(info['frame_w'], 1) == 186.0
assert round(info['frame_h'], 1) == 132.0
trits = apply_value(42)              # [0, -1, -1, -1, 1, 0, 0]
assert sum(t * 3**i for i, t in enumerate(trits)) == 42
```

No STL exportado, a barra deve medir 170 × 12 × 6 mm e a conta 16 × 16 × 8 mm.

## 8. Variantes visuais

`scripts/abacus_variants.py` reaproveita o mesmo mecanismo (7 hastes, duas
contas, curso 45 mm) e troca só a linguagem material/estrutural. Não exporta
STL: serve para explorar conceito, não para imprimir.

| Slug | Conceito |
|---|---|
| `monolito` | bloco único usinado, alumínio anodizado grafite, contas cobre |
| `trelica` | laterais em treliça triangular generativa, cerâmica fosca, contas facetadas |
| `cristal` | acrílico cristal, ferragens mínimas, contas em latão polido |
| `trit` | chassi preto com fita emissiva por haste: ciano +1, magenta −1, apagado 0 |
| `orbital` | leitura radial, sete raios em bronze sobre pedestal, contas em pátina |
| `madeira` | compensado de bétula com raios grandes, contas pretas foscas |

```bash
blender --background --python scripts/abacus_variants.py -- /tmp/abaco-variants
blender --background --python scripts/abacus_variants.py -- /tmp/abaco-variants cristal
```

Os renders de referência ficam em `concepts/<slug>.png`, 1200 × 900, Cycles 64
amostras com denoise. `frame_camera()` enquadra pela esfera envolvente e ajusta
`clip_end` ao raio: sem isso, o orbital (1,3 m de câmera) renderiza preto.
