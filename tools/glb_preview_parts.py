import bpy, sys, math, mathutils
argv = sys.argv[sys.argv.index('--') + 1:]; src, out = argv
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
sc = bpy.context.scene; sc.render.engine = 'BLENDER_EEVEE' if 'BLENDER_EEVEE' in [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items] else 'BLENDER_EEVEE_NEXT'
sc.render.resolution_x, sc.render.resolution_y = 800, 500
w = bpy.data.worlds.new('w'); w.use_nodes = True; w.node_tree.nodes['Background'].inputs[1].default_value = 1.0; sc.world = w
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam
sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN')); sun.data.energy = 3; sun.rotation_euler = (0.8, 0.2, 0.6); sc.collection.objects.link(sun)
def frame(objs):
    pts = [o.matrix_world @ mathutils.Vector(c) for o in objs for c in o.bound_box]
    lo = mathutils.Vector([min(p[i] for p in pts) for i in range(3)]); hi = mathutils.Vector([max(p[i] for p in pts) for i in range(3)])
    c = (lo + hi) / 2; r = (hi - lo).length / 2
    cam.location = c + mathutils.Vector((r * 1.1, -r * 1.6, r * 0.9)); d = c - cam.location; cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
for i, m in enumerate(meshes + [None]):
    for o in meshes: o.hide_render = (m is not None and o is not m)
    frame([m] if m else meshes)
    sc.render.filepath = f"{out}/{(m.name if m else 'ALL')}.png"; bpy.ops.render.render(write_still=True)
print('DONE', [m.name for m in meshes])
