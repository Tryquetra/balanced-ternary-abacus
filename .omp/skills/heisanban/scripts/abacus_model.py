"""
Hei-San-Ban: gerador paramétrico do ábaco ternário balanceado no Blender.

Headless:
    blender --background --python abacus_model.py -- /tmp/abaco-stl

Via MCP (execute_blender_code):
    exec(open('/home/robson/coding/heisanban/.omp/skills/heisanban/scripts/abacus_model.py').read())
    info = build(); apply_value(42)

Convenção: x cresce para a direita, então a haste mais à esquerda é a mais
significativa (3^(N-1)), igual ao app. Cada peça é um objeto separado com nome
estável, pronta para export STL.
"""

import bpy
import bmesh
import math
import os
import sys

# ---------------- PARAMS ----------------
NUM_RODS = 7            # 7 hastes = ±1093, igual ao app
ROD_SPACING = 25.0      # passo entre hastes (mm)
BEAD_D = 16.0           # diâmetro externo da conta
BEAD_H = 8.0            # espessura da conta
BEAD_BORE = 4.15        # furo; dowel de 4 mm com 0,15 mm de folga
ROD_D = 4.0             # dowel comprado, não imprimir
BEAM_T = 6.0            # espessura da barra central
BEAM_H = 12.0           # profundidade da barra central
TRAVEL = 45.0           # curso da conta entre a barra e o batente
RAIL_T = 10.0           # espessura dos trilhos
RAIL_D = 30.0           # profundidade dos trilhos
WALL = 8.0              # espessura das laterais
GAP = 2.0               # folga entre a conta da ponta e a lateral
SEGMENTS = 64


# ---------------- helpers ----------------

def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def ring(name, outer_r, inner_r, height, segments=SEGMENTS):
    """Conta com furo: perfil retangular girado em Z. Malha fechada, sem boolean."""
    mesh = bpy.data.meshes.new(name)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)

    bm = bmesh.new()
    hz = height / 2.0
    profile = [
        bm.verts.new((inner_r, 0.0, -hz)),
        bm.verts.new((outer_r, 0.0, -hz)),
        bm.verts.new((outer_r, 0.0, hz)),
        bm.verts.new((inner_r, 0.0, hz)),
    ]
    edges = [
        bm.edges.new((profile[0], profile[1])),
        bm.edges.new((profile[1], profile[2])),
        bm.edges.new((profile[2], profile[3])),
        bm.edges.new((profile[3], profile[0])),
    ]
    bmesh.ops.spin(
        bm,
        geom=profile + edges,
        cent=(0.0, 0.0, 0.0),
        axis=(0.0, 0.0, 1.0),
        angle=math.tau,
        steps=segments,
        use_merge=True,
    )
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bm.normal_update()
    bm.to_mesh(mesh)
    bm.free()
    for poly in mesh.polygons:
        poly.use_smooth = True
    return obj


def cylinder(name, diameter, length, location, vertices=32):
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=vertices, radius=diameter / 2.0, depth=length, location=location
    )
    obj = bpy.context.object
    obj.name = name
    return obj


def block(name, size, location):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = size  # o cubo base tem 1 mm de aresta
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return obj


def boolean_cut(target, cutter):
    mod = target.modifiers.new("cut", 'BOOLEAN')
    mod.operation = 'DIFFERENCE'
    mod.object = cutter
    bpy.context.view_layer.objects.active = target
    bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(cutter, do_unlink=True)


# ---------------- geometria ----------------

