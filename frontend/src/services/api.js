// Single place that knows the backend URL, auth token and error shape.
export const API_BASE_URL=(import.meta.env.VITE_API_BASE_URL||'').replace(/\/+$/,'');
const TOKEN_KEY='vx_token';
export const tokenStore={
get:()=>{try{return localStorage.getItem(TOKEN_KEY)}catch{return null}},
set:t=>{try{localStorage.setItem(TOKEN_KEY,t)}catch{}},
clear:()=>{try{localStorage.removeItem(TOKEN_KEY)}catch{}}};

export class ApiError extends Error{constructor(status,message,detail){super(message);this.name='ApiError';this.status=status;this.detail=detail}}

const FALLBACK={401:'Please log in to continue.',403:'You do not have access to this.',404:'We could not find that.',422:'Some of the information sent was invalid.',500:'The server hit a problem. Please try again.'};
function messageFrom(status,body){const d=body&&body.detail;
if(typeof d==='string')return d;
if(Array.isArray(d)&&d.length)return d.map(x=>{const f=Array.isArray(x.loc)?x.loc.filter(p=>p!=='body').join('.'):'';return f?`${f}: ${x.msg}`:x.msg}).join(' · ');
return FALLBACK[status]||(status>=500?FALLBACK[500]:`Request failed (${status}).`)}

export async function request(path,{method='GET',body,auth=true}={}){
const headers={Accept:'application/json'};if(body!==undefined)headers['Content-Type']='application/json';
const t=tokenStore.get();if(auth&&t)headers.Authorization='Bearer '+t;
let res;try{res=await fetch(API_BASE_URL+path,{method,headers,body:body!==undefined?JSON.stringify(body):undefined})}
catch{throw new ApiError(0,'Cannot reach the Velocity server. Check your connection and try again.')}
let data=null;if(res.status!==204){let txt;try{txt=await res.text()}catch{throw new ApiError(0,'Cannot reach the Velocity server. Check your connection and try again.')}try{data=txt?JSON.parse(txt):null}catch{data=null}}
if(!res.ok)throw new ApiError(res.status,messageFrom(res.status,data),data);
return data}

// Backend-relative asset paths (/assets/x.png) live on the API origin, not the Vite origin.
export function resolveAssetUrl(u){if(!u||typeof u!=='string')return null;
if(/^(https?:)?\/\//i.test(u)||u.startsWith('data:'))return u;
return API_BASE_URL+(u.startsWith('/')?'':'/')+u}
