import React,{useState,useEffect,useRef,useCallback} from 'react';
import CarVisual,{Wheel} from './CarVisual.jsx';
import * as C from './catalog.js';
import {getCars} from './services/carService.js';
import {getOptions} from './services/optionService.js';
import * as authService from './services/authService.js';
import {createConfiguration,updateConfiguration,deleteConfiguration,getConfigurations,getSharedBuild} from './services/configurationService.js';
const {inr,short,byId}=C;

function useCount(v){const [x,setX]=useState(v),r=useRef(v);
useEffect(()=>{if(matchMedia('(prefers-reduced-motion: reduce)').matches){setX(v);r.current=v;return}
const a=r.current,t0=performance.now();let f;const s=t=>{const p=Math.min(1,(t-t0)/350),n=a+(v-a)*p;setX(n);r.current=n;if(p<1)f=requestAnimationFrame(s)};f=requestAnimationFrame(s);return()=>cancelAnimationFrame(f)},[v]);return x}
const Num=({v,d=0,money})=>{const x=useCount(v);return <>{money?inr(x):d?x.toFixed(d):Math.round(x).toLocaleString('en-IN')}</>};

function Modal({title,children,onClose}){const ref=useRef();
useEffect(()=>{const k=e=>e.key==='Escape'&&onClose();document.addEventListener('keydown',k);ref.current?.querySelector('input,button')?.focus();return()=>document.removeEventListener('keydown',k)},[]);
return <div className="backdrop" onMouseDown={onClose}><div className="modal" ref={ref} role="dialog" aria-modal="true" aria-label={title} onMouseDown={e=>e.stopPropagation()}><h2>{title}</h2>{children}</div></div>}

const Dot=({on,onClick,label,children})=><button className={'dot'+(on?' on':'')} aria-pressed={on} onClick={onClick}><span className="disc">{children}</span><em>{label}</em></button>;
const Pills=({items,value,onChange})=><div className="pills" role="group">{items.map(i=><button key={i.id} className={value===i.id?'on':''} aria-pressed={value===i.id} onClick={()=>onChange(i.id)}>{i.name}</button>)}</div>;
const Grp=({t,children})=><div className="grp"><h3>{t}</h3>{children}</div>;
const Mini=({type,cal})=><svg viewBox="-54 -54 108 108"><Wheel cx={0} cy={0} type={type} cal={cal}/></svg>;
const Spec=({v,u,l,d})=><div className="spec"><b><Num v={v} d={d}/></b><span>{u}</span><em>{l}</em></div>;
const State=({t,full,children})=><div className={'state'+(full?' full':'')} role="status"><p className="lbl">{t}</p>{children}</div>;
const carOf=(cars,b)=>({...(cars.find(c=>c.id===b.car.id)||{}),...b.car});

const rowsOf=(o,s,lights)=>{const n=(l,id)=>byId(l,id)?.name||'—';
return[['Paint',n(o.paints,s.paint_id)],['Wheels',n(o.wheels,s.wheel_id)],['Calipers',n(o.calipers,s.caliper_id)],...(lights?[['Lights',C.LIGHTS.find(l=>l.id===lights)?.name]]:[]),
['Interior',`${n(o.interior_colors,s.interior_color_id)} ${n(o.interior_materials,s.interior_material_id)}`],['Seats',n(o.seat_types,s.seat_type_id)],
['Engine',n(o.engines,s.engine_id)],['Package',n(o.performance_packages,s.performance_package_id)],['Aero',n(o.aero_packages,s.aero_package_id)]]};

