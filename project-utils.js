export const normalise = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/œ/g,'oe').replace(/æ/g,'ae').trim();
export const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function filterProjects(projects, language, category, query) {
 const terms=normalise(query).split(/\s+/).filter(Boolean);
 return projects.filter(p=>{
  if(category!=='all'&&!p.category.includes(category))return false;
  const haystack=normalise([p.title.fr,p.title.en,p.short[language],p.kind[language],...p.tech,...p.category].join(' '));
  return terms.every(term=>haystack.includes(term));
 });
}

export function presentationFromSearch(search=''){
 const focus=new URLSearchParams(search).get('focus');
 return focus==='ai'?{scene:'neural',category:'ai'}:focus==='embedded'?{scene:'cpu',category:'embedded'}:{scene:'cpu',category:'all'};
}
