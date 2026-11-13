from pathlib import Path
import fitz,hashlib,json
from PIL import Image,ImageDraw
import argparse
parser=argparse.ArgumentParser(description='Rebuild approved source-only Établissements crops (Pillow + PyMuPDF).')
parser.add_argument('--sources',required=True,type=Path)
parser.add_argument('--contact-sheet',type=Path)
args=parser.parse_args()
repo=Path(__file__).resolve().parents[2]
u=args.sources
out=repo/'apps/marketplace-web/public/angelcare-marketplace/establishments-r2'
out.mkdir(parents=True,exist_ok=True)
assets=[]
def save(name,im,source,page,box):
 crop=im.crop(tuple(round(v*s) for v,s in zip(box,[im.width,im.height,im.width,im.height]))).convert('RGB')
 original=crop.size
 # Presentation scaling only: no generated pixels or invented details.
 width=min(1600,max(1000,crop.width));crop=crop.resize((width,round(width*crop.height/crop.width)),Image.Resampling.LANCZOS)
 crop.save(out/(name+'.png'),optimize=True)
 assets.append({'asset':name+'.png','source':source.name,'source_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'page':page,'normalized_crop':box,'rendered_crop_pixels':original,'output_pixels':crop.size,'processing':'source crop; Lanczos presentation resampling; no generative enhancement'})
def screenshot(name,filename,box):save(name,Image.open(u/filename),u/filename,None,box)
def pdf(name,filename,page,box):
 path=u/filename;d=fitz.open(path);p=d[page-1];pix=p.get_pixmap(matrix=fitz.Matrix(2,2));im=Image.frombytes('RGB',[pix.width,pix.height],pix.samples);save(name,im,path,page,box)
screenshot('consulting-hero','01-image.png',(.35,.014,.999,.144))
screenshot('partner-hero','02-image.png',(.35,.014,.999,.153))
screenshot('products-hero','03-image.png',(.39,.014,.999,.12))
doc='01-ACB2BCRECHE-MATERNELLEPC2-2-.pdf'
pdf('child-experience',doc,1,(.55,.15,.995,.61))
pdf('edupplay',doc,8,(.565,.005,.994,.225))
pdf('academy',doc,10,(.59,.005,.994,.235))
pdf('parents',doc,11,(.58,.01,.995,.235))
pdf('consulting-deliverables',doc,7,(.04,.25,.64,.70))
screenshot('consulting-method','01-image.png',(.02,.875,.42,.908))
cat='02-B2B-CRECHE-ITEMS-CATALOGUE-3-.pdf'
for name,page in [('welcome',5),('signage',10),('classroom',20),('administration',25),('safety',30),('activities',36),('furniture',41),('parent-tools',46),('inclusion',49),('uniforms',55),('audit',60)]:
 pdf(name,cat,page,((.59 if name in ['welcome','signage'] else .46),.102,.925,.255))
partner='03-ACB2BCRECHE.pdf'
for name,page in [('os-overview',4),('os-admissions',6),('os-communication',7),('os-activities',8),('os-crm',9),('os-services',10),('os-quotes',12),('os-finance',13),('os-payments',14),('os-team',15)]:
 pdf(name,partner,page,(.43,.055,.99,.365))
pdf('programme-team',doc,9,(.65,.055,.994,.225))
pdf('programme-coaching',doc,10,(.62,.655,.835,.82))
pdf('parent-direction',doc,14,(.60,.085,.995,.425))
for name,top,bottom in [('os-people-intro',.39,.453),('os-people-direction',.455,.517),('os-people-admissions',.52,.582),('os-people-commerce',.585,.645),('os-people-team',.65,.708),('os-people-followup',.71,.764),('os-people-year',.78,.841)]:
 screenshot(name,'02-image.png',(.004,top,.407,bottom))
(out/'provenance.json').write_text(json.dumps({'version':1,'assets':assets},ensure_ascii=False,indent=2)+'\n')
thumbs=[]
for a in assets:
 im=Image.open(out/a['asset']);im.thumbnail((240,130));tile=Image.new('RGB',(260,165),'white');tile.paste(im,(10,5));ImageDraw.Draw(tile).text((10,143),a['asset'],fill='black');thumbs.append(tile)
grid=Image.new('RGB',(1300,165*((len(thumbs)+4)//5)),'#dddddd')
for i,t in enumerate(thumbs):grid.paste(t,((i%5)*260,(i//5)*165))
if args.contact_sheet: grid.save(args.contact_sheet)
print('SOURCE_ASSETS',len(assets),'BYTES',sum(p.stat().st_size for p in out.glob('*.png')))