function BuildDrawer({label,title,rows,b,onClose,action}){return <div className="backdrop side" onMouseDown={onClose}><aside className="drawer" role="dialog" aria-label="Your build" onMouseDown={e=>e.stopPropagation()}>
<button className="circ x" aria-label="Close" onClick={onClose}>×</button><p className="lbl">{label}</p><h2>{title}</h2>
<dl>{rows.map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
<div className="sum"><div><span>Base</span><span>{inr(b.base)}</span></div>{b.lines.map(l=><div key={l.label}><span>{l.label}</span><span>+ {inr(l.price)}</span></div>)}<div className="t"><span>Total</span><b>{inr(b.price)}</b></div></div>
{action}</aside></div>}

const TABS=['exterior','interior','performance','aero'];
const routeFromHash=()=>{const value=location.hash.slice(1);if(!value)return'/';try{return decodeURIComponent(value).replace(/\/+$/,'')||'/'}catch{return'/'}};
function Configurator({car,opts,sel,setSel,lights,setLights,b,look,editing,openSave,openReset,go}){
const [tab,setTab]=useState('exterior'),[drawer,setDrawer]=useState(false);
const co=C.optionsForCar(opts,car.id),set=(k,v)=>setSel(s=>({...s,[k]:v}));
const pk=byId(co.performance_packages,sel.performance_package_id)||{},aero=byId(co.aero_packages,sel.aero_package_id)||{};
const flat=!(pk.horsepower_modifier||pk.handling_modifier||pk.braking_modifier);
const content={
exterior:<><Grp t="Colours"><div className="row">{co.paints.map(p=><Dot key={p.id} on={sel.paint_id===p.id} label={p.name} onClick={()=>set('paint_id',p.id)}><i style={{background:p.hex_code}}/></Dot>)}</div></Grp>
<Grp t="Wheels"><div className="row">{co.wheels.map(w=><Dot key={w.id} on={sel.wheel_id===w.id} label={w.name} onClick={()=>set('wheel_id',w.id)}><Mini type={C.wheelStyle(w,co.wheels)} cal={look.cal}/></Dot>)}</div></Grp>
<Grp t="Calipers"><div className="row">{co.calipers.map(c=><Dot key={c.id} on={sel.caliper_id===c.id} label={c.name} onClick={()=>set('caliper_id',c.id)}><i style={{background:c.hex_code}}/></Dot>)}</div></Grp>
<Grp t="Lights"><div className="row">{C.LIGHTS.map(l=><Dot key={l.id} on={lights===l.id} label={l.name} onClick={()=>setLights(l.id)}><i className="lamp" style={{'--l':l.color}}/></Dot>)}</div></Grp></>,
interior:<><Grp t="Material"><Pills items={co.interior_materials} value={sel.interior_material_id} onChange={v=>set('interior_material_id',v)}/></Grp>
<Grp t="Colour"><div className="row">{co.interior_colors.map(c=><Dot key={c.id} on={sel.interior_color_id===c.id} label={c.name} onClick={()=>set('interior_color_id',c.id)}><i style={{background:c.hex_code}}/></Dot>)}</div></Grp>
<Grp t="Seats"><Pills items={co.seat_types} value={sel.seat_type_id} onChange={v=>set('seat_type_id',v)}/></Grp></>,
performance:<><Grp t="Engine"><Pills items={co.engines} value={sel.engine_id} onChange={v=>set('engine_id',v)}/>
<h3 className="sp">Package</h3><Pills items={co.performance_packages} value={sel.performance_package_id} onChange={v=>set('performance_package_id',v)}/>
<p className="note">{flat?'Factory baseline.':`Package adds +${pk.horsepower_modifier||0} hp, +${pk.handling_modifier||0} handling, +${pk.braking_modifier||0} braking.`}</p></Grp>
<div className="specs"><Spec v={b.horsepower} u="HP" l="Power"/><Spec v={b.topSpeed} u="KM/H" l="Top speed"/><Spec v={b.zeroToHundred} u="SEC" l="0–100" d={1}/>
<div className="mini"><p>Handling <b>{b.handling}</b></p><p>Braking <b>{b.braking}</b></p></div></div></>,
aero:<><Grp t="Aero package"><Pills items={co.aero_packages} value={sel.aero_package_id} onChange={v=>set('aero_package_id',v)}/><p className="note">{aero.description}</p>
<div className="chips">{['splitter','skirts','wing','diffuser'].map(p=><span key={p} className={look.parts.includes(p)?'on':''}>{p}</span>)}</div></Grp>
<div className="specs"><Spec v={b.downforce} u="PTS" l="Downforce"/><Spec v={b.drag} u="PTS" l="Drag"/><Spec v={b.topSpeed} u="KM/H" l="Top speed"/><div className="mini"><p>Handling <b>{b.handling}</b></p></div></div></>};
return <main className="show"><div className="title"><button className="circ" aria-label="Back to models" onClick={()=>go('/models')}>←</button><div><h1>{car.name}</h1><p>{b.horsepower} HP · {b.topSpeed} KM/H · {b.zeroToHundred.toFixed(1)} SEC</p></div></div>
<div className="total"><span>TOTAL</span><b><Num v={b.price} money/></b><span className={'est'+(b.source==='backend'?' ok':'')}>{b.source==='backend'?'CONFIRMED BY SERVER':'ESTIMATE · SAVE FOR FINAL'}</span><button className="link" onClick={()=>setDrawer(true)}>Your build ›</button></div>
<div className="bigcar"><CarVisual car={car} look={look} onHot={t=>setTab(t)}/></div>
<div className="tray" role="region" aria-label="Configuration"><div className="tabs" role="tablist">{TABS.map(t=><button key={t} role="tab" aria-selected={tab===t} className={tab===t?'on':''} onClick={()=>setTab(t)}>{t}</button>)}
<button className="link rst" onClick={openReset}>Reset</button></div><div className="tbody" key={tab}>{content[tab]}</div></div>
{drawer&&<BuildDrawer label={`YOUR BUILD${editing?' · EDITING':''}`} title={car.name} rows={rowsOf(opts,sel,lights)} b={b} onClose={()=>setDrawer(false)} action={<button className="btn dark" onClick={()=>{setDrawer(false);openSave()}}>SAVE BUILD</button>}/>}</main>}

function Landing({cars,opts,onConfigure,go,user}){const featured=cars.find(car=>car.slug==='apex-f1gt')||cars[0],featuredIndex=cars.indexOf(featured),defaults=C.defaultSelection(featured.id,opts),selection={...defaults,paint_id:C.pickPaint(opts,/red/i)?.id||defaults.paint_id},look=C.makeLook(opts,selection);
return <main className="landing"><section className="landing-hero"><div className="landing-copy"><p className="landing-eyebrow"><i/> ENGINEERED TO MOVE YOU</p><h1>VELOCITY</h1><p className="landing-lede">{featured.description}</p>
<div className="landing-actions"><button className="launch" onClick={()=>go('/models')}>EXPLORE FLEET <span>↗</span></button><button className="launch secondary" onClick={()=>onConfigure(featured.id)}>LAUNCH CONFIGURATOR <span>→</span></button></div>
<button className="garage-quick" onClick={()=>go('/garage')}><span className="garage-mark">⌂</span><span><b>{user?'OPEN YOUR GARAGE':'YOUR GARAGE'}</b><small>{user?'Your saved builds, ready when you are':'Sign in to keep your builds close'}</small></span><span className="garage-arrow">↗</span></button></div>
<div className="landing-visual"><div className="visual-index"><span>FEATURED MACHINE</span><b>{String(featuredIndex+1).padStart(2,'0')} <i>/ {String(cars.length).padStart(2,'0')}</i></b></div><div className="landing-hero-car"><CarVisual car={featured} look={look} compact/></div><div className="hero-specbar"><span><b>{featured.horsepower}</b><small>HP</small></span><span><b>{featured.acceleration.toFixed(1)}</b><small>0–100 SEC</small></span><span><b>{featured.top_speed}</b><small>KM/H</small></span><button onClick={()=>onConfigure(featured.id)} aria-label={`Configure ${featured.name}`}>↗</button></div><p className="hero-car-name">{featured.name}</p></div>
<div className="landing-scroll"><span/> SCROLL TO EXPLORE</div></section>
<section className="landing-fleet"><div className="fleet-heading"><div><p className="landing-eyebrow"><i/> THE COLLECTION</p><h2>Choose your kind of fast.</h2></div><button className="fleet-link" onClick={()=>go('/models')}>VIEW THE FLEET <span>↗</span></button></div>
<div className="fleet-grid">{cars.slice(0,3).map((car,index)=>{const pick=C.defaultSelection(car.id,opts),carLook=C.makeLook(opts,pick);return <button className="fleet-card" key={car.id} onClick={()=>onConfigure(car.id)}><div className="fleet-art"><span className="fleet-count">0{index+1}</span><CarVisual car={car} look={carLook} compact/><span className="fleet-open">↗</span></div><div className="fleet-card-foot"><div><p>{car.slug.replaceAll('-',' ').toUpperCase()}</p><h3>{car.name}</h3></div><div className="fleet-stats"><span><b>{car.horsepower}</b> HP</span><span><b>{car.acceleration.toFixed(1)}</b> SEC</span><span><b>{car.top_speed}</b> KM/H</span></div></div></button>})}</div></section></main>}

function Models({cars,opts,sel,look,selectCar,go}){const n=cars.length,i=Math.max(0,cars.findIndex(c=>c.id===sel.car_id)),car=cars[i],h=Math.floor(n/2),pick=k=>selectCar(cars[(k+n)%n].id);
return <main className="models"><div className="lane">{cars.map((c,k)=>{const o=((k-i+n+h)%n)-h,far=Math.abs(o)>1;
return <button key={c.id} className={'slot'+(o?'':' mid')} style={{transform:`translateX(${o*58}%) scale(${o?.52:1})`,opacity:far?0:o?.5:1,pointerEvents:far?'none':'auto'}} aria-label={c.name} onClick={()=>o?pick(k):go('/configure')} tabIndex={o&&!far?0:-1}>
<CarVisual car={c} look={look} compact/></button>})}</div>
<div className="mname"><button className="circ" aria-label="Previous model" onClick={()=>pick(i-1)}>‹</button><div><p className="lbl">CHOOSE YOUR MACHINE</p><h1>{car.name}</h1>
<div className="stats3"><span><b>{car.horsepower}</b>HP</span><span><b>{car.top_speed}</b>KM/H</span><span><b>{car.acceleration}</b>SEC</span></div></div><button className="circ" aria-label="Next model" onClick={()=>pick(i+1)}>›</button></div>
<div className="mname"><button className="btn dark" onClick={()=>go('/configure')}>CONFIGURE · FROM {short(car.base_price)}</button></div></main>}

function Empty({t,m,a,f}){return <main className="empty"><h1>{t}</h1><p>{m}</p><button className="btn dark" onClick={f}>{a}</button></main>}

function Garage({user,authReady,cars,opts,go,onEdit,onDuplicate,onDeleted,fail,toast,authMode,setAuthMode,onAuth,car,look}){const [list,setList]=useState(null),[err,setErr]=useState(''),[n,setN]=useState(0),[del,setDel]=useState(null),[busy,setBusy]=useState(false),[copying,setCopying]=useState(false);
const remove=async()=>{setBusy(true);try{await deleteConfiguration(del.id);onDeleted(del.id);setDel(null);setN(x=>x+1);toast('Build deleted')}catch(x){fail(x)}finally{setBusy(false)}};
const duplicate=async build=>{setCopying(true);try{await onDuplicate(build);setN(x=>x+1);toast('Build duplicated')}catch(x){fail(x)}finally{setCopying(false)}};
useEffect(()=>{if(!user)return;let live=true;setList(null);setErr('');getConfigurations().then(r=>live&&setList(r)).catch(e=>{if(!live)return;if(e.status===401)fail(e);else setErr(e.message)});return()=>{live=false}},[user,n]);
if(!authReady)return <State full t="CHECKING YOUR SESSION"/>;
if(!user)return <main className="garage garage-gate"><Auth mode={authMode} onModeChange={setAuthMode} onAuth={onAuth} car={car} look={look} embedded/></main>;
if(err)return <Empty t="Couldn't load your garage" m={err} a="TRY AGAIN" f={()=>setN(x=>x+1)}/>;
if(!list)return <State full t="LOADING YOUR GARAGE"/>;
if(!list.length)return <Empty t="Your garage is empty" m="Build your first machine." a="START CONFIGURATION" f={()=>go('/configure')}/>;
return <main className="garage"><h1>MY GARAGE</h1>{list.map(b=>{const car=carOf(cars,b);return <article key={b.id}><div className="bigcar"><CarVisual car={car} look={C.makeLook(opts,C.selectionFromBuild(b))} compact/></div>
<div className="gi"><h2>{b.name}</h2><p>{car.name} · {b.build_id}</p><p>{b.performance.engine.name} · {b.performance.aero.name} aero</p><b>{short(b.pricing.final_price)}</b>
<div className="acts"><button onClick={()=>go('/build/'+b.build_id)}>VIEW</button><button onClick={()=>onEdit(b)}>EDIT</button><button disabled={copying} onClick={()=>duplicate(b)}>{copying?'COPYING…':'DUPLICATE'}</button><button className="dng" onClick={()=>setDel(b)}>DELETE</button></div></div></article>})}
{del&&<Modal title="DELETE BUILD?" onClose={()=>setDel(null)}><p>This machine will be permanently removed from your garage.</p><div className="acts r"><button onClick={()=>setDel(null)}>CANCEL</button><button className="dng" disabled={busy} onClick={remove}>{busy?'DELETING…':'DELETE'}</button></div></Modal>}</main>}

function Shared({id,cars,opts,go,onCopy}){const [b,setB]=useState(null),[err,setErr]=useState(null),[drawer,setDrawer]=useState(false);
useEffect(()=>{let live=true;setB(null);setErr(null);getSharedBuild(id).then(r=>live&&setB(r)).catch(e=>live&&setErr(e));return()=>{live=false}},[id]);
if(err)return err.status===404?<Empty t="Build not found" m="The configuration you're looking for doesn't exist or has been removed." a="RETURN TO GARAGE" f={()=>go('/garage')}/>:<Empty t="Couldn't load this build" m={err.message} a="GO HOME" f={()=>go('/')}/>;
if(!b)return <State full t="LOADING BUILD"/>;
const car=carOf(cars,b),s=C.selectionFromBuild(b),k=C.backendBuild(b,opts),look=C.makeLook(opts,s);
return <main className="show shared"><div className="title"><div><h1>{b.name}</h1><p>{car.name} · {b.build_id}</p></div></div>
<div className="total"><span>TOTAL</span><b>{inr(k.price)}</b><button className="link" onClick={()=>setDrawer(true)}>Build details ›</button></div><div className="bigcar"><CarVisual car={car} look={look}/></div>
<div className="specs fl"><Spec v={k.horsepower} u="HP" l="Power"/><Spec v={k.topSpeed} u="KM/H" l="Top speed"/><Spec v={k.zeroToHundred} u="SEC" l="0–100" d={1}/>
<button className="btn dark" onClick={()=>onCopy(b)}>CONFIGURE A COPY</button></div>
{drawer&&<BuildDrawer label={`SHARED BUILD · ${b.build_id}`} title={car.name} rows={rowsOf(opts,s)} b={k} onClose={()=>setDrawer(false)}/>}</main>}

function Auth({mode,onAuth,car,look,embedded=false,onModeChange}){const [f,setF]=useState({name:'',email:'',password:'',confirm:''}),[err,setErr]=useState(''),[busy,setBusy]=useState(false),reg=mode==='register';
const U=k=>({id:k,value:f[k],onChange:e=>setF({...f,[k]:e.target.value})});
const switchMode=next=>{setErr('');setF({name:'',email:'',password:'',confirm:''});onModeChange(next)};
const sub=async e=>{e.preventDefault();setErr('');
if(reg){if(!f.name.trim())return setErr('Enter your name.');if(f.password.length<8)return setErr('Password must be at least 8 characters.');if(f.password!==f.confirm)return setErr('Passwords do not match.')}
setBusy(true);try{if(reg)await authService.register({email:f.email,username:f.name.trim(),password:f.password});
const u=await authService.login({email:f.email,password:f.password});onAuth(u)}catch(x){setErr(x.status===401?'Email or password is incorrect.':x.message);setBusy(false)}};
const form=<form className={embedded?'garage-auth-form':''} onSubmit={sub}><h1>{reg?'Create your account':'Welcome back'}</h1>
{reg&&<><label htmlFor="name">Name</label><input {...U('name')} autoComplete="username"/></>}<label htmlFor="email">Email</label><input type="email" required {...U('email')}/>
<label htmlFor="password">Password</label><input type="password" required {...U('password')}/>{reg&&<><label htmlFor="confirm">Confirm password</label><input type="password" required {...U('confirm')}/></>}
{err&&<p className="err" role="alert">{err}</p>}<button className="btn dark" disabled={busy}>{busy?'PLEASE WAIT…':reg?'CREATE ACCOUNT':'LOGIN'}</button>
<p className="alt">{reg?'Already have an account?':"Don't have an account?"} {embedded?<button type="button" className="auth-switch-link" onClick={()=>switchMode(reg?'login':'register')}>{reg?'Login':'Create account'}</button>:<a href={reg?'#/login':'#/register'}>{reg?'Login':'Create account'}</a>}</p></form>;
if(embedded)return <section className="garage-auth"><p className="lbl">GARAGE ACCESS</p><div className="auth-tabs" role="tablist" aria-label="Garage account access"><button type="button" role="tab" aria-selected={!reg} className={!reg?'on':''} onClick={()=>switchMode('login')}>LOG IN</button><button type="button" role="tab" aria-selected={reg} className={reg?'on':''} onClick={()=>switchMode('register')}>CREATE ACCOUNT</button></div>{form}</section>;
return <main className="auth"><div className="aimg"><CarVisual car={car} look={look} compact/><p className="lbl">VELOCITY</p></div>{form}</main>}

export default function App(){
const [route,setRoute]=useState(routeFromHash),[cat,setCat]=useState({status:'loading'}),[sel,setSel]=useState(null),[lights,setLights]=useState('signature'),
[user,setUser]=useState(null),[authReady,setAuthReady]=useState(false),[server,setServer]=useState(null),[editId,setEditId]=useState(null),
[modal,setModal]=useState(null),[name,setName]=useState(''),[saved,setSaved]=useState(null),[saving,setSaving]=useState(false),[toasts,setToasts]=useState([]),[minBoot,setMinBoot]=useState(true),[dark,setDark]=useState(false);
const [garageAuthMode,setGarageAuthMode]=useState('login'),[authPrompt,setAuthPrompt]=useState(false),authIntent=useRef('garage');
const go=useCallback(p=>{const next=p.startsWith('/')?p:`/${p}`;if(routeFromHash()===next){setRoute(next);scrollTo(0,0);return}location.hash=next},[]);
const toast=useCallback(m=>{const id=Math.random();setToasts(t=>[...t,{id,m}]);setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),3200)},[]);
const loadCatalog=useCallback(()=>{setCat({status:'loading'});Promise.all([getCars(),getOptions()]).then(([cars,opts])=>{
if(!cars.length)throw Error('The backend returned no vehicles.');setCat({status:'ready',cars,opts});setSel(s=>s||C.defaultSelection(cars[0].id,opts))}).catch(e=>setCat({status:'error',error:e.message}))},[]);
const fail=useCallback(x=>{if(x.status===401){authService.logout();setUser(null);toast('Session expired · log in again');go('/login')}else toast(x.message||'Something went wrong')},[toast,go]);
useEffect(()=>{const h=()=>{setRoute(routeFromHash());scrollTo(0,0)};addEventListener('hashchange',h);const t=setTimeout(()=>setMinBoot(false),800);return()=>{removeEventListener('hashchange',h);clearTimeout(t)}},[]);
useEffect(()=>{document.documentElement.dataset.theme=dark?'dark':'light'},[dark]);
useEffect(()=>{loadCatalog()},[loadCatalog]);
useEffect(()=>{if(!authService.hasToken()){setAuthReady(true);return}authService.getCurrentUser().then(setUser).catch(e=>{if(e.status===401||e.status===403)authService.logout()}).finally(()=>setAuthReady(true))},[]);

