"""Generate the app's vector mark and platform icon containers."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import subprocess

root = Path(__file__).resolve().parents[1]
assets = root / 'src' / 'assets'
assets.mkdir(exist_ok=True)
svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
<defs><linearGradient id="blue" x1="0" y1="0" x2=".35" y2="1"><stop stop-color="#49b4fb"/><stop offset="1" stop-color="#1474d4"/></linearGradient></defs>
<rect x="64" y="64" width="896" height="896" rx="204" fill="url(#blue)"/>
<path d="M358 246h308a132 132 0 0 1 132 132v174a132 132 0 0 1-132 132H459L280 792l44-113a132 132 0 0 1-98-127V378a132 132 0 0 1 132-132Z" fill="#fff"/>
<path d="M374 355h280v59L468 575h186v63H366v-59l186-161H374Z" fill="#208bde"/>
</svg>'''
(assets / 'icon.svg').write_text(svg)
scale = 2
size = 1024 * scale
mask = Image.new('L', (size, size))
d = ImageDraw.Draw(mask)
d.rounded_rectangle(tuple(v*scale for v in (64,64,960,960)), radius=204*scale, fill=255)
base = Image.new('RGBA', (size,size))
pixels = Image.new('RGB',(1,size))
a,b=(73,180,251),(20,116,212)
for y in range(size):
    t=max(0,min(1,(y/scale-64)/896))
    pixels.putpixel((0,y),tuple(round(a[i]*(1-t)+b[i]*t) for i in range(3)))
base.paste(pixels.resize((size,size)),(0,0)); base.putalpha(mask)
bubble = Image.new('L',(size,size))
bd=ImageDraw.Draw(bubble)
bd.rounded_rectangle(tuple(v*scale for v in (226,246,798,684)),radius=132*scale,fill=255)
bd.polygon([(v[0]*scale,v[1]*scale) for v in [(326,661),(280,792),(473,676)]],fill=255)
shadow=Image.new('RGBA',(size,size),(0,64,130,0))
shadow.putalpha(bubble.filter(ImageFilter.GaussianBlur(12*scale)).point(lambda v:int(v*.13)))
base.alpha_composite(shadow,(0,10*scale))
white=Image.new('RGBA',(size,size),'white');white.putalpha(bubble);base.alpha_composite(white)
d=ImageDraw.Draw(base)
d.polygon([(x*scale,y*scale) for x,y in [(374,355),(654,355),(654,414),(468,575),(654,575),(654,638),(366,638),(366,579),(552,418),(374,418)]],fill=(32,139,222,255))
icon=base.resize((1024,1024),Image.Resampling.LANCZOS)
icon.save(assets/'icon.png')
icon.resize((256,256),Image.Resampling.LANCZOS).save(assets/'icon-preview.png')
icon.save(assets/'icon.ico',sizes=[(n,n) for n in [16,24,32,48,64,128,256]])
iconset=assets/'app.iconset';iconset.mkdir(exist_ok=True)
for points in [16,32,128,256,512]:
    for factor in [1,2]:
        suffix='@2x' if factor==2 else ''
        icon.resize((points*factor,points*factor),Image.Resampling.LANCZOS).save(iconset/f'icon_{points}x{points}{suffix}.png')
subprocess.run(['iconutil','-c','icns',str(iconset),'-o',str(assets/'icon.icns')],check=True)
for child in iconset.iterdir(): child.unlink()
iconset.rmdir()
print('Generated SVG, PNG, ICO and ICNS in',assets)
