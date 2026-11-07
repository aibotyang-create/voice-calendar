export const personRadius=value=>10+Math.pow(Math.max(1,Math.min(5,Number(value)||2)),1.7)*2.8;
export const nodeKey=n=>JSON.stringify([n.group?.name||'__root__',n.person.id||n.person.name]);
export function nodeBox(n){const half=Math.max(n.radius+9,n.person.name.length*7+8);return {x:n.x-half,y:n.y-n.radius-9,w:half*2,h:n.radius*2+42};}
const overlaps=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
export function freePosition(node,occupied){const origin={x:node.x,y:node.y};for(let i=0;i<12000;i++){const angle=i*2.399963229728653,distance=i?12*Math.sqrt(i):0,candidate={...node,x:origin.x+Math.cos(angle)*distance,y:origin.y+Math.sin(angle)*distance};if(!occupied.some(box=>overlaps(nodeBox(candidate),box)))return candidate;}return {...node,y:Math.max(0,...occupied.map(b=>b.y+b.h))+node.radius+24};}
export function arrangeNetwork(layout,positions=new Map()){
 const groups=layout.groups.map(g=>({...g,...positions.get('group:'+g.name)})),root=layout.root||{x:500,y:320},occupied=[{x:root.x-48,y:root.y-48,w:96,h:100},...groups.map(g=>({x:g.x-55,y:g.y-30,w:110,h:48}))],nodes=[];
 const ordered=layout.nodes.slice().sort((a,b)=>Number(positions.has(nodeKey(b)))-Number(positions.has(nodeKey(a)))||nodeKey(a).localeCompare(nodeKey(b)));
 for(const original of ordered){const group=groups.find(g=>g.name===original.group.name)||original.group,delta={x:group.x-original.group.x,y:group.y-original.group.y},saved=positions.get(nodeKey(original)),node=freePosition({...original,group,x:original.x+delta.x,y:original.y+delta.y,...saved},occupied);nodes.push(node);occupied.push(nodeBox(node));}
 return {...layout,groups,nodes};
}
export function networkBounds(layout){const boxes=layout.nodes.map(nodeBox).concat(layout.groups.map(g=>({x:g.x-60,y:g.y-35,w:120,h:70})),[{x:450,y:270,w:100,h:100}]);const x=Math.min(0,...boxes.map(b=>b.x))-30,y=Math.min(0,...boxes.map(b=>b.y))-30,right=Math.max(1000,...boxes.map(b=>b.x+b.w))+30,bottom=Math.max(640,...boxes.map(b=>b.y+b.h))+30;return [x,y,right-x,bottom-y].join(' ');}
export function bindNodeDrag(svg,state){
 if(svg._nodeDragBound)return;svg._nodeDragBound=true;let drag=null;
 svg.addEventListener('pointerdown',e=>{const target=e.target.closest?.('.person-node,.network-branch');if(e.button!==0||!target)return;const matrix=svg.getScreenCTM?.()?.inverse();if(!matrix)return;const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(matrix),key=target.dataset.positionKey,node=state().items.get(key);if(!node)return;svg.dataset.view=svg.getAttribute('viewBox');drag={key,p,node:{...node},matrix,id:e.pointerId,moved:false};svg.setPointerCapture?.(e.pointerId);e.preventDefault();e.stopPropagation();});
 svg.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(drag.matrix);if(Math.hypot(p.x-drag.p.x,p.y-drag.p.y)<4&&!drag.moved)return;drag.moved=true;state().positions.set(drag.key,{x:drag.node.x+p.x-drag.p.x,y:drag.node.y+p.y-drag.p.y});state().redraw();e.stopPropagation();});
 const end=e=>{if(!drag)return;if(drag.moved){svg._ignoreNodeClick=Date.now()+300;state().redraw();}svg.releasePointerCapture?.(drag.id);drag=null;e.stopPropagation();};svg.addEventListener('pointerup',end);svg.addEventListener('pointercancel',end);
 svg.addEventListener('click',e=>{if(Date.now()<(svg._ignoreNodeClick||0)){e.preventDefault();e.stopImmediatePropagation();}},true);
}