if(cat.status==='error')return <div className="boot"><b>VELOCITY</b><p className="err" role="alert">{cat.error}</p><button className="btn dark" onClick={loadCatalog}>TRY AGAIN</button></div>;
if(minBoot||cat.status!=='ready'||!authReady||!sel)return <div className="boot"><b>VELOCITY</b><p className="lbl">INITIALIZING CONFIGURATION SYSTEM</p><div className="bar"><span/></div></div>;

const {cars,opts}=cat,car=cars.find(c=>c.id===sel.car_id)||cars[0],look=C.makeLook(opts,sel,lights);
const key=C.selectionKey(sel),b=server&&server.key===key?C.backendBuild(server.build,opts):C.previewBuild(car,opts,sel);
const selectCar=id=>{if(id!==sel.car_id){setSel(s=>C.switchCar(s,id,opts));setServer(null);setEditId(null)}};
const configure=id=>{selectCar(id);go('/configure')};
const openSave=()=>{if(!user){authIntent.current='save';setGarageAuthMode('login');setAuthPrompt(true);return}setSaved(null);setModal('save')};
const doSave=async e=>{e.preventDefault();setSaving(true);
try{const pl=C.savePayload(sel,name.trim()||'Untitled Build'),r=editId?await updateConfiguration(editId,pl):await createConfiguration(pl);setSaved(r);setServer({key,build:r});setEditId(r.id);toast(editId?'Build updated':'Build saved')}catch(x){fail(x)}finally{setSaving(false)}};
const share=async id=>{try{if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');await navigator.clipboard.writeText(location.origin+location.pathname+'#/build/'+id);toast('Build link copied')}catch{toast('Could not copy build link')}};
const onAuth=u=>{setUser(u);toast('Welcome, '+u.username);if(authIntent.current==='save'){authIntent.current='garage';setAuthPrompt(false);setSaved(null);setModal('save');return}setAuthPrompt(false);go('/garage')};
const load=(bd,msg)=>{const s=C.selectionFromBuild(bd);setSel(s);setServer({key:C.selectionKey(s),build:bd});setName(bd.name);setEditId(bd.id);toast(msg);go('/configure')};
const duplicateBuild=bd=>createConfiguration(C.savePayload(C.selectionFromBuild(bd),`Copy of ${bd.name}`.slice(0,100)));
const logout=()=>{authService.logout();setUser(null);setServer(null);setEditId(null);toast('Logged out');go('/')};
const parts=route.split('/').filter(Boolean),routeSegment=parts[0]||'',page=({catalog:'models',configurator:'configure',shared:'build'}[routeSegment]||routeSegment),buildId=(routeSegment==='shared'||routeSegment==='build')?parts[1]:undefined,feat=cars[0],authLook=C.makeLook(opts,{...C.defaultSelection(feat.id,opts),paint_id:C.pickPaint(opts,/blue/i).id});
const activeNav=page==='models'?'/models':page==='configure'?'/configure':page==='garage'?'/garage':null;
const nav=[['/models','MODELS'],['/configure','CONFIGURATOR'],['/garage','GARAGE']];
return <div className={'app'+(page===''?' landing-app':'')}><header><a className="logo" href="#/">VELOCITY</a><nav aria-label="Main">{nav.map(([p,l])=><a key={p} href={'#'+p} className={activeNav===p?'on':''}>{l}</a>)}</nav>
<div className="icons"><button className="circ" aria-label="Toggle appearance" onClick={()=>setDark(!dark)}>◐</button><button className="circ" aria-label="Garage" onClick={()=>go('/garage')}>⌂</button>
{user?<button className="circ" aria-label={`Logout ${user.username}`} title={`Logout ${user.username}`} onClick={logout}>⏻</button>:<button className="circ" aria-label="Login" onClick={()=>go('/login')}>☺</button>}</div></header>
{page===''&&<Landing cars={cars} opts={opts} onConfigure={configure} go={go} user={user}/>}{page==='models'&&<Models cars={cars} opts={opts} sel={sel} look={look} selectCar={selectCar} go={go}/>}
{page==='configure'&&<Configurator car={car} opts={opts} sel={sel} setSel={setSel} lights={lights} setLights={setLights} b={b} look={look} editing={!!editId} openSave={openSave} openReset={()=>setModal('reset')} go={go}/>}
{page==='garage'&&<Garage key={user?.id} user={user} authReady={authReady} cars={cars} opts={opts} go={go} onEdit={bd=>load(bd,'Build loaded')} onDuplicate={duplicateBuild} onDeleted={id=>{if(editId===id){setEditId(null);setServer(null)}}} fail={fail} toast={toast} authMode={garageAuthMode} setAuthMode={setGarageAuthMode} onAuth={onAuth} car={feat} look={authLook}/>}
{page==='login'&&<Auth mode="login" onAuth={onAuth} car={feat} look={authLook}/>}{page==='register'&&<Auth mode="register" onAuth={onAuth} car={feat} look={authLook}/>}
{page==='build'&&<Shared id={buildId} cars={cars} opts={opts} go={go} onCopy={bd=>load(bd,'Build loaded')}/>}
{!['','models','configure','garage','login','register','build'].includes(page)&&<Empty t="Page not found" m="That route doesn't exist." a="GO HOME" f={()=>go('/')}/>}
{modal==='save'&&<Modal title={saved?'BUILD SAVED':editId?'UPDATE YOUR MACHINE':'SAVE YOUR MACHINE'} onClose={()=>setModal(null)}>{saved?<><p className="bid">{saved.build_id}</p><p>{saved.car.name} · {short(saved.pricing.final_price)} · {saved.performance.stats.horsepower} HP</p>
<div className="acts r"><button onClick={()=>share(saved.build_id)}>SHARE</button><button className="pri" onClick={()=>{setModal(null);go('/garage')}}>OPEN GARAGE</button></div></>:
<form onSubmit={doSave}><label htmlFor="bn" className="lbl">BUILD NAME</label><input id="bn" value={name} onChange={e=>setName(e.target.value)} placeholder="BLACK BEAST" maxLength={30}/>
{editId&&<p className="nt">This updates your existing build.</p>}
<div className="acts r"><button type="button" onClick={()=>setModal(null)}>CANCEL</button><button className="pri" disabled={saving}>{saving?'SAVING…':'SAVE'}</button></div></form>}</Modal>}
{modal==='reset'&&<Modal title="RESET BUILD?" onClose={()=>setModal(null)}><p>All selections return to factory defaults.</p><div className="acts r"><button onClick={()=>setModal(null)}>CANCEL</button>
<button className="dng" onClick={()=>{setSel(C.defaultSelection(sel.car_id,opts));setLights('signature');setEditId(null);setServer(null);setName('');setModal(null);toast('Configuration reset')}}>RESET</button></div></Modal>}
{authPrompt&&<Modal title="GARAGE ACCESS" onClose={()=>{setAuthPrompt(false);authIntent.current='garage'}}><Auth mode={garageAuthMode} onModeChange={setGarageAuthMode} onAuth={onAuth} car={feat} look={authLook} embedded/></Modal>}
<div className="toasts" role="status" aria-live="polite">{toasts.map(t=><div key={t.id}>{t.m}</div>)}</div></div>}
