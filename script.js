(function(){
  const DATA=window.MAP_DATA, GRID=window.ROAD_GRID;
  const S=GRID.cellSize,W=GRID.width,H=GRID.height,G=GRID.grid;
  const startEl=document.getElementById('start'),endEl=document.getElementById('end'),canvas=document.getElementById('overlay'),wrap=document.getElementById('mapWrap');
  const ctx=canvas.getContext('2d');
  const weatherValue=document.getElementById('weatherValue'),weatherDetail=document.getElementById('weatherDetail'),recommendation=document.getElementById('recommendation'),recommendationDetail=document.getElementById('recommendationDetail'),routeMetrics=document.getElementById('routeMetrics');
  const locations=DATA.locations;
  locations.forEach((p,i)=>{const a=document.createElement('option');a.value=i;a.textContent=p.name;startEl.appendChild(a);const b=a.cloneNode(true);endEl.appendChild(b)});
  startEl.value='8'; endEl.value='0';
  function resize(){canvas.width=1920;canvas.height=1080;drawBase();}
  function drawBase(){ctx.clearRect(0,0,canvas.width,canvas.height);}
  window.addEventListener('resize',resize); resize();
  function key(x,y){return y*W+x}
  function parseKey(k){return [k%W,Math.floor(k/W)]}
  class Heap{constructor(){this.a=[]}push(item){let a=this.a;a.push(item);let i=a.length-1;while(i){let p=(i-1)>>1;if(a[p][0]<=item[0])break;a[i]=a[p];i=p}a[i]=item}pop(){let a=this.a;if(!a.length)return null;const top=a[0],last=a.pop();if(a.length){let i=0;while(true){let l=i*2+1;if(l>=a.length)break;let r=l+1,c=r<a.length&&a[r][0]<a[l][0]?r:l;if(a[c][0]>=last[0])break;a[i]=a[c];i=c}a[i]=last}return top}}
  function snap(pt){
    const gx=Math.round(pt.x/S), gy=Math.round(pt.y/S);
    let best=null;
    for(let r=0;r<80;r++){
      for(let y=Math.max(0,gy-r);y<=Math.min(H-1,gy+r);y++){
        for(const x of [Math.max(0,gx-r),Math.min(W-1,gx+r)]){
          if(G[y][x]!=="0"){const d=(x-gx)*(x-gx)+(y-gy)*(y-gy);if(!best||d<best.d)best={x,y,d};}
        }
      }
      for(let x=Math.max(0,gx-r+1);x<Math.min(W,gx+r);x++){
        for(const y of [Math.max(0,gy-r),Math.min(H-1,gy+r)]){
          if(G[y][x]!=="0"){const d=(x-gx)*(x-gx)+(y-gy)*(y-gy);if(!best||d<best.d)best={x,y,d};}
        }
      }
      if(best && best.d <= r*r) return best;
    }
    return best;
  }
  function route(a,b,mode){
    const s=snap(a),t=snap(b); if(!s||!t)return null;
    const dist=new Float64Array(W*H);dist.fill(Infinity);const prev=new Int32Array(W*H);prev.fill(-1);const heap=new Heap();const sk=key(s.x,s.y),tk=key(t.x,t.y);dist[sk]=0;heap.push([0,sk]);
    const dirs=[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    while(heap.a.length){const [d,k]=heap.pop();if(d!==dist[k])continue;if(k===tk)break;const x=k%W,y=(k/W)|0;for(const [dx,dy] of dirs){const nx=x+dx,ny=y+dy;if(nx<0||nx>=W||ny<0||ny>=H)continue;const typ=G[ny][nx];if(typ==='0')continue;const step=Math.hypot(dx,dy)*S;let mult=1;if(mode==='rain')mult=typ==='2'?0.65:1.35;else if(mode==='dry')mult=typ==='2'?1.08:0.92;else mult=typ==='2'?0.95:1.0;const nd=d+step*mult,nk=key(nx,ny);if(nd<dist[nk]){dist[nk]=nd;prev[nk]=k;heap.push([nd,nk])}}}
    if(!isFinite(dist[tk]))return null;const cells=[];let k=tk;while(k!==-1){cells.push(k);if(k===sk)break;k=prev[k]}cells.reverse();
    let meters=0,covered=0;for(let i=1;i<cells.length;i++){const [x1,y1]=parseKey(cells[i-1]),[x2,y2]=parseKey(cells[i]);meters+=Math.hypot(x2-x1,y2-y1)*S*1.65;if(G[y2][x2]==='2')covered+=Math.hypot(x2-x1,y2-y1)*S*1.65}
    return {cells,meters,covered,coveredPct:meters?covered/meters*100:0,snapStart:s,snapEnd:t};
  }
  function drawRoute(res,style){if(!res)return;ctx.save();ctx.lineJoin='round';ctx.lineCap='round';ctx.beginPath();res.cells.forEach((k,i)=>{const [x,y]=parseKey(k);if(i===0)ctx.moveTo(x*S,y*S);else ctx.lineTo(x*S,y*S)});ctx.setLineDash(style.dash||[]);ctx.strokeStyle=style.color;ctx.lineWidth=style.width;ctx.stroke();ctx.restore()}
  function drawLocations(a,b){locations.forEach((p,i)=>{ctx.beginPath();ctx.arc(p.x,p.y, i===a||i===b?9:5,0,Math.PI*2);ctx.fillStyle=i===a?'#1769e0':i===b?'#e53935':'#ffffff';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#1d2733';ctx.stroke();if(i===a||i===b){ctx.font='bold 13px system-ui';ctx.fillStyle='#17202a';ctx.fillText(p.name,p.x+11,p.y-9)}})}
  let weather={rain:false,prob:0,temp:null,desc:'Weather unavailable'};
  function weatherText(code){if(code===0)return'Clear';if(code<=3)return'Cloudy';if(code<=48)return'Foggy';if(code<=67)return'Rain';if(code<=77)return'Snow/Hail';if(code<=82)return'Showers';if(code<=99)return'Thunderstorm';return'Unknown'}
  async function fetchWeather(){weatherValue.textContent='Loading…';try{const u='https://api.open-meteo.com/v1/forecast?latitude=15.3914&longitude=73.8796&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m&hourly=precipitation_probability&forecast_days=1&timezone=Asia%2FKolkata';const r=await fetch(u);if(!r.ok)throw new Error('weather request failed');const d=await r.json();const c=d.current;const h=d.hourly;const idx=Math.max(0,h.time.findIndex(t=>t>=c.time));const prob=idx>=0?h.precipitation_probability[idx]:0;weather={rain:(c.rain>0||c.precipitation>0||prob>=45||c.weather_code>=51),prob:prob||0,temp:c.temperature_2m,desc:weatherText(c.weather_code)};weatherValue.textContent=`${Math.round(c.temperature_2m)}°C • ${weather.desc}`;weatherDetail.textContent=`Feels ${Math.round(c.apparent_temperature)}°C • Rain now ${c.rain} mm • Probability ${weather.prob}% • Wind ${Math.round(c.wind_speed_10m)} km/h`;plan();}catch(e){weatherValue.textContent='Weather unavailable';weatherDetail.textContent='Routing still works; weather weighting defaults to balanced.';weather={rain:false,prob:0,temp:null,desc:'Unavailable'};plan();}}
  function plan(){const ai=+startEl.value,bi=+endEl.value;if(ai===bi){recommendation.textContent='Choose two different locations.';routeMetrics.textContent='—';ctx.clearRect(0,0,canvas.width,canvas.height);drawLocations(ai,bi);return}const a=locations[ai],b=locations[bi];const mode=weather.rain?'rain':'dry';const primary=route(a,b,mode),alt=route(a,b,mode==='rain'?'dry':'rain');ctx.clearRect(0,0,canvas.width,canvas.height);if(alt)drawRoute(alt,{color:'#f08c00',width:4,dash:[12,10]});if(primary)drawRoute(primary,{color:'#1769e0',width:7});drawLocations(ai,bi);if(!primary){recommendation.textContent='No connected route found';recommendationDetail.textContent='Try another pair of locations.';routeMetrics.textContent='—';return}const why=weather.rain?'Rain risk is present, so covered paths are favored.':'Current conditions are relatively dry, so open roads can be favored for a shorter route.';recommendation.textContent=weather.rain?'Covered-first route selected':'Open-first route selected';recommendationDetail.textContent=why;routeMetrics.innerHTML=`Primary: <b>${primary.meters.toFixed(0)} m</b> • ${primary.coveredPct.toFixed(0)}% covered<br>Alternative: ${alt?alt.meters.toFixed(0)+' m • '+alt.coveredPct.toFixed(0)+'% covered':'not available'}`}
  document.getElementById('planBtn').addEventListener('click',plan);document.getElementById('clearBtn').addEventListener('click',()=>{ctx.clearRect(0,0,canvas.width,canvas.height);recommendation.textContent='Choose two locations.';recommendationDetail.textContent='';routeMetrics.textContent='—'});document.getElementById('weatherBtn').addEventListener('click',fetchWeather);startEl.addEventListener('change',plan);endEl.addEventListener('change',plan);
  plan();
})();
