// Single source of truth: backend car -> how it is shown. The BACKEND decides which car it is; this file only says
// where that car's 3D model lives and how to read it. Matching is exact (slug, then exact normalised name):
// a car is never shown with another car's model.
import {resolveAssetUrl,API_BASE_URL} from './services/api.js';

export const normalizeCarKey=s=>String(s||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
const BASE=import.meta.env.BASE_URL;

const REGISTRY=[
 {key:'porsche-911-gt3-rs',alt:'Porsche 911 GT3 RS',art:'gt3rs',slugs:['porsche-911-gt3-rs'],names:['porsche-911-gt3-rs'],hasStaticImage:false,model:{credit:'',alwaysVisible:['skirts'],aero:{wing:[/TwiXeR_992_gt3rs_carbon_Wing$/i],skirts:[/TwiXeR_992_gt3rs_sideskirts_[LR]$/i]}}},
 {key:'apex-f1gt',alt:'Apex F1-GT',slugs:['apex-f1gt'],names:['apex-f1gt'],hasStaticImage:false,model:{credit:'',placeholder:true}},
 {key:'suzuki-swift',alt:'Suzuki Swift',slugs:['suzuki-swift'],names:['suzuki-swift'],hasStaticImage:false,model:{credit:''}}];

const find=car=>{const slug=normalizeCarKey(car.slug),name=normalizeCarKey(car.name);
 return REGISTRY.find(r=>slug&&r.slugs.includes(slug))||REGISTRY.find(r=>name&&r.names.includes(name))||null};

export function resolveVehicleVisual(car){
 const c=car||{},entry=find(c),slug=entry?entry.slugs[0]:normalizeCarKey(c.slug||c.name),cfg=entry?.model||{},backendImage=entry?.hasStaticImage===false?null:resolveAssetUrl(c.image_url),backendModel=resolveAssetUrl(c.model_url);
 
 const urls=[backendModel,`${API_BASE_URL}/assets/models/${slug}.glb`,`${BASE}models/cars/${slug}.glb`].filter((url,index,list)=>url&&list.indexOf(url)===index);
 const models=cfg.placeholder?[]:urls.map(url=>({url,cfg,credit:cfg.credit}));
 return{models,key:entry?.key||slug||'unknown',alt:entry?.alt||c.name||'Vehicle',sources:backendImage?[backendImage]:[],art:entry?.art||null,placeholder:!!cfg.placeholder}}
