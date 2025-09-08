(function(){
  const grid = document.getElementById('portfolio-grid');
  const filterButtons = document.querySelectorAll('.filter-btn');
  const ownerNameEl = document.getElementById('owner-name');
  const ownerRoleEl = document.getElementById('owner-role');
  const ownerIntroEl = document.getElementById('owner-intro');
  const yearEl = document.getElementById('year');

  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const state = {
    all: [],
    filter: 'web'
  };

  // Utility
  const el = (tag, attrs = {}, children = []) => {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([k,v])=>{
      if (k === 'class') node.className = v;
      else if (k === 'dataset') Object.assign(node.dataset, v);
      else if (k === 'html') node.innerHTML = v;
      else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
      else if (v !== undefined && v !== null) node.setAttribute(k, v);
    });
    [].concat(children).filter(Boolean).forEach(c=>{
      if (typeof c === 'string') node.appendChild(document.createTextNode(c));
      else node.appendChild(c);
    });
    return node;
  };

  function render(filter = state.filter){
    state.filter = filter;
    grid.innerHTML = '';

    const projects = state.all.filter(p => filter === 'all' ? true : p.type === filter);

    if (projects.length === 0){
      grid.appendChild(el('div', {class:'card'}, [
        el('div', {class:'card-title'}, 'まだ作品がありません'),
        el('p', {class:'card-desc'}, 'data/portfolio.json を編集して作品を追加してください。')
      ]));
      return;
    }

    projects.forEach(p => {
      const card = createCard(p);
      grid.appendChild(card);
    });
  }

  function createCard(item){
    const badges = el('div', {class:'badges'},
      (item.tags || []).map(t => el('span', {class:'badge'}, t))
    );

    const desc = el('p', {class:'card-desc'}, item.description || '');

    const thumb = el('div', {class:'card-thumb', role:'img', 'aria-label': `${item.title} のサムネイル`});
    if (item.image){
      thumb.style.backgroundImage = `url('${item.image}')`;
      thumb.style.backgroundSize = 'cover';
      thumb.style.backgroundPosition = 'center';
    }

    if (item.type === 'web'){
      const link = el('a', {
        class:'card',
        href: item.url || '#',
        target: '_blank',
        rel: 'noopener',
        'aria-label': `${item.title} を開く`
      }, [
        thumb,
        el('div', {class:'card-title'}, item.title),
        desc,
        badges
      ]);
      return link;
    }

    // mobile
    const actions = el('div', {class:'card-actions'}, [
      item.appStoreUrl ? el('a', {class:'btn', href:item.appStoreUrl, target:'_blank', rel:'noopener', onclick:(ev)=>ev.stopPropagation()}, 'App Store') : null,
      item.playStoreUrl ? el('a', {class:'btn', href:item.playStoreUrl, target:'_blank', rel:'noopener', onclick:(ev)=>ev.stopPropagation()}, 'Google Play') : null,
      item.websiteUrl ? el('a', {class:'btn', href:item.websiteUrl, target:'_blank', rel:'noopener', onclick:(ev)=>ev.stopPropagation()}, '公式サイト') : null
    ].filter(Boolean));

    const primaryUrl = item.websiteUrl || item.appStoreUrl || item.playStoreUrl;

    const container = el('div', {
      class: 'card' + (primaryUrl ? ' clickable' : ''),
      role: primaryUrl ? 'link' : 'group',
      'aria-label': item.title,
      tabindex: primaryUrl ? '0' : undefined,
      onclick: primaryUrl ? (() => window.open(primaryUrl, '_blank', 'noopener')) : undefined,
      onkeydown: primaryUrl ? ((e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); window.open(primaryUrl, '_blank', 'noopener'); } }) : undefined
    }, [
      thumb,
      el('div', {class:'card-title'}, item.title),
      desc,
      badges,
      actions
    ]);

    return container;
  }

  function setActiveFilterButton(){
    filterButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === state.filter);
      btn.setAttribute('aria-selected', btn.dataset.filter === state.filter ? 'true' : 'false');
    });
  }

  // Load data
  async function load(){
    try{
      const res = await fetch('data/portfolio.json', {cache: 'no-cache'});
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.owner){
        if (ownerNameEl && data.owner.name) ownerNameEl.textContent = data.owner.name;
        if (ownerRoleEl && data.owner.role) ownerRoleEl.textContent = data.owner.role;
        if (ownerIntroEl && data.owner.intro) ownerIntroEl.textContent = data.owner.intro;
      }
      state.all = Array.isArray(data.projects) ? data.projects : [];
    } catch (e){
      // Fallback sample
      console.warn('データの読み込みに失敗しました。サンプルデータを表示します。', e);
      state.all = [
        {
          id: 'sample-web',
          type: 'web',
          title: 'サンプルWebサイト',
          description: 'GitHub Pagesで公開する静的サイトのサンプルです。',
          url: 'https://example.com',
          tags: ['HTML', 'CSS', 'Vanilla JS']
        },
        {
          id: 'sample-mobile',
          type: 'mobile',
          title: 'サンプルToDoアプリ',
          description: 'Flutterで制作したシンプルなタスク管理アプリ。',
          playStoreUrl: 'https://play.google.com/store/apps/details?id=com.example.todo',
          appStoreUrl: 'https://apps.apple.com/jp/app/id0000000000',
          websiteUrl: 'https://example.com/todo',
          tags: ['Flutter', 'Dart']
        }
      ];
    } finally {
      // Initial filter from hash if any
      const hash = (location.hash || '').replace('#','');
      if (['web','mobile','all'].includes(hash)) state.filter = hash;
      render(state.filter);
      setActiveFilterButton();
    }
  }

  // Events
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      render(btn.dataset.filter);
      setActiveFilterButton();
      history.replaceState(null, '', `#${btn.dataset.filter}`);
    });
  });

  load();
})();
