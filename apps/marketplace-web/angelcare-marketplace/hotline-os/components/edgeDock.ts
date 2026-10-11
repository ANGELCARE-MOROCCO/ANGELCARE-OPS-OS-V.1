export type Edge='left'|'right'|'top'|'bottom'
export type Dock={version:1;edge:Edge;fraction:number}
export type Bounds={left:number;right:number;top:number;bottom:number}
export const DEFAULT_DOCK:Dock={version:1,edge:'right',fraction:.8}
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n))
export function dockBounds(width:number,height:number):Bounds {
 const mobile=width<=560;
 const top=Math.min(88,Math.max(12,height-68));return {left:12,right:Math.max(12,width-68),top,bottom:Math.max(top,height-(mobile?150:100))}
}
export function validDock(value:unknown):value is Dock {
 if(!value||typeof value!=='object')return false;
 const d=value as Dock;return d.version===1&&['left','right','top','bottom'].includes(d.edge)&&Number.isFinite(d.fraction)&&d.fraction>=0&&d.fraction<=1
}
export function dockPoint(d:Dock,b:Bounds){return d.edge==='left'||d.edge==='right'?{x:d.edge==='left'?b.left:b.right,y:b.top+(b.bottom-b.top)*d.fraction}:{x:b.left+(b.right-b.left)*d.fraction,y:d.edge==='top'?b.top:b.bottom}}
export function snapDock(x:number,y:number,b:Bounds):Dock {
 const distances:[Edge,number][]=[['left',Math.abs(x-b.left)],['right',Math.abs(x-b.right)],['top',Math.abs(y-b.top)],['bottom',Math.abs(y-b.bottom)]];
 const edge=distances.sort((a,b)=>a[1]-b[1])[0][0];
 return {version:1,edge,fraction:edge==='left'||edge==='right'?clamp((y-b.top)/Math.max(1,b.bottom-b.top),0,1):clamp((x-b.left)/Math.max(1,b.right-b.left),0,1)}
}
