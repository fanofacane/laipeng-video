import numpy as np, subprocess, json, wave
SR=48000
r=subprocess.run(['ffmpeg','-v','error','-i','raw.wav','-ar',str(SR),'-ac','1','-f','s16le','-'],capture_output=True).stdout
x=np.frombuffer(r,np.int16).astype(np.float32)/32768
F=SR//100  # 10ms frames
n=len(x)//F
env=20*np.log10(np.sqrt((x[:n*F].reshape(n,F)**2).mean(1))+1e-9)
sp=env>-36
# fill short gaps (<120ms) and remove tiny blips (<60ms)
def runs(m):
    out=[];i=0
    while i<len(m):
        j=i
        while j<len(m) and m[j]==m[i]: j+=1
        out.append((m[i],i,j)); i=j
    return out
for v,a,b in runs(sp):
    if not v and b-a<12: sp[a:b]=True
for v,a,b in runs(sp):
    if v and b-a<6: sp[a:b]=False
# manual deletions (orig seconds): ranges forced to silence
manual=[(18.25,22.0),(52.6,55.06),(183.3,185.95)]
for a,b in manual: sp[int(a*100):int(b*100)]=False
# global trim
sp[:int(8.8*100)]=False; sp[int(307.9*100):]=False
keep=[]
rs=runs(sp)
for v,a,b in rs:
    if v: keep.append([a,b]); continue
    L=b-a
    is_manual=any(int(m0*100)<b and int(m1*100)>a for m0,m1 in manual)
    tgt=30 if L<90 else 45
    if is_manual: tgt=35
    if a==0: keep.append([max(0,b-25),b]); continue
    if b==n: keep.append([a,min(n,a+60)]); continue
    if L<=tgt: keep.append([a,b]); continue
    t1=int(tgt*0.55); t2=tgt-t1
    keep.append([a,a+t1]); keep.append([b-t2,b])
# merge contiguous
m=[]
for a,b in keep:
    if m and m[-1][1]==a: m[-1][1]=b
    else: m.append([a,b])
# assemble with 8ms crossfade-ish fades
fade=int(0.008*SR); out=[]; mapping=[]; t=0
for a,b in m:
    seg=x[a*F:b*F].copy()
    if len(seg)>2*fade:
        seg[:fade]*=np.linspace(0,1,fade); seg[-fade:]*=np.linspace(1,0,fade)
    mapping.append([a/100,b/100,t/SR]); t+=len(seg); out.append(seg)
y=np.concatenate(out)
w=wave.open('cut.wav','wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
w.writeframes((np.clip(y,-1,1)*32767).astype(np.int16).tobytes()); w.close()
json.dump(mapping,open('map.json','w'))
print('orig',len(x)/SR,'new',len(y)/SR,'segments',len(m))
