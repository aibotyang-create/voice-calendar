const escape=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
export function categoryMoveFromText(text,categories){
 if(!/(이동|옮겨|옮기|변경|바꿔|수정)/.test(text))return null;let target=null;
 for(const name of categories){const match=new RegExp(escape(name)+'\\s*(?:카테고리|분류)?\\s*(?:으로|로)\\s*(?:모두|전부)?\\s*(?:이동|옮겨|옮기|변경|바꿔|수정)').exec(text);if(match&&(!target||match.index>target.index))target={name,index:match.index};}
 if(!target)return null;const before=text.slice(0,target.index),firstCategory=categories.map(c=>before.indexOf(c)).filter(i=>i>=0),end=firstCategory.length?Math.min(...firstCategory):before.length;let namesPart=before.slice(0,end).trim().replace(/(?:은|는|을|를)?\s*(?:모두|전부)?\s*(?:지금|이제)?\s*$/,'').trim();
 const names=namesPart.split(/[,，、\n]|\s+(?:그리고|및)\s+|(?:와|과)\s+/).map(n=>n.trim().replace(/(?:은|는|을|를)$/,'').trim()).filter(Boolean);
 if(!names.length||names.length>20||names.some(n=>!/^@?[가-힣A-Za-z][가-힣A-Za-z .-]{0,49}$/.test(n)))return null;
 return [...new Set(names.map(n=>n.replace(/^@/,'')))].map(name=>({name,company:'',title:'',category:target.name,categoryExplicit:true,intent:'update',lastContact:'',notes:'',focus:'',followup:'',email:'',phone:'',address:'',tags:[],meeting:null,sourceQuote:text}));
}
export function collectiveFriendFacts(text){const match=/(?:전부|모두|다)\s*(?:(대학교|고등학교|중학교|초등학교|대학|학교)\s*)?친구/.exec(text);return match?{category:'친구',tag:match[1]||''}:null;}

export function requestsNewContact(text) {
  return /(?:신규|새로운|새)\s*(?:인맥|연락처|사람)|(?:인맥|연락처)(?:으로|로|에|을|를)?\s*(?:신규로?\s*|새로\s*)?(?:추가|등록)|신규\s*등록/.test(text);
}

// Only unambiguous name-only registration commands bypass model extraction.
export function simpleNewContacts(text){
  const match=String(text).trim().match(/^(?:(?:새로운?\s*)?(?:인맥|사람|연락처)\s*(?:추가|등록)?\s*[:：]?\s*)?([가-힣]{2,5}?(?:님)?(?:\s*[,，]\s*[가-힣]{2,5}?(?:님)?)*)\s*(?:을|를)?\s*(?:(?:새\s*)?(?:인맥|사람|연락처)(?:으로|로|에)?\s*)?(?:추가|등록)(?:해\s*줘|해주세요|해줘요|해|하기)?[.!！\s]*$/);
  if(!match)return null;
  const names=[...new Set(match[1].split(/[,，]/).map(n=>n.trim().replace(/님$/,'')))];
  if(names.some(n=>['인맥','사람','연락처','새로운'].includes(n)))return null;
  return names.map(name=>({name,intent:'record',sourceQuote:text,category:'지인',tags:[],meeting:null}));
}
