"""
Hei-San-Ban: variantes visuais do abaco ternario balanceado.

Mantem o mecanismo do soroban (duas contas por haste, curso 45 mm, 7 hastes =
+-1093) e troca linguagem material/estrutural.

Headless, todas as variantes:
    blender --background --python abacus_variants.py -- /tmp/abaco-variants

Uma variante:
    blender --background --python abacus_variants.py -- /tmp/abaco-variants cristal

Galeria unica em .blend:
    blender --background --python abacus_variants.py -- /tmp/abaco-variants galeria
"""

import bpy
import bmesh
import math
import os
import sys
from mathutils import Vector

# ---------------- PARAMS ----------------
NUM_RODS = 7
ROD_SPACING = 25.0
BEAD_D = 16.0
BEAD_H = 8.0
BEAD_BORE = 4.15
ROD_D = 4.0
BEAM_T = 6.0
BEAM_H = 12.0
TRAVEL = 45.0
RAIL_T = 10.0
RAIL_D = 30.0
WALL = 8.0
GAP = 2.0
SEGMENTS = 64

HALF = (NUM_RODS - 1) / 2.0
INNER_W = (NUM_RODS - 1) * ROD_SPACING + BEAD_D + 2 * GAP
FRAME_W = INNER_W + 2 * WALL
ON_BEAM = BEAM_T / 2.0 + BEAD_H / 2.0
AWAY = ON_BEAM + TRAVEL
RAIL_Z = AWAY + BEAD_H / 2.0 + RAIL_T / 2.0
FRAME_H = 2 * (RAIL_Z + RAIL_T / 2.0)
ROD_LEN = FRAME_H - 2 * RAIL_T

VARIANTS = ("monolito", "trelica", "cristal", "trit", "orbital", "madeira")


# ---------------- helpers ----------------

def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def rod_x(i):
    return (HALF - i) * ROD_SPACING


def ring(name, outer_r, inner_r, height, segments=SEGMENTS, bevel=0.0):
    """Conta com furo: perfil retangular girado em Z, malha fechada."""
    mesh = bpy.data.meshes.new(name)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    bm = bmesh.new()
    profile = [
        bm.verts.new((inner_r, 0.0, -height / 2.0)),
        bm.verts.new((outer_r, 0.0, -height / 2.0)),
        bm.verts.new((outer_r, 0.0, height / 2.0)),
        bm.verts.new((inner_r, 0.0, height / 2.0)),
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
        poly.use_smooth = segments > 12
    if bevel > 0.0:
        apply_bevel(obj, bevel, 3)
    return obj


def cylinder(name, diameter, length, location, vertices=32, rotation=None):
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=vertices, radius=diameter / 2.0, depth=length, location=location
    )
    obj = bpy.context.object
    obj.name = name
    if rotation:
        obj.rotation_euler = rotation
    shade_smooth(obj)
    return obj


def torus(name, major_r, minor_r, location, rotation=None, major_seg=64, minor_seg=16):
    bpy.ops.mesh.primitive_torus_add(
        major_radius=major_r,
        minor_radius=minor_r,
        major_segments=major_seg,
        minor_segments=minor_seg,
        location=location,
    )
    obj = bpy.context.object
    obj.name = name
    if rotation:
        obj.rotation_euler = rotation
    shade_smooth(obj)
    return obj


def block(name, size, location):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return obj


def shade_smooth(obj, angle=math.radians(40)):
    for poly in obj.data.polygons:
        poly.use_smooth = True
    try:
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.shade_auto_smooth(angle=angle)
    except Exception:
        pass


def apply_mod(obj, mod):
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=mod.name)


def apply_bevel(obj, width, segments=2, angle=40):
    mod = obj.modifiers.new("bev", 'BEVEL')
    mod.width = width
    mod.segments = segments
    mod.limit_method = 'ANGLE'
    mod.angle_limit = math.radians(angle)
    apply_mod(obj, mod)
    return obj


def boolean_cut(target, cutter):
    mod = target.modifiers.new("cut", 'BOOLEAN')
    mod.operation = 'DIFFERENCE'
    mod.solver = 'EXACT'
    mod.object = cutter
    apply_mod(target, mod)
    bpy.data.objects.remove(cutter, do_unlink=True)