def build(num_rods=NUM_RODS, bead_away=True):
    """Monta o ábaco. bead_away=True deixa todas as contas no estado neutro."""
    reset_scene()

    half = (num_rods - 1) / 2.0
    inner_w = (num_rods - 1) * ROD_SPACING + BEAD_D + 2 * GAP
    frame_w = inner_w + 2 * WALL
    on_beam = BEAM_T / 2.0 + BEAD_H / 2.0
    away = on_beam + TRAVEL
    rail_z = away + BEAD_H / 2.0 + RAIL_T / 2.0
    frame_h = 2 * (rail_z + RAIL_T / 2.0)
    rod_len = frame_h - 2 * RAIL_T

    # trilhos com furo passante por haste
    for name, z in (("rail_superior", rail_z), ("rail_inferior", -rail_z)):
        rail = block(name, (inner_w, RAIL_D, RAIL_T), (0.0, 0.0, z))
        for i in range(num_rods):
            x = (half - i) * ROD_SPACING
            boolean_cut(rail, cylinder("_cut", BEAD_BORE, RAIL_T + 2.0, (x, 0.0, z), 24))

    # barra central e laterais
    block("barra_central", (inner_w, BEAM_H, BEAM_T), (0.0, 0.0, 0.0))
    for name, x in (
        ("lateral_esquerda", -(frame_w / 2.0 - WALL / 2.0)),
        ("lateral_direita", (frame_w / 2.0 - WALL / 2.0)),
    ):
        block(name, (WALL, RAIL_D, frame_h), (x, 0.0, 0.0))

    # hastes (referência; o objeto físico usa dowel comprado)
    for i in range(num_rods):
        x = (half - i) * ROD_SPACING
        rod = cylinder(f"haste_{i}", ROD_D, rod_len, (x, 0.0, 0.0))
        rod.display_type = 'WIRE'

    # contas
    z_top = away if bead_away else on_beam
    z_bottom = -away if bead_away else -on_beam
    for i in range(num_rods):
        x = (half - i) * ROD_SPACING
        ring(f"conta_cima_{i}", BEAD_D / 2.0, BEAD_BORE / 2.0, BEAD_H).location = (x, 0.0, z_top)
        ring(f"conta_baixo_{i}", BEAD_D / 2.0, BEAD_BORE / 2.0, BEAD_H).location = (x, 0.0, z_bottom)

    return {
        "num_rods": num_rods,
        "frame_w": frame_w,
        "frame_h": frame_h,
        "rod_len": rod_len,
        "rod_spacing": ROD_SPACING,
        "z_on_beam": on_beam,
        "z_away": away,
    }


def decimal_to_balanced(value, num_rods=NUM_RODS):
    """Inteiro -> trits, índice 0 = haste menos significativa (3^0)."""
    limit = (3 ** num_rods - 1) // 2
    if not -limit <= value <= limit:
        raise ValueError(f"{value} extrapola ±{limit} com {num_rods} hastes")
    trits = [0] * num_rods
    v = value
    i = 0
    while v and i < num_rods:
        r = ((v % 3) + 3) % 3
        if r == 2:
            trits[i] = -1
            v = (v + 1) // 3
        else:
            trits[i] = r
            v = (v - r) // 3
        i += 1
    return trits


def apply_value(value, num_rods=NUM_RODS):
    """Posiciona as contas para representar `value` (render e conferência)."""
    trits = decimal_to_balanced(value, num_rods)
    on_beam = BEAM_T / 2.0 + BEAD_H / 2.0
    away = on_beam + TRAVEL
    half = (num_rods - 1) / 2.0
    for i, trit in enumerate(trits):
        x = (half - i) * ROD_SPACING
        top = bpy.data.objects[f"conta_cima_{i}"]
        bottom = bpy.data.objects[f"conta_baixo_{i}"]
        top.location = (x, 0.0, on_beam if trit == 1 else away)
        bottom.location = (x, 0.0, -on_beam if trit == -1 else -away)
    return trits


def export_all(directory):
    os.makedirs(directory, exist_ok=True)
    written = []
    for obj in list(bpy.data.objects):
        if obj.type != 'MESH' or obj.name.startswith("haste_"):
            continue
        bpy.ops.object.select_all(action='DESELECT')
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        path = os.path.join(directory, f"{obj.name}.stl")
        bpy.ops.wm.stl_export(filepath=path, export_selected_objects=True)
        written.append(path)
    return written


if __name__ == "__main__":
    info = build()
    apply_value(42)
    out = sys.argv[sys.argv.index("--") + 1] if "--" in sys.argv else "/tmp/abaco-stl"
    files = export_all(out)
    print("MEDIDAS", info)
    print("PECAS", len(files))
    print("EXEMPLO", files[0] if files else "nenhuma")
