import {edgeBetween,fixedColor} from './planner-data.js';
import {categoryOptions,contactColor,contactAge} from './people-data.js';
const stablePersonOrder=(a,b)=>String(a.id||a.name).localeCompare(String(b.id||b.name));
function rayPosition(group,angle,distance){const dx=Math.cos(angle),dy=Math.sin(angle),limits=[dx>0?(952-group.x)/dx:dx<0?(48-group.x)/dx:Infinity,dy>0?(592-group.y)/dy:dy<0?(48-group.y)/dy:Infinity],scale=Math.min(1,...limits.map(n=>n/184));return {x:group.x+dx*distance*scale,y:group.y+dy*distance*scale};}
export function importanceDistance(strength,base=80){const value=Math.max(1,Math.min(5,Number(strength)||2));return base+(5-value)*24;}
export function filterNetwork(people,{category='전체',query='',company='',importance=0,stale=false,tag=''}={}){return people.filter(p=>!p.archived&&(!tag||(p.tags||[]).includes(tag))&&(category==='전체'||p.category===category)&&(!company||p.company===company)&&p.strength>=Number(importance)&&(!stale||(contactAge(p.lastContact)??0)>=30)&&[p.name,p.company,p.title].join(' ').toLowerCase().includes(query.toLowerCase()));}
export function networkLayout(people,options=[],{category='전체',tag=''}={}){
  if(category!=='전체')return taggedLayout(people,options,category,tag);
  const selected=people.slice().sort(stablePersonOrder).slice(0,60),names=(options.length?options:categoryOptions()).map(c=>c.name).filter(name=>selected.some(p=>p.category===name));
  const groups=names.map((name,i)=>{const angle=-Math.PI/2+(i+.25)*Math.PI*2/Math.max(names.length,1);return {name,x:500+Math.cos(angle)*245,y:320+Math.sin(angle)*170,color:options.find(o=>o.name===name)?.color||'#8192b6',angle};});
  const nodes=[];for(const group of groups){const members=selected.filter(p=>p.category===group.name);members.forEach((person,i)=>{const spread=members.length===1?0:(i/(members.length-1)-.5)*2.4;const angle=group.angle+spread,r=importanceDistance(person.strength)+(i%3)*4;nodes.push({person,...rayPosition(group,angle,r),radius:12+Number(person.strength)*3.5,group});});}
  const root={x:500,y:320,color:'#a1b6db',direct:true};selected.filter(p=>!names.includes(p.category)).forEach((person,i)=>nodes.push({person,group:root,x:280+(i%5)*110,y:510+Math.floor(i/5)*65,radius:12+Number(person.strength)*3.5}));
  return {groups,nodes};
}
function gentleCurve(edge){const {x1,y1,x2,y2}=edge,dx=x2-x1,dy=y2-y1,length=Math.hypot(dx,dy)||1,bend=Math.min(20,length*.12);return `M${x1} ${y1} Q${(x1+x2)/2-dy/length*bend} ${(y1+y2)/2+dx/length*bend} ${x2} ${y2}`;}
export function renderNetwork(svg,people,records,onSelect,{compact=false,category='전체',tag=''}={}){
  const savedView=svg.dataset.view||'0 0 1000 640';svg.replaceChildren();svg.setAttribute('viewBox',savedView);const options=categoryOptions(records,people),layout=networkLayout(compact?people.slice().sort(stablePersonOrder).slice(0,16):people,options,{category,tag});
  const n=(tag,attrs,text)=>{const e=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [key,value]of Object.entries(attrs))e.setAttribute(key,value);if(text)e.textContent=text;return e;};
  for(const group of layout.groups){const edge=edgeBetween(layout.root||{x:500,y:320},group,30,8);const line=n('path',{d:gentleCurve(edge),'stroke-linecap':'round',fill:'none',stroke:group.color,'stroke-width':2,'stroke-opacity':.25});svg.append(line,n('circle',{cx:group.x,cy:group.y,r:8,fill:group.color,'fill-opacity':.5}),n('text',{x:group.x,y:group.y-17,'text-anchor':'middle',fill:'#6c7286','font-size':13,'font-weight':600},group.name));}
  for(const item of layout.nodes){const {person:p,x,y,radius,group}=item,color=options.find(c=>c.name===p.category)?.color||group.color,edge=edgeBetween(group,{x,y},group.direct||group===layout.root?30:8,radius);svg.append(n('path',{d:gentleCurve(edge),'stroke-linecap':'round',fill:'none',stroke:color,'stroke-width':1.4,'stroke-opacity':.28}));const g=n('g',{class:'person-node',role:'button',tabindex:0,'aria-label':p.name+', '+p.category+', 중요도 '+p.strength});g.append(n('circle',{cx:x,cy:y,r:radius+6,fill:color,'fill-opacity':.045}),n('circle',{cx:x,cy:y,r:radius,fill:color,'fill-opacity':.33,stroke:color,'stroke-opacity':.75}),n('text',{x,y:y+6,'text-anchor':'middle',fill:'#596279','font-size':Math.max(13,radius*.55),'font-weight':600},p.name.slice(0,1)),n('text',{x,y:y+radius+20,'text-anchor':'middle',fill:'#595367','font-size':compact?15:13},p.name));g.onclick=()=>onSelect(p);g.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(p);}};svg.append(g);}
  if(layout.root){const r=layout.root;svg.append(n('circle',{cx:r.x,cy:r.y,r:30,fill:r.color}),n('text',{x:r.x,y:r.y+5,'text-anchor':'middle',fill:'#596279','font-size':14},category));return;}
  svg.append(n('circle',{cx:500,cy:320,r:44,fill:'#a1b6db','fill-opacity':.08}),n('circle',{cx:500,cy:320,r:30,fill:'#92a9cf'}),n('text',{x:500,y:327,'text-anchor':'middle',fill:'#fff','font-size':19,'font-weight':600},'나'));
}

export function taggedLayout(people,options,category,tag=''){
 const selected=people.filter(p=>p.category===category).sort(stablePersonOrder).slice(0,60),color=options.find(c=>c.name===category)?.color||'#8192b6';
 const names=[...new Set(selected.flatMap(p=>p.tags||[]))].filter(name=>!tag||name===tag).sort();
 const groups=names.map((name,i)=>({name,color,x:370,y:70+(i+.5)*500/Math.max(1,names.length)})),nodes=[];
 for(const group of groups){const members=selected.filter(p=>(p.tags||[]).includes(group.name)),band=500/Math.max(1,groups.length);members.forEach((person,i)=>{const distance=importanceDistance(person.strength,100)+(i%3)*4,maxAngle=Math.min(.75,Math.asin(Math.min(1,(group.y-35)/204)),Math.asin(Math.min(1,(605-group.y)/204))),angle=members.length===1?0:(i/(members.length-1)-.5)*2*maxAngle;nodes.push({person,group,x:group.x+Math.cos(angle)*distance,y:group.y+Math.sin(angle)*distance,radius:12+Number(person.strength)*3.5});});}
 const root={x:120,y:320,color};if(!tag){const untagged=selected.filter(p=>!p.tags?.length);untagged.forEach((person,i)=>nodes.push({person,group:root,x:groups.length?240+(i%3)*95:370+(i%4)*150,y:groups.length?540+Math.floor(i/3)*44:110+Math.floor(i/4)*100,radius:12+Number(person.strength)*3.5}));}
 return {root,groups,nodes};
}