def lattice_panel(name, width, height, location, rotation, cells_x=4, cells_y=11, thickness=2.5):
    bpy.ops.mesh.primitive_grid_add(
        x_subdivisions=cells_x + 1, y_subdivisions=cells_y + 1, size=1.0, location=(0, 0, 0)
    )
    obj = bpy.context.object
    obj.name = name
    obj.scale = (width, height, 1.0)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    tri = obj.modifiers.new("tri", 'TRIANGULATE')
    apply_mod(obj, tri)
    wf = obj.modifiers.new("wf", 'WIREFRAME')
    wf.thickness = thickness
    wf.use_replace = True
    wf.use_even_offset = True
    apply_mod(obj, wf)
    obj.location = location
    obj.rotation_euler = rotation
    return obj


# ---------------- materiais ----------------

def material(name, color, metallic=0.0, rough=0.5, transmission=0.0,
             emission=None, emission_strength=0.0, ior=1.45):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = next(n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["IOR"].default_value = ior
    if transmission:
        bsdf.inputs["Transmission Weight"].default_value = transmission
    if emission:
        bsdf.inputs["Emission Color"].default_value = (*emission, 1.0)
        bsdf.inputs["Emission Strength"].default_value = emission_strength
    return mat


def wood_material(name):
    """Grao alongado no eixo X: veios finos, nao manchas."""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    coord = nt.nodes.new("ShaderNodeTexCoord")
    mapping = nt.nodes.new("ShaderNodeMapping")
    mapping.inputs["Scale"].default_value = (0.55, 0.035, 0.035)
    noise = nt.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 2.6
    noise.inputs["Detail"].default_value = 8.0
    noise.inputs["Roughness"].default_value = 0.55
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (0.44, 0.29, 0.15, 1.0)
    ramp.color_ramp.elements[1].color = (0.82, 0.65, 0.42, 1.0)
    ramp.color_ramp.elements[0].position = 0.32
    ramp.color_ramp.elements[1].position = 0.72
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.12
    nt.links.new(coord.outputs["Object"], mapping.inputs["Vector"])
    nt.links.new(mapping.outputs["Vector"], noise.inputs["Vector"])
    nt.links.new(noise.outputs["Fac"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], bsdf.inputs["Base Color"])
    nt.links.new(noise.outputs["Fac"], bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    bsdf.inputs["Roughness"].default_value = 0.42
    return mat


def assign(obj, mat):
    obj.data.materials.clear()
    obj.data.materials.append(mat)
    return obj


# ---------------- mecanismo ----------------

def decimal_to_balanced(value, num_rods=NUM_RODS):
    trits = []
    v = int(value)
    for _ in range(num_rods):
        rem = v % 3
        if rem == 2:
            rem = -1
        trits.append(rem)
        v = (v - rem) // 3
    return trits


def apply_value(value, num_rods=NUM_RODS):
    trits = decimal_to_balanced(value, num_rods)
    for i, t in enumerate(trits):
        top = bpy.data.objects.get(f"conta_cima_{i}")
        bottom = bpy.data.objects.get(f"conta_baixo_{i}")
        if not top or not bottom:
            continue
        x = rod_x(i)
        top.location = (x, 0.0, AWAY if t > 0 else ON_BEAM)
        bottom.location = (x, 0.0, -AWAY if t < 0 else -ON_BEAM)
    return trits


def make_beads(outer_r=BEAD_D / 2.0, height=BEAD_H, segments=SEGMENTS, bevel=1.2, mat=None):
    beads = []
    for i in range(NUM_RODS):
        for side in ("cima", "baixo"):
            b = ring(f"conta_{side}_{i}", outer_r, BEAD_BORE / 2.0, height,
                     segments=segments, bevel=bevel)
            if mat:
                assign(b, mat)
            beads.append(b)
    return beads


def make_rods(diameter=ROD_D, length=ROD_LEN, mat=None):
    rods = []
    for i in range(NUM_RODS):
        r = cylinder(f"haste_{i}", diameter, length, (rod_x(i), 0.0, 0.0), vertices=24)
        if mat:
            assign(r, mat)
        rods.append(r)
    return rods


def solid_frame(name, pocket_depth=26.0, fillet=2.0, front_open=True):
    """Corpo unico com dois bolsos e furos passantes de haste."""
    frame = block(name, (FRAME_W, RAIL_D, FRAME_H), (0.0, 0.0, 0.0))
    pocket_h = FRAME_H / 2.0 - WALL - BEAM_T / 2.0
    depth = (RAIL_D - 3.0) if front_open else pocket_depth
    y = -(RAIL_D / 2.0) + depth / 2.0
    for sign in (1.0, -1.0):
        cutter = block(
            "_bolso",
            (INNER_W, depth, pocket_h),
            (0.0, y, sign * (BEAM_T / 2.0 + pocket_h / 2.0)),
        )
        boolean_cut(frame, cutter)
    for i in range(NUM_RODS):
        boolean_cut(frame, cylinder("_furo", BEAD_BORE, FRAME_H + 4.0,
                                    (rod_x(i), 0.0, 0.0), vertices=24))
    if fillet:
        apply_bevel(frame, fillet, 3)
    return frame


# ---------------- variantes ----------------

def build_monolito(offset=(0, 0, 0)):
    """Bloco unico usinado em aluminio anodizado, sem moldura articulada."""
    alu = material("anodizado_grafite", (0.045, 0.050, 0.058), metallic=1.0, rough=0.36)
    laranja = material("anodizado_laranja", (0.85, 0.28, 0.05), metallic=0.9, rough=0.32)
    aco = material("aco_polido", (0.62, 0.64, 0.67), metallic=1.0, rough=0.18)

    frame = assign(solid_frame("monolito", fillet=3.0), alu)
    make_rods(mat=aco)
    make_beads(mat=laranja, bevel=1.5)
    apply_value(42)
    move_all(offset)
    return [frame]


def build_trelica(offset=(0, 0, 0)):
    """Estrutura generativa: laterais em trelica triangular, ceramica fosca."""
    ceramica = material("ceramica", (0.86, 0.85, 0.81), rough=0.62)
    azul = material("cobalto", (0.04, 0.13, 0.52), metallic=0.25, rough=0.34)
    latao = material("latao", (0.80, 0.61, 0.27), metallic=1.0, rough=0.24)

    objs = []
    struct_w = FRAME_W - 2.0 * WALL
    for name, x in (("lateral_esquerda", -(struct_w / 2.0 + 1.3)),
                    ("lateral_direita", (struct_w / 2.0 + 1.3))):
        panel = lattice_panel(name, RAIL_D, FRAME_H, (x, 0.0, 0.0),
                              (math.pi / 2.0, 0.0, 0.0), cells_x=3, cells_y=10,
                              thickness=2.6)
        objs.append(assign(panel, ceramica))

    for name, z in (("trilho_superior", RAIL_Z), ("trilho_inferior", -RAIL_Z)):
        rail = block(name, (struct_w, RAIL_D, 6.0), (0.0, 0.0, z))
        for i in range(NUM_RODS):
            boolean_cut(rail, cylinder("_furo", BEAD_BORE, 8.0, (rod_x(i), 0.0, z), 24))
        apply_bevel(rail, 2.5, 3)
        objs.append(assign(rail, ceramica))

    beam = block("barra_central", (struct_w, BEAM_H, BEAM_T), (0.0, 0.0, 0.0))
    apply_bevel(beam, 2.0, 3)
    objs.append(assign(beam, ceramica))

    objs += make_rods(mat=latao)
    objs += make_beads(segments=8, bevel=1.0, mat=azul)
    apply_value(42)
    move_all(offset)
    return objs


def build_cristal(offset=(0, 0, 0)):
    """Acrilico cristal, ferragens minimas e contas em latao polido."""
    acrilico = material("acrilico", (0.92, 0.95, 0.96), rough=0.03,
                        transmission=1.0, ior=1.49)
    latao = material("latao_polido", (0.95, 0.78, 0.42), metallic=1.0, rough=0.10)
    aco = material("aco_espelhado", (0.85, 0.87, 0.90), metallic=1.0, rough=0.06)

    objs = []
    for name, z in (("trilho_superior", RAIL_Z), ("trilho_inferior", -RAIL_Z)):
        rail = block(name, (INNER_W, RAIL_D, RAIL_T), (0.0, 0.0, z))
        apply_bevel(rail, 3.0, 4)
        objs.append(assign(rail, acrilico))

    beam = block("barra_central", (INNER_W, BEAM_H, BEAM_T), (0.0, 0.0, 0.0))
    apply_bevel(beam, 2.5, 4)
    objs.append(assign(beam, acrilico))

    for name, x in (("lateral_esquerda", -(FRAME_W / 2.0 - 2.0)),
                    ("lateral_direita", (FRAME_W / 2.0 - 2.0))):
        side = block(name, (4.0, RAIL_D, FRAME_H), (x, 0.0, 0.0))
        apply_bevel(side, 1.5, 3)
        objs.append(assign(side, acrilico))

    objs += make_rods(mat=aco)
    objs += make_beads(segments=96, bevel=3.0, mat=latao)
    apply_value(42)
    move_all(offset)
    return objs


def build_trit(offset=(0, 0, 0)):
    """Leitura digital: fita emissiva por haste mostrando -1, 0, +1."""
    preto = material("preto_mate", (0.018, 0.019, 0.022), rough=0.52)
    gunmetal = material("gunmetal", (0.22, 0.23, 0.25), metallic=1.0, rough=0.30)
    aco = material("aco_escuro", (0.30, 0.31, 0.33), metallic=1.0, rough=0.28)
    ciano = material("emissivo_ciano", (0.0, 0.9, 0.95), emission=(0.0, 0.85, 1.0),
                     emission_strength=12.0, rough=0.3)
    magenta = material("emissivo_magenta", (0.95, 0.05, 0.55), emission=(1.0, 0.05, 0.5),
                       emission_strength=12.0, rough=0.3)
    zero = material("emissivo_zero", (0.10, 0.11, 0.13), emission=(0.35, 0.38, 0.42),
                    emission_strength=1.2, rough=0.4)

    frame = assign(solid_frame("chassi", pocket_depth=24.0, fillet=4.0), preto)
    make_rods(mat=aco)
    beads = make_beads(mat=gunmetal, bevel=1.6)
    trits = apply_value(42)

    for i, t in enumerate(trits):
        strip_mat = ciano if t > 0 else magenta if t < 0 else zero
        strip = block(f"fita_trit_{i}", (10.0, 3.0, 6.0),
                      (rod_x(i), -BEAM_H / 2.0 - 1.4, 0.0))
        assign(strip, strip_mat)

    move_all(offset)
    return [frame] + beads


def build_orbital(offset=(0, 0, 0)):
    """Leitura radial: sete raios em torno de um cubo central, contas deslizantes."""
    bronze = material("bronze_escuro", (0.16, 0.13, 0.09), metallic=1.0, rough=0.38)
    patina = material("patina", (0.06, 0.22, 0.20), metallic=0.35, rough=0.42)
    aco = material("aco_orbital", (0.55, 0.57, 0.60), metallic=1.0, rough=0.22)

    hub = cylinder("cubo", 46.0, 16.0, (0.0, 0.0, 0.0), vertices=64,
                   rotation=(math.pi / 2.0, 0.0, 0.0))
    assign(hub, bronze)
    apply_bevel(hub, 2.0, 3)

    rim = torus("aro", 104.0, 4.5, (0.0, 0.0, 0.0), rotation=(math.pi / 2.0, 0.0, 0.0))
    assign(rim, bronze)
    mid = torus("aro_central", 62.0, 2.2, (0.0, 0.0, 0.0), rotation=(math.pi / 2.0, 0.0, 0.0))
    assign(mid, aco)

    trits = decimal_to_balanced(42)
    objs = [hub, rim, mid]
    for i in range(NUM_RODS):
        ang = math.pi / 2.0 - (i + 0.5) * math.tau / NUM_RODS
        ca, sa = math.cos(ang), math.sin(ang)
        spoke = cylinder(f"raio_{i}", 4.0, 88.0, (ca * 60.0, sa * 60.0, 0.0),
                         vertices=20, rotation=(math.pi / 2.0, 0.0, ang + math.pi / 2.0))
        assign(spoke, aco)
        objs.append(spoke)

        t = trits[i]
        outer = ring(f"conta_ext_{i}", 10.0, BEAD_BORE / 2.0, 7.0, segments=48, bevel=1.4)
        inner = ring(f"conta_int_{i}", 10.0, BEAD_BORE / 2.0, 7.0, segments=48, bevel=1.4)
        r_out = 78.0 if t > 0 else 66.0
        r_in = 50.0 if t < 0 else 62.0
        outer.location = (ca * r_out, sa * r_out, 0.0)
        inner.location = (ca * r_in, sa * r_in, 0.0)
        outer.rotation_euler = (math.pi / 2.0, 0.0, ang + math.pi / 2.0)
        inner.rotation_euler = (math.pi / 2.0, 0.0, ang + math.pi / 2.0)
        assign(outer, patina)
        assign(inner, patina)
        objs += [outer, inner]

    lift = 72.0
    for obj in objs:
        obj.location.z += lift

    rim_bottom = lift - 108.5
    base = cylinder("base", 120.0, 6.0, (0.0, 0.0, -63.0), vertices=64)
    assign(base, bronze)
    apply_bevel(base, 1.5, 2)
    column = cylinder("coluna", 18.0, 26.0, (0.0, 26.0, -49.5), vertices=32)
    assign(column, bronze)
    arm = cylinder("braco", 12.0, 30.0, (0.0, 14.0, rim_bottom), vertices=24,
                   rotation=(math.pi / 2.0, 0.0, 0.0))
    assign(arm, bronze)
    objs += [base, column, arm]

    move_all(offset)
    return objs


def build_madeira(offset=(0, 0, 0)):
    """Compensado de betula com raios generosos, contas pretas fosco."""
    madeira = wood_material("compensado")
    preto = material("preto_fosco", (0.025, 0.025, 0.027), rough=0.58)
    faia = material("faia", (0.72, 0.55, 0.36), rough=0.55)

    frame = assign(solid_frame("moldura_madeira", pocket_depth=26.0, fillet=10.0), madeira)
    make_rods(mat=faia)
    make_beads(mat=preto, bevel=2.0)
    apply_value(42)
    move_all(offset)
    return [frame]


BUILDERS = {
    "monolito": build_monolito,
    "trelica": build_trelica,
    "cristal": build_cristal,
    "trit": build_trit,
    "orbital": build_orbital,
    "madeira": build_madeira,
}


def move_all(offset):
    dx, dy, dz = offset
    if not any(offset):
        return
    for obj in bpy.context.scene.objects:
        if obj.type == 'MESH':
            obj.location.x += dx
            obj.location.y += dy
            obj.location.z += dz


# ---------------- cena e render ----------------

def studio(dark=True, floor=True, softbox=True):
    world = bpy.data.worlds.new("mundo")
    bpy.context.scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (0.012, 0.014, 0.018, 1.0) if dark else (0.55, 0.53, 0.50, 1.0)
    bg.inputs["Strength"].default_value = 1.0 if dark else 0.7

    def sun(name, travel, energy, angle=0.12):
        """`travel` e a direcao em que a luz caminha (a fonte fica no oposto)."""
        data = bpy.data.lights.new(name, 'SUN')
        data.energy = energy
        data.angle = angle
        obj = bpy.data.objects.new(name, data)
        bpy.context.collection.objects.link(obj)
        obj.rotation_euler = Vector(travel).to_track_quat('-Z', 'Y').to_euler()
        return obj

    sun("key", (0.55, 0.75, -0.95), 4.2, 0.10)
    sun("fill", (-0.85, 0.45, -0.25), 1.2, 0.35)
    sun("rim", (-0.15, -0.95, -0.45), 3.0, 0.12)

    if softbox:
        for name, loc, target, size, energy in (
            ("softbox_topo", (0.0, -60.0, 260.0), (0.0, 0.0, 0.0), 220.0, 3.0),
            ("softbox_frente", (-260.0, -180.0, 90.0), (0.0, 0.0, 0.0), 180.0, 1.6),
        ):
            data = bpy.data.lights.new(name, 'AREA')
            data.energy = energy * 1_000_000.0
            data.size = size
            obj = bpy.data.objects.new(name, data)
            bpy.context.collection.objects.link(obj)
            obj.location = loc
            obj.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()

    if floor:
        bpy.ops.mesh.primitive_plane_add(size=8000.0, location=(0.0, 0.0, -FRAME_H / 2.0 - 0.4))
        floor_obj = bpy.context.object
        floor_obj.name = "chao"
        mat = material("chao", (0.05, 0.05, 0.055) if dark else (0.62, 0.60, 0.57),
                       rough=0.30 if dark else 0.55)
        assign(floor_obj, mat)

    bpy.ops.mesh.primitive_plane_add(size=8000.0, location=(0.0, 900.0, 600.0),
                                     rotation=(math.pi / 2.0, 0.0, 0.0))
    back = bpy.context.object
    back.name = "fundo"
    assign(back, material("fundo", (0.02, 0.022, 0.028) if dark else (0.70, 0.68, 0.65),
                          rough=0.6))


def frame_camera(lens=85.0, direction=(0.48, -1.0, 0.26), margin=0.98):
    scene = bpy.context.scene
    meshes = [o for o in scene.objects if o.type == 'MESH' and o.name not in ("chao", "fundo")]
    lo = Vector((1e9, 1e9, 1e9))
    hi = Vector((-1e9, -1e9, -1e9))
    for obj in meshes:
        for corner in obj.bound_box:
            p = obj.matrix_world @ Vector(corner)
            lo = Vector((min(lo[i], p[i]) for i in range(3)))
            hi = Vector((max(hi[i], p[i]) for i in range(3)))
    center = (lo + hi) / 2.0
    radius = (hi - lo).length / 2.0

    aspect = scene.render.resolution_x / max(scene.render.resolution_y, 1)
    fov_x = 2.0 * math.atan(18.0 / lens)
    fov_y = 2.0 * math.atan(18.0 / aspect / lens)
    dist = radius * margin / math.sin(min(fov_x, fov_y) / 2.0)

    direction = Vector(direction).normalized()
    cam_data = bpy.data.cameras.new("camera")
    cam_data.lens = lens
    cam_data.clip_start = 1.0
    cam_data.clip_end = max(100000.0, dist * 4.0)
    cam = bpy.data.objects.new("camera", cam_data)
    bpy.context.collection.objects.link(cam)
    cam.location = center + direction * dist
    cam.rotation_euler = (center - cam.location).to_track_quat('-Z', 'Y').to_euler()
    scene.camera = cam
    return cam


def setup_render(samples=64, res=(1200, 900)):
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = samples
    scene.cycles.use_denoising = True
    scene.cycles.max_bounces = 10
    scene.cycles.transmission_bounces = 12
    scene.render.resolution_x, scene.render.resolution_y = res
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.render.film_transparent = False
    try:
        scene.view_settings.look = 'AgX - Medium High Contrast'
    except Exception:
        pass


def render_variant(name, directory, samples=64, res=(1200, 900), dark=True):
    reset_scene()
    BUILDERS[name]()
    studio(dark=dark, floor=True, softbox=dark)
    setup_render(samples=samples, res=res)
    frame_camera()
    os.makedirs(directory, exist_ok=True)
    path = os.path.join(directory, f"{name}.png")
    bpy.context.scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    print("RENDER", path)
    return path


def build_gallery(path):
    """Todas as variantes lado a lado, uma colecao por conceito."""
    reset_scene()
    step = 320.0
    for idx, name in enumerate(VARIANTS):
        before = set(bpy.data.objects)
        BUILDERS[name](offset=((idx - (len(VARIANTS) - 1) / 2.0) * step, 0.0, 0.0))
        coll = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(coll)
        for obj in set(bpy.data.objects) - before:
            for c in list(obj.users_collection):
                c.objects.unlink(obj)
            coll.objects.link(obj)
    studio(dark=True, floor=True, softbox=True)
    setup_render(samples=96, res=(2400, 800))
    frame_camera(lens=60.0, direction=(0.25, -1.0, 0.30), margin=1.04)
    bpy.ops.wm.save_as_mainfile(filepath=path)
    print("BLEND", path)
    return path


if __name__ == "__main__":
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    directory = argv[0] if argv else "/tmp/abaco-variants"
    targets = argv[1:] or list(VARIANTS)

    if targets == ["galeria"]:
        build_gallery(os.path.join(directory, "abaco-variantes.blend"))
    else:
        for name in targets:
            if name not in BUILDERS:
                print("IGNORADO", name)
                continue
            render_variant(name, directory, samples=48 if "--rapido" in sys.argv else 64)
