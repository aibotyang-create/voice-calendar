import {outlineText} from './todo-outline.js';
export function todoSubtree(items,id){const start=items.findIndex(t=>t.id===id);if(start<0)return [];const depth=items[start].depth??outlineText(items[start].text).depth;let end=start+1;while(end<items.length&&(items[end].depth??outlineText(items[end].text).depth)>depth)end++;return items.slice(start,end);}
const level=t=>t.depth??outlineText(t.text).depth;
function parentOf(items,index){const depth=level(items[index]);if(!depth)return null;for(let i=index-1;i>=0;i--)if(level(items[i])<depth)return items[i].id;return null;}
export function moveTodoSubtree(items,from,to,after=false){const original=items.map(t=>t.id),group=todoSubtree(items,from),start=items.findIndex(t=>t.id===from);if(!group.length||group.some(t=>t.id===to))return original;const depth=level(items[start]),moving=new Set(group.map(t=>t.id)),rest=items.filter(t=>!moving.has(t.id));let targetIndex=rest.findIndex(t=>t.id===to);if(targetIndex<0)return original;
 // A drop on a descendant means before/after its existing sibling group,
 // never inside another parent's children. Reparenting requires explicit Tab.
 while(targetIndex>0&&level(rest[targetIndex])>depth)targetIndex--;
 if(level(rest[targetIndex])!==depth||parentOf(rest,targetIndex)!==parentOf(items,start))return original;
 const target=todoSubtree(rest,rest[targetIndex].id);rest.splice(targetIndex+(after?target.length:0),0,...group);return rest.map(t=>t.id);}
