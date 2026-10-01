(function(){
  const page = document.body.dataset.page || '';
  const nav = document.querySelector('[data-nav]');
  if(nav){
    const items=[['index.html','HOME'],['trip.html','TRIP'],['food.html','FOOD'],['map.html','MAP'],['guide.html','GUIDE'],['bookings.html','BOOKINGS'],['saved.html','SAVED']];
    nav.innerHTML=`<a class="brand" href="index.html"><span>N/</span><small>TRAVEL JOURNAL</small></a><div class="navlinks">${items.map(([href,label])=>`<a href="${href}" class="${page===label.toLowerCase()?'active':''}">${label}</a>`).join('')}</div><a class="edit-link" href="admin.html">EDIT</a>`;
  }
  const year=document.querySelector('[data-year]'); if(year) year.textContent=new Date().getFullYear();

  const gallery=document.querySelector('[data-home-gallery]');
  if(gallery){
    gallery.innerHTML=TRIP_DATA.gallery.map((g,i)=>`<figure class="photo-tile ${i===0?'wide':''}"><img src="${g.src}" alt="${g.alt}"><figcaption>${g.label}</figcaption></figure>`).join('');
  }

  const itinerary=document.querySelector('[data-itinerary]');
  if(itinerary){
    itinerary.innerHTML=TRIP_DATA.itinerary.map(d=>`<article class="day-detail-card">
      <div class="day-detail-image"><img src="${d.image}" alt="${d.place}"><span class="day-pill">DAY ${d.day}</span></div>
      <div class="day-detail-main">
        <div class="eyebrow">${d.date}</div><h2>${d.place}</h2><p class="cn">${d.cn}</p><p class="day-summary">${d.summary}</p>
        <div class="route-chips">${d.route.map((x,i)=>`<span>${i?'<b>→</b> ':''}${x}</span>`).join('')}</div>
        <div class="day-columns"><div><h4>MORNING / 上午</h4>${d.morning.length?`<ul>${d.morning.map(x=>`<li>${x}</li>`).join('')}</ul>`:'<p>—</p>'}</div><div><h4>AFTERNOON / 下午</h4>${d.afternoon.length?`<ul>${d.afternoon.map(x=>`<li>${x}</li>`).join('')}</ul>`:'<p>—</p>'}</div><div><h4>EVENING / 晚上</h4>${d.evening.length?`<ul>${d.evening.map(x=>`<li>${x}</li>`).join('')}</ul>`:'<p>—</p>'}</div></div>
      </div>
      <aside class="day-detail-side"><div class="mini-stat"><span>DRIVE</span><strong>${d.drive}</strong></div><div class="mini-stat"><span>STAY</span><strong>${d.stay}</strong></div><div class="mini-stat"><span>FOOD</span><strong>${d.food}</strong></div><div class="mini-stat"><span>BOOKING</span><strong>${d.booking}</strong></div><div class="trip-tip"><span>NOTE</span>${d.tip}</div><div class="day-highlights">${d.highlights.map(x=>`<span>${x}</span>`).join('')}</div></aside>
    </article>`).join('');
  }

  const bookingGrid=document.querySelector('[data-bookings]');
  if(bookingGrid){
    bookingGrid.innerHTML=TRIP_DATA.bookings.map(b=>`<article class="simple-card"><div class="eyebrow">${b.type} · ${b.date}</div><h3>${b.name}</h3><p>${b.note}</p><div class="card-bottom"><span class="status">${b.status}</span>${b.url?`<a href="${b.url}" target="_blank" rel="noopener">OPEN ↗</a>`:''}</div></article>`).join('');
  }

  const foodGrid=document.querySelector('[data-food]');
  const filterWrap=document.querySelector('[data-food-filters]');
  let activeFoodFilter='All';
  if(filterWrap){
    filterWrap.innerHTML=TRIP_DATA.foodRegions.map(r=>`<button class="filter ${r==='All'?'active':''}" data-food-filter="${r}">${r.toUpperCase()}</button>`).join('');
    filterWrap.querySelectorAll('[data-food-filter]').forEach(btn=>btn.addEventListener('click',()=>{
      filterWrap.querySelectorAll('[data-food-filter]').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); activeFoodFilter=btn.dataset.foodFilter; renderFood(activeFoodFilter); renderFoodMap(activeFoodFilter);
    }));
  }
  if(foodGrid){ renderFood('All'); }
  function renderFood(filter){
    if(!foodGrid) return;
    const rows=TRIP_DATA.food.filter(x=>filter==='All'||x.region===filter);
    foodGrid.innerHTML=rows.map(f=>`<article class="food-card"><div class="food-city">${f.region} · ${f.city}</div><div><span class="chip">${f.cat}</span><span class="price">${f.price}</span></div><h3>${f.name}</h3><p><strong>TRY / BUY</strong> ${f.must}</p><p>${f.note}</p><a href="${f.url}" target="_blank" rel="noopener">MAP / WEBSITE ↗</a></article>`).join('');
    const list=document.querySelector('[data-food-region-list]'); if(list){
      const count={}; TRIP_DATA.food.forEach(x=>count[x.region]=(count[x.region]||0)+1);
      list.innerHTML=TRIP_DATA.foodRegions.filter(x=>x!=='All').map(r=>`<button data-jump-food="${r}"><span>${r}</span><b>${count[r]||0}</b></button>`).join('');
      list.querySelectorAll('[data-jump-food]').forEach(btn=>btn.addEventListener('click',()=>{
        const target=filterWrap?.querySelector(`[data-food-filter="${CSS.escape(btn.dataset.jumpFood)}"]`); target?.click(); document.querySelector('.filters')?.scrollIntoView({behavior:'smooth'});
      }));
    }
  }

  let leafMap, leafMarkers=[];
  function renderFoodMap(filter){
    const el=document.getElementById('foodMap'); if(!el || typeof L==='undefined') return;
    if(!leafMap){
      leafMap=L.map('foodMap',{scrollWheelZoom:false}).setView([63.9,-19.5],6);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'&copy; OpenStreetMap'}).addTo(leafMap);
    }
    leafMarkers.forEach(m=>leafMap.removeLayer(m)); leafMarkers=[];
    const rows=TRIP_DATA.food.filter(x=>filter==='All'||x.region===filter);
    const bounds=[];
    rows.forEach(f=>{
      const isMarket=/Supermarket|Convenience/.test(f.cat);
      const icon=L.divIcon({className:'food-marker-wrap',html:`<span class="food-marker ${isMarket?'market':'eat'}">${isMarket?'S':'•'}</span>`,iconSize:[26,26],iconAnchor:[13,13]});
      const m=L.marker([f.lat,f.lng],{icon}).addTo(leafMap).bindPopup(`<strong>${f.name}</strong><br>${f.region} · ${f.cat}<br><small>${f.must}</small><br><a href="${f.url}" target="_blank" rel="noopener">Open map ↗</a>`); leafMarkers.push(m); bounds.push([f.lat,f.lng]);
    });
    if(bounds.length===1) leafMap.setView(bounds[0],10); else if(bounds.length>1) leafMap.fitBounds(bounds,{padding:[30,30]});
  }
  if(document.getElementById('foodMap')) renderFoodMap('All');

  const saved=document.querySelector('[data-saved]');
  if(saved){ saved.innerHTML=TRIP_DATA.saved.map(s=>`<article class="simple-card"><div class="eyebrow">${s.tag}</div><h3>${s.name}</h3><p class="cn">${s.cn}</p><p>${s.note}</p></article>`).join(''); }

  const guide=document.querySelector('[data-guide-links]');
  if(guide){ guide.innerHTML=TRIP_DATA.guideLinks.map(g=>`<a class="guide-link" href="${g.url}" target="_blank" rel="noopener"><span>${g.name}<small>${g.cn}</small></span><b>↗</b></a>`).join(''); }
})();
