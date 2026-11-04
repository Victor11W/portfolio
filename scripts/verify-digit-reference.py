"""Regenerate synthetic CNN reference logits without importing or unpickling torch.
Requires NumPy only. The original MNIST dataset is not used or included.
"""
import argparse, hashlib, json, zipfile
from pathlib import Path
import numpy as np

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('checkpoint',type=Path)
parser.add_argument('--output',type=Path,default=Path(__file__).resolve().parents[1]/'tests/fixtures/digit-reference.json')
args=parser.parse_args()
with zipfile.ZipFile(args.checkpoint) as archive:
    metadata=next(n for n in archive.namelist() if n.endswith('/data.pkl'))
    if hashlib.sha256(archive.read(metadata)).hexdigest()!='a86d56129ba686d30cdebe01e45d1785c652cc3fd9b23d8919f3ad3e7fb6a7a1':
        raise ValueError('Unrecognised checkpoint layout')
    prefix=metadata[:-len('data.pkl')]
    shapes=[(32,1,3,3),(32,),(64,32,3,3),(64,),(128,1600),(128,),(10,128),(10,)]
    weights=[np.frombuffer(archive.read(prefix+'data/'+str(i)),dtype='<f4').reshape(shape) for i,shape in enumerate(shapes)]
def infer(pixels):
    x=np.asarray(pixels,dtype=np.float32).reshape(1,28,28)/127.5-1
    for weight,bias in ((weights[0],weights[1]),(weights[2],weights[3])):
        patches=np.lib.stride_tricks.sliding_window_view(x,(3,3),axis=(1,2))
        x=np.maximum(0,np.einsum('cxykl,ockl->oxy',patches,weight,optimize=False)+bias[:,None,None])
        channels,h,w=x.shape
        x=x[:,:h//2*2,:w//2*2].reshape(channels,h//2,2,w//2,2).max(axis=(2,4))
    hidden=np.maximum(0,weights[4]@x.reshape(-1)+weights[5])
    return weights[6]@hidden+weights[7]
patterns=[]
for name in ['ramp','seven']:
    pixels=np.arange(784,dtype=np.float32)%256 if name=='ramp' else np.zeros((28,28),dtype=np.float32)
    if name=='seven':
        pixels[4:7,6:22]=255
        for y in range(7,24):
            pixels[y,20-(y-7)//2:23-(y-7)//2]=255
    patterns.append({'name':name,'pixels':pixels.reshape(-1).tolist(),'logits':infer(pixels).tolist()})
args.output.parent.mkdir(parents=True,exist_ok=True)
args.output.write_text(json.dumps(patterns,separators=(',',':')),encoding='utf-8')
print('Reference generated:',args.output)
