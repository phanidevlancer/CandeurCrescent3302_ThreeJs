# Washer tower from front-loading_washerdryer_show.glb (inch units, Blender axes; front = -Y):
# keep faces with every vertex inside the tower box; drop the dryer (face centre inside the dryer box, except wood frame)
import bpy,sys,bmesh
a=sys.argv[sys.argv.index('--')+1:]; src,out=a[0],a[1]
R=(256.0,286.5,-177.5,-145.5,-1.5,103.5)
D=(258.0,285.0,-177.0,-147.0,35.9,70.0)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
ms=[o for o in bpy.context.scene.objects if o.type=='MESH']
for o in ms:
    bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
    bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM');bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
for o in list(bpy.context.scene.objects):
    if o.type!='MESH':bpy.data.objects.remove(o,do_unlink=True)
inside=lambda c,B:B[0]<=c.x<=B[1] and B[2]<=c.y<=B[3] and B[4]<=c.z<=B[5]
for o in list(bpy.context.scene.objects):
    bm=bmesh.new();bm.from_mesh(o.data);mats=[m.name if m else '' for m in o.data.materials]
    kill=[]
    for f in bm.faces:
        if not all(inside(v.co,R) for v in f.verts): kill.append(f);continue
        if inside(f.calc_center_median(),D) and 'BurlyWood' not in mats[f.material_index]: kill.append(f)
    bmesh.ops.delete(bm,geom=kill,context='FACES');bmesh.ops.delete(bm,geom=[v for v in bm.verts if not v.link_faces],context='VERTS')
    bm.to_mesh(o.data);bm.free()
    if len(o.data.polygons)==0:bpy.data.objects.remove(o,do_unlink=True)
for o in bpy.context.scene.objects:
    vs=[v.co for v in o.data.vertices];print('KEEP',o.name,o.data.materials[0].name,len(o.data.polygons),[round(min(v[i] for v in vs),1) for i in range(3)],[round(max(v[i] for v in vs),1) for i in range(3)])
bpy.ops.export_scene.gltf(filepath=out,export_format='GLB')
print('DONE')
