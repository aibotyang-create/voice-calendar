// Repair model quotation formatting without accepting a name absent from input.
export function groundContactQuotes(value,source){
  if(!Array.isArray(value?.contacts))return value;
  const normalized=s=>String(s||'').normalize('NFKC').replace(/\s+/g,' ').trim();
  const original=normalized(source);
  return {...value,contacts:value.contacts.map(raw=>{
    if(!raw||typeof raw.name!=='string')return raw;
    const name=raw.name.trim(),quote=normalized(raw.sourceQuote);
    if(quote&&original.includes(quote)&&quote.includes(name))return raw;
    if(!name||!original.includes(name))return raw;
    const repaired={...raw,sourceQuote:source};
    // A broken citation must not grant evidence to invented profile details.
    for(const key of ['company','title','email','phone','address','notes','focus','followup']){
      if(repaired[key]&&!original.includes(normalized(repaired[key])))repaired[key]='';
    }
    return repaired;
  })};
}
