const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node;};
export function initContactVault({host,getData}){
 const section=el('section','contact-record-section contact-vault'),heading=el('h3','','관련 보관함'),state=el('p','contact-vault-state'),list=el('div','contact-vault-list'),preview=el('article','contact-vault-preview');state.setAttribute('role','status');preview.hidden=true;section.append(heading,state,list,preview);host.append(section);
 let off=()=>{},store=null,personId='',revision=0,url='',selected='';
 function clearPreview(){revision++;if(url)URL.revokeObjectURL(url);url='';selected='';preview.replaceChildren();preview.hidden=true;}
 function close(){off();off=()=>{};store=null;personId='';list.replaceChildren();clearPreview();}
 function markdown(text){for(const line of text.split('\n')){const head=line.match(/^(#{1,3})\s+(.*)/),task=line.match(/^\s*[-*]\s+\[([ xX])\]\s+(.*)/);if(head)preview.append(el('h'+(Number(head[1].length)+1),'',head[2]));else if(task){const row=el('p','contact-vault-check'),check=el('input');check.type='checkbox';check.checked=task[1].toLowerCase()==='x';check.disabled=true;row.append(check,document.createTextNode(task[2]));preview.append(row);}else preview.append(el('p','',line.replace(/^\s*[-*]\s+/,'• ')));}}
 async function openDocument(entry){const owner=store;clearPreview();selected=entry.id;const mine=revision;preview.hidden=false;const bar=el('div','contact-vault-preview-head'),title=el('strong','',entry.title||entry.filename),dismiss=el('button','text-button','닫기 ×');dismiss.type='button';dismiss.onclick=clearPreview;bar.append(title,dismiss);preview.append(bar,el('p','','불러오는 중…'));
  try{
   const blob=await owner.documentBlob(entry);if(mine!==revision||getData().store!==owner)return;
   preview.lastElementChild.remove();
   if(entry.source==='note'||entry.source==='generated'||entry.mime?.startsWith('text/')){const text=entry.source==='note'||entry.source==='generated'?String(entry.content||''):await blob.text();if(mine!==revision||getData().store!==owner)return;markdown(text.slice(0,200000));}
   else if(entry.mime?.startsWith('image/')){url=URL.createObjectURL(blob);const img=el('img');img.src=url;img.alt=entry.title||entry.filename;preview.append(img);}
   else if(entry.mime==='application/pdf'){url=URL.createObjectURL(blob);const frame=el('iframe');frame.src=url;frame.title=entry.title||entry.filename;frame.setAttribute('sandbox','');preview.append(frame);}
   else if(/^[-\w]{10,200}$/.test(entry.driveFileId||'')){const frame=el('iframe');frame.src='https://drive.google.com/file/d/'+encodeURIComponent(entry.driveFileId)+'/preview';frame.title=entry.title||entry.filename;frame.setAttribute('sandbox','allow-scripts allow-same-origin');preview.append(frame);}
   else preview.append(el('p','','이 형식은 바로 미리보기할 수 없어요.'));
  }catch(e){if(mine===revision&&getData().store===owner){preview.lastElementChild?.remove();preview.append(el('p','',e.message||'문서를 불러오지 못했어요.'));}}
 }
 function openPerson(person){close();personId=person.id||'';store=getData().store;state.textContent=!personId?'인맥을 등록하면 연결한 기록을 확인할 수 있어요.':!store?'Google 로그인 후 확인할 수 있어요.':'불러오는 중…';if(!personId||!store)return;const owner=store,id=personId;
  off=store.watchContactDocuments(id,entries=>{if(store!==owner||getData().store!==owner||personId!==id)return;const items=entries.filter(d=>!d.archived&&d.contactId===id).sort((a,b)=>b.date.localeCompare(a.date)||Number(b.createdAt)-Number(a.createdAt));state.textContent=items.length?'':'연결된 노트·서류가 없어요.';list.replaceChildren();if(selected&&!items.some(d=>d.id===selected))clearPreview();for(const entry of items){const button=el('button','contact-vault-item'),date=el('small','',entry.date.slice(5).replace('-','/'));button.type='button';button.append(el('span','',entry.title||entry.filename||'제목 없음'),date);button.onclick=()=>openDocument(entry);list.append(button);}},e=>{if(store===owner&&getData().store===owner)state.textContent=e.message||'보관함을 불러오지 못했어요.';});
 }
 host.closest('dialog')?.addEventListener('close',close);
 return {openPerson,render(){if(store&&getData().store!==store){close();state.textContent='Google 로그인 후 다시 인맥을 선택해주세요.';}},close};
}
