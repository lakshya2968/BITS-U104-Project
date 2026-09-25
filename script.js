(function(){
  const DATA=window.MAP_DATA, GRID=window.ROAD_GRID;
  const S=GRID.cellSize,W=GRID.width,H=GRID.height,G=GRID.grid;
  const startEl=document.getElementById('start'),endEl=document.getElementById('end'),modeEl=document.getElementById('routeMode');
  const weatherValue=document.getElementById('weatherValue'),weatherDetail=document.getElementById('weatherDetail');
  const recommendation=document.getElementById('recommendation'),recommendationDetail=document.getElementById('recommendationDetail'),routeMetrics=document.getElementById('routeMetrics');

  // The supplied Google Maps URL gives the campus center and zoom. These values
  // georeference the original 1920x1080 drawing onto the live Leaflet map.
  const MAP_CENTER={lat:15.3913605,lon:73.879555};
  const SOURCE_ZOOM=16.81;
  const SOURCE_CX=960, SOURCE_CY=530;
  const WORLD=256*Math.pow(2,SOURCE_ZOOM);

  function pixelToLatLng(x,y){
    const lon=MAP_CENTER.lon+(x-SOURCE_CX)/WORLD*360;
    const y0=Math.log(Math.tan(Math.PI/4+Math.radians(MAP_CENTER.lat)/2));
    const ym=y0-(y-SOURCE_CY)/WORLD*2*Math.PI;
    const lat=Math.degrees(2*Math.atan(Math.exp(ym))-Math.PI/2);
    return [lat,lon];
  }
  Math.radians=d=>d*Math.PI/180;
  Math.degrees=r=>r*180/Math.PI;

  const map=L.map('map',{preferCanvas:true}).setView([MAP_CENTER.lat,MAP_CENTER.lon],17);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    maxZoom:20,attribution:'&copy; OpenStreetMap contributors'
  }).addTo(map);

  const coveredLayer=L.layerGroup().addTo(map);
  const spineLayer=L.layerGroup().addTo(map);
  const markerLayer=L.layerGroup().addTo(map);
  const routeLayer=L.layerGroup().addTo(map);

  const locations=DATA.locations.map(p=>({...p,latlng:pixelToLatLng(p.x,p.y)}));
  const spine=DATA.paths.find(p=>p.type==='dspine');
  if(spine && spine.points && spine.points.length){
    spine.latlngs=spine.points.map(p=>pixelToLatLng(p.x,p.y));
  }
  const dspinePoint=spine && spine.points && spine.points.length ? spine.points[Math.floor(spine.points.length/2)] : null;

  // Build a small generated connector only where the supplied covered strokes are
  // disconnected. This lets D-Spine join the supplied A/B/C covered network while
  // keeping the connector visibly distinct on the map.
  const coveredGrid=G.map(row=>row.split(''));
  function rasterLine(a,b){
    const x1=Math.round(a.x/S),y1=Math.round(a.y/S),x2=Math.round(b.x/S),y2=Math.round(b.y/S);
    const n=Math.max(Math.abs(x2-x1),Math.abs(y2-y1));
    for(let i=0;i<=n;i++){const t=n?i/n:0;const x=Math.round(x1+(x2-x1)*t),y=Math.round(y1+(y2-y1)*t);if(x>=0&&x<W&&y>=0&&y<H)coveredGrid[y][x]='2';}
  }
  DATA.paths.filter(p=>p.type==='covered'||p.type==='dspine').forEach(p=>{
    for(let i=1;i<p.points.length;i++)rasterLine(p.points[i-1],p.points[i]);
  });
  const generatedConnectorCells=new Set();
  function makeCoveredConnector(){
    if(!spine||!spine.points.length)return;
    const target=DATA.locations.find(p=>p.name==='A wing')||DATA.locations.find(p=>p.name==='B dome');
    if(!target)return;
    const starts=[];const seenStart=new Set();
    spine.points.forEach(p=>{const x=Math.round(p.x/S),y=Math.round(p.y/S);if(x>=0&&x<W&&y>=0&&y<H){const k=key(x,y);if(!seenStart.has(k)){seenStart.add(k);starts.push(k);}}});
    const tx=Math.round(target.x/S),ty=Math.round(target.y/S);
    // Multi-source Dijkstra on the existing navigation grid, ending at the nearest
    // covered cell near the target. This is a generated bridge, not user-marked data.
    const dist=new Float64Array(W*H);dist.fill(Infinity);const prev=new Int32Array(W*H);prev.fill(-1);const heap=new Heap();
    starts.forEach(k=>{dist[k]=0;heap.push([0,k]);});
    const dirs=[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    let end=-1,bestTarget=Infinity;
    while(heap.a.length){
      const [d,k]=heap.pop();if(d!==dist[k])continue;if(d>bestTarget)break;
      const x=k%W,y=(k/W)|0;
      if(Math.hypot(x-tx,y-ty)<=3 && coveredGrid[y][x]==='2'){end=k;bestTarget=d;break;}
      for(const [dx,dy] of dirs){const nx=x+dx,ny=y+dy;if(nx<0||nx>=W||ny<0||ny>=H)continue;
        const typ=G[ny][nx];if(typ==='0')continue;const nk=key(nx,ny);const nd=d+Math.hypot(dx,dy)*(typ==='2'?1:1.05);
        if(nd<dist[nk]){dist[nk]=nd;prev[nk]=k;heap.push([nd,nk]);}
      }
    }
    if(end<0)return;
    let k=end;while(k!==-1){generatedConnectorCells.add(k);k=prev[k];}
    generatedConnectorCells.forEach(k=>{const [x,y]=parseKey(k);coveredGrid[y][x]='2';});
  }
  // key/parseKey are declared below; defer execution until after those helpers exist.
  if(dspinePoint){
    locations.push({id:'dspine',name:'D-Spine',type:'Covered corridor',x:dspinePoint.x,y:dspinePoint.y,latlng:pixelToLatLng(dspinePoint.x,dspinePoint.y),synthetic:true});
  }

  // Draw every supplied covered stroke on the actual map.
  DATA.paths.filter(p=>p.type==='covered').forEach(p=>{
    if(!p.points||p.points.length<2)return;
    L.polyline(p.points.map(q=>pixelToLatLng(q.x,q.y)),{color:'#f0c419',weight:6,opacity:.9,lineCap:'round',lineJoin:'round'}).addTo(coveredLayer);
  });
  if(spine && spine.latlngs){
    L.polyline(spine.latlngs,{color:'#e53935',weight:8,opacity:.95,lineCap:'round',lineJoin:'round'}).addTo(spineLayer);
  }

  const specialNames=new Set(['D-Spine','A wing','B dome','C wing']);
  locations.forEach((p,i)=>{
    const special=specialNames.has(p.name);
    const marker=L.circleMarker(p.latlng,{radius:special?8:5,color:special?'#17324d':'#334155',weight:2,fillColor:special?'#fff':'#fff',fillOpacity:1});
    marker.bindTooltip(p.name,{direction:'top',className:'route-label',offset:[0,-5]});
    marker.addTo(markerLayer);
  });

  // Layer control keeps the covered category explicit.
  L.control.layers(null,{'Covered paths':coveredLayer,'D-Spine':spineLayer,'Locations':markerLayer,'Routes':routeLayer},{collapsed:false}).addTo(map);

  function addOptions(){
    locations.forEach((p,i)=>{
      const a=document.createElement('option');a.value=i;a.textContent=p.name;startEl.appendChild(a);
      const b=a.cloneNode(true);endEl.appendChild(b);
    });
    const aIndex=locations.findIndex(p=>p.name==='A wing');
    const dIndex=locations.findIndex(p=>p.name==='D-Spine');
    const bIndex=locations.findIndex(p=>p.name==='B dome');
    const cIndex=locations.findIndex(p=>p.name==='C wing');
    startEl.value=String(dIndex>=0?dIndex:aIndex);
    endEl.value=String(bIndex>=0?bIndex:cIndex);
    return {dIndex,aIndex,bIndex,cIndex};
  }
  const idx=addOptions();

  function key(x,y){return y*W+x}
  function parseKey(k){return [k%W,Math.floor(k/W)]}
  class Heap{
    constructor(){this.a=[]}
    push(item){const a=this.a;a.push(item);let i=a.length-1;while(i){const p=(i-1)>>1;if(a[p][0]<=item[0])break;a[i]=a[p];i=p}a[i]=item}
    pop(){const a=this.a;if(!a.length)return null;const top=a[0],last=a.pop();if(a.length){let i=0;while(true){const l=i*2+1;if(l>=a.length)break;const r=l+1,c=r<a.length&&a[r][0]<a[l][0]?r:l;if(a[c][0]>=last[0])break;a[i]=a[c];i=c}a[i]=last}return top}
  }
  makeCoveredConnector();
  if(generatedConnectorCells.size){const ll=[];generatedConnectorCells.forEach(k=>{const [x,y]=parseKey(k);ll.push(pixelToLatLng(x*S,y*S));});L.polyline(ll,{color:'#ff8c00',weight:5,opacity:.85,dashArray:'8 7',lineCap:'round',lineJoin:'round'}).addTo(coveredLayer);}

  function snap(pt,coveredOnly){
    const gx=Math.round(pt.x/S),gy=Math.round(pt.y/S);let best=null;
    const allowed=v=>v!=='0' && (!coveredOnly || v==='2');
    for(let r=0;r<100;r++){
      for(let y=Math.max(0,gy-r);y<=Math.min(H-1,gy+r);y++){
        for(const x of [Math.max(0,gx-r),Math.min(W-1,gx+r)]){
          if(allowed(coveredOnly?coveredGrid[y][x]:G[y][x])){const d=(x-gx)*(x-gx)+(y-gy)*(y-gy);if(!best||d<best.d)best={x,y,d};}
        }
      }
      for(let x=Math.max(0,gx-r+1);x<Math.min(W,gx+r);x++){
        for(const y of [Math.max(0,gy-r),Math.min(H-1,gy+r)]){
          if(allowed(coveredOnly?coveredGrid[y][x]:G[y][x])){const d=(x-gx)*(x-gx)+(y-gy)*(y-gy);if(!best||d<best.d)best={x,y,d};}
        }
      }
      if(best&&best.d<=r*r)return best;
    }
    return best;
  }

  function route(a,b,mode){
    const coveredOnly=mode==='covered';
    const s=snap(a,coveredOnly),t=snap(b,coveredOnly);if(!s||!t)return null;
    const dist=new Float64Array(W*H);dist.fill(Infinity);
    const prev=new Int32Array(W*H);prev.fill(-1);
    const heap=new Heap();const sk=key(s.x,s.y),tk=key(t.x,t.y);dist[sk]=0;heap.push([0,sk]);
    const dirs=[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    while(heap.a.length){
      const [d,k]=heap.pop();if(d!==dist[k])continue;if(k===tk)break;
      const x=k%W,y=(k/W)|0;
      for(const [dx,dy] of dirs){
        const nx=x+dx,ny=y+dy;if(nx<0||nx>=W||ny<0||ny>=H)continue;
        const typ=G[ny][nx];if(typ==='0'||(coveredOnly&&coveredGrid[ny][nx]!=='2'))continue;
        const step=Math.hypot(dx,dy)*S;let mult=1;
        if(mode==='weather')mult=typ==='2'?(window.__rain?0.65:1.08):(window.__rain?1.35:0.92);
        const nd=d+step*mult,nk=key(nx,ny);
        if(nd<dist[nk]){dist[nk]=nd;prev[nk]=k;heap.push([nd,nk]);}
      }
    }
    if(!isFinite(dist[tk]))return null;
    const cells=[];let k=tk;while(k!==-1){cells.push(k);if(k===sk)break;k=prev[k];}cells.reverse();
    let meters=0,covered=0;
    for(let i=1;i<cells.length;i++){
      const [x1,y1]=parseKey(cells[i-1]),[x2,y2]=parseKey(cells[i]);
      const seg=Math.hypot(x2-x1,y2-y1)*S*1.65;meters+=seg;if((coveredOnly?coveredGrid[y2][x2]:G[y2][x2])==='2')covered+=seg;
    }
    return {cells,meters,covered,coveredPct:meters?covered/meters*100:0};
  }

  function drawRoute(res,color='#1769e0',weight=8,dash=null){
    if(!res)return;
    const latlngs=res.cells.map(k=>{const [x,y]=parseKey(k);return pixelToLatLng(x*S,y*S)});
    L.polyline(latlngs,{color,weight,opacity:.95,lineCap:'round',lineJoin:'round',dashArray:dash||undefined}).addTo(routeLayer);
  }

  function planPair(){
    routeLayer.clearLayers();
    const ai=+startEl.value,bi=+endEl.value;
    if(ai===bi){recommendation.textContent='Choose two different locations.';recommendationDetail.textContent='';routeMetrics.textContent='—';return;}
    const mode=modeEl.value,a=locations[ai],b=locations[bi];
    const res=route(a,b,mode);
    if(!res){recommendation.textContent='No route in this category';recommendationDetail.textContent=mode==='covered'?'The selected points are not connected by the covered raster network.':'Try another pair of locations.';routeMetrics.textContent='—';return;}
    drawRoute(res);
    recommendation.textContent=mode==='covered'?'Covered-only route':'Route calculated';
    recommendationDetail.textContent=mode==='covered'?'Open roads are excluded. The route uses covered cells only.':'The route uses the selected network and current weather weighting.';
    routeMetrics.innerHTML=`Distance: <b>${res.meters.toFixed(0)} m</b> • Covered: <b>${res.coveredPct.toFixed(0)}%</b>`;
  }

  function planAllCovered(){
    routeLayer.clearLayers();
    const order=['D-Spine','A wing','B dome','C wing'];
    let total=0,covered=0,legs=[];
    for(let i=0;i<order.length-1;i++){
      const a=locations.find(p=>p.name===order[i]),b=locations.find(p=>p.name===order[i+1]);
      const res=route(a,b,'covered');
      if(!res){recommendation.textContent=`Covered route unavailable: ${order[i]} → ${order[i+1]}`;recommendationDetail.textContent='One of the requested legs does not connect on the supplied covered network.';routeMetrics.textContent='—';return;}
      drawRoute(res,'#1769e0',9);total+=res.meters;covered+=res.covered;legs.push(`${order[i]} → ${order[i+1]}: ${res.meters.toFixed(0)} m`);
    }
    recommendation.textContent='Full covered route: D-Spine → A Wing → B Dome → C Wing';
    recommendationDetail.textContent='All three legs are calculated in Covered-only mode.';
    routeMetrics.innerHTML=`Total: <b>${total.toFixed(0)} m</b> • Covered: <b>${(covered/total*100).toFixed(0)}%</b><br>${legs.join('<br>')}`;
    startEl.value=String(idx.dIndex);endEl.value=String(idx.cIndex);modeEl.value='covered';
  }

  let weather={rain:false};
  window.__rain=false;
  function weatherText(code){if(code===0)return'Clear';if(code<=3)return'Cloudy';if(code<=48)return'Foggy';if(code<=67)return'Rain';if(code<=77)return'Snow/Hail';if(code<=82)return'Showers';if(code<=99)return'Thunderstorm';return'Unknown'}
  async function fetchWeather(){
    weatherValue.textContent='Loading…';
    try{
      const u='https://api.open-meteo.com/v1/forecast?latitude=15.3914&longitude=73.8796&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m&hourly=precipitation_probability&forecast_days=1&timezone=Asia%2FKolkata';
      const r=await fetch(u);if(!r.ok)throw new Error('weather request failed');const d=await r.json(),c=d.current,h=d.hourly;
      const ix=Math.max(0,h.time.findIndex(t=>t>=c.time)),prob=ix>=0?h.precipitation_probability[ix]:0;
      weather={rain:(c.rain>0||c.precipitation>0||prob>=45||c.weather_code>=51),prob};window.__rain=weather.rain;
      weatherValue.textContent=`${Math.round(c.temperature_2m)}°C • ${weatherText(c.weather_code)}`;
      weatherDetail.textContent=`Feels ${Math.round(c.apparent_temperature)}°C • Rain ${c.rain} mm • Probability ${prob}% • Wind ${Math.round(c.wind_speed_10m)} km/h`;
      if(modeEl.value==='weather')planPair();
    }catch(e){weatherValue.textContent='Weather unavailable';weatherDetail.textContent='Covered-only routing does not require weather.';window.__rain=false;}
  }

  document.getElementById('planBtn').addEventListener('click',planPair);
  document.getElementById('allCoveredBtn').addEventListener('click',planAllCovered);
  document.getElementById('clearBtn').addEventListener('click',()=>{routeLayer.clearLayers();recommendation.textContent='Choose two locations.';recommendationDetail.textContent='';routeMetrics.textContent='—';});
  document.getElementById('weatherBtn').addEventListener('click',fetchWeather);
  startEl.addEventListener('change',planPair);endEl.addEventListener('change',planPair);modeEl.addEventListener('change',planPair);
  fetchWeather();
  map.whenReady(()=>setTimeout(()=>map.invalidateSize(),100));
})();
