import numpy as np, bpy, sys, json
d=sys.argv[sys.argv.index('--')+1]
g=np.load(d+'/grid.npy'); ny,nx=g.shape
g.tofile(d+'/grid.bin')
# preview, 3x scaled, y up
big=np.kron(g,np.ones((3,3),dtype=np.uint8))
H,W=big.shape
img=bpy.data.images.new('g',W,H,alpha=False)
px=np.ones((H,W,4),dtype=np.float32)
v=np.where(big>0,0.0,1.0); px[...,0]=v;px[...,1]=v;px[...,2]=v
img.pixels.foreach_set(px.ravel())  # row 0 = bottom => y increasing upward, matches plan
img.filepath_raw=sys.argv[sys.argv.index('--')+2]; img.file_format='PNG'; img.save()
