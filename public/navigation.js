const routes={overview:'overview',capture:'registration',peopleCapture:'registration',calendar:'calendar',agendaTitle:'calendar',people:'people',preparation:'preparation',vault:'vault'};
export function pageForHash(hash){return routes[hash.replace(/^#/,'')]||'overview';}
export function installNavigation({views,nav,onChange=()=>{}}){
  function show(){const page=pageForHash(location.hash);for(const [name,view]of Object.entries(views))view.hidden=name!==page;document.body.dataset.page=page;
    for(const a of nav.querySelectorAll('a')){const active=pageForHash(a.hash)===page;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');}
    const labels={overview:'대시보드',registration:'일정 관리',calendar:'캘린더',people:'인맥 관리',preparation:'만남 준비',vault:'보관함'};document.title='AI-calendar · '+labels[page];const breadcrumb=document.querySelector('.header-workspace strong');if(breadcrumb)breadcrumb.textContent=labels[page];
    onChange(page);window.scrollTo({top:0,behavior:'instant'});
  }
  for(const a of nav.querySelectorAll('a'))a.onclick=e=>{e.preventDefault();if(location.hash===a.hash)show();else location.hash=a.hash;};
  window.addEventListener('hashchange',show);show();return {show,navigate:hash=>{if(location.hash!=='#'+hash)location.hash=hash;show();}};
}
