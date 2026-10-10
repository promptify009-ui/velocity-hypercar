import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/examples/jsm/loaders/DRACOLoader.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {clone as cloneSkeleton} from 'three/examples/jsm/utils/SkeletonUtils.js';
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass.js';
import {SSAOPass} from 'three/examples/jsm/postprocessing/SSAOPass.js';
import {SSRPass} from 'three/examples/jsm/postprocessing/SSRPass.js';
import {OutputPass} from 'three/examples/jsm/postprocessing/OutputPass.js';
import {classify} from './modelAdapters.js';

const BASE=import.meta.env.BASE_URL;
const RIMS={aero:['#4b4e53',1,.35],carbon:['#16171a',.6,.45],forged:['#cfd3d8',1,.12],performance:['#a07a45',1,.28]};
const LENGTH=4.5;                               
const VIEW_DIR=new THREE.Vector3(4.25,1.3,-4.6).normalize();

const CACHE=new Map(),ACTIVE=new Map(),MAX_CACHED=3;let loader;
const getLoader=()=>loader||(loader=new GLTFLoader().setDRACOLoader(new DRACOLoader().setDecoderPath(BASE+'draco/')));
function retain(url){ACTIVE.set(url,(ACTIVE.get(url)||0)+1)}
function release(url){const count=ACTIVE.get(url)||0;if(count<=1)ACTIVE.delete(url);else ACTIVE.set(url,count-1)}
function freeEntry(e){if(!e.gl)return;const geometries=new Set(),materials=new Set(),textures=new Set();
 e.gl.scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{if(!m)return;materials.add(m);Object.values(m).forEach(t=>{if(t&&t.isTexture)textures.add(t)})})});
 geometries.forEach(g=>g.dispose());textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose())}
function disposePrepared(p){new Set(p?.slots.map(slot=>slot.material)||[]).forEach(m=>m.dispose())}
function makeSeat(height,look){const group=new THREE.Group(),h=height*.78,w=h*.58,d=h*.62;
 const leather=new THREE.MeshPhysicalMaterial({color:look.interior,roughness:.4,metalness:.02,clearcoat:.18,clearcoatRoughness:.32});
 const shell=new THREE.MeshPhysicalMaterial({color:'#171b1c',roughness:.3,metalness:.45,clearcoat:.5});
 const piping=new THREE.MeshStandardMaterial({color:look.body,roughness:.36,metalness:.28});
 const make=(geometry,material,position)=>{const mesh=new THREE.Mesh(geometry,material);mesh.position.set(...position);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh};
 make(new RoundedBoxGeometry(w*.9,h*.1,d*.82,5,h*.04),shell,[0,h*.07,0]);
 make(new RoundedBoxGeometry(w*.9,h*.13,d*.68,6,h*.055),leather,[0,h*.2,-d*.04]);
 const back=make(new RoundedBoxGeometry(w*.88,h*.55,d*.19,7,h*.07),leather,[0,h*.55,d*.19]);back.rotation.x=-.09;
 make(new RoundedBoxGeometry(w*.52,h*.17,d*.18,6,h*.06),leather,[0,h*.91,d*.2]);
 for(const side of [-1,1]){const bolster=make(new RoundedBoxGeometry(w*.13,h*.43,d*.24,5,h*.055),leather,[side*w*.39,h*.53,d*.11]);bolster.rotation.x=-.08;
  make(new RoundedBoxGeometry(w*.055,h*.42,d*.1,4,h*.02),shell,[side*w*.43,h*.52,d*.14]);
  make(new RoundedBoxGeometry(w*.018,h*.34,d*.014,3,h*.006),piping,[side*w*.29,h*.55,-d*.01])}
 for(const row of [.4,.52,.64,.76])make(new RoundedBoxGeometry(w*.42,h*.008,d*.012,3,h*.003),piping,[0,h*row,-d*.015]);
 make(new RoundedBoxGeometry(w*.16,h*.12,d*.12,4,h*.02),shell,[0,h*.04,d*.02]);
 group.userData.trimMaterials={leather,piping};group.userData.height=h;return group}
function disposeSeat(seat){if(!seat)return;const geometries=new Set(),materials=new Set();seat.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m))});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose())}
function makePhysicalMaterial(source){const material=new THREE.MeshPhysicalMaterial({color:source.color,map:source.map,lightMap:source.lightMap,lightMapIntensity:source.lightMapIntensity,aoMap:source.aoMap,aoMapIntensity:source.aoMapIntensity,emissive:source.emissive,emissiveMap:source.emissiveMap,emissiveIntensity:source.emissiveIntensity,bumpMap:source.bumpMap,bumpScale:source.bumpScale,normalMap:source.normalMap,normalMapType:source.normalMapType,normalScale:source.normalScale,displacementMap:source.displacementMap,displacementScale:source.displacementScale,displacementBias:source.displacementBias,roughnessMap:source.roughnessMap,metalnessMap:source.metalnessMap,alphaMap:source.alphaMap,alphaTest:source.alphaTest,envMap:source.envMap,envMapIntensity:source.envMapIntensity,metalness:source.metalness,roughness:source.roughness,side:source.side,shadowSide:source.shadowSide,vertexColors:source.vertexColors,flatShading:source.flatShading,opacity:source.opacity,transparent:source.transparent,depthTest:source.depthTest,depthWrite:source.depthWrite,colorWrite:source.colorWrite,blending:source.blending,premultipliedAlpha:source.premultipliedAlpha,toneMapped:source.toneMapped,fog:source.fog});material.name=source.name;material.userData={...source.userData};return material}
export function loadModel(url){let e=CACHE.get(url);if(e){CACHE.delete(url);CACHE.set(url,e);return e.p}
 e={};e.p=new Promise((res,rej)=>getLoader().load(url,gl=>{e.gl=gl;res(gl)},undefined,rej));CACHE.set(url,e);
 e.p.then(()=>{while(CACHE.size>MAX_CACHED){const old=[...CACHE.keys()].find(u=>!ACTIVE.has(u)&&u!==url);if(!old)break;freeEntry(CACHE.get(old));CACHE.delete(old)}},()=>CACHE.delete(url));
 return e.p}

// ---- one-time preparation of a loaded GLB: classify parts, orient, scale, sit on the floor ----
function prepare(gl,cfg={}){
 const root=cloneSkeleton(gl.scene),holder=new THREE.Group(),slots=[],count={};holder.add(root);
 root.traverse(o=>{if(!o.isMesh)return;const chain=[];for(let p=o.parent;p&&chain.length<2;p=p.parent)chain.push(p.name);
  o.castShadow=true;o.receiveShadow=true;
  const original=Array.isArray(o.material)?o.material:[o.material],multi=Array.isArray(o.material);
  const variants=original.map(material=>{const cls=classify({mesh:o.name,mat:material&&material.name,chain},cfg.adapter);if(!cls||!material?.clone)return material;
  const variant=cls==='body'||cls==='carbon'?makePhysicalMaterial(material):material.clone();if(cls==='body'){variant.metalness=Math.max(variant.metalness||0,.9);variant.roughness=Math.min(variant.roughness??.3,.12);variant.clearcoat=Math.max(variant.clearcoat||0,1);variant.clearcoatRoughness=Math.min(variant.clearcoatRoughness??.1,.1);variant.envMapIntensity=Math.max(variant.envMapIntensity||1,2)}else if(cls==='carbon'){variant.metalness=Math.max(variant.metalness||0,.8);variant.roughness=Math.min(variant.roughness??.22,.18);variant.clearcoat=Math.max(variant.clearcoat||0,.82);variant.clearcoatRoughness=Math.min(variant.clearcoatRoughness??.16,.14);variant.envMapIntensity=Math.max(variant.envMapIntensity||1,1.7)}
  slots.push({mesh:o,material:variant,cls});count[cls]=(count[cls]||0)+1;return variant});o.material=multi?variants:variants[0]});
 const aero={};Object.entries(cfg.aero||{}).forEach(([part,res])=>{aero[part]=[];root.traverse(o=>{if(res.some(r=>r.test(o.name)))aero[part].push(o)})});
 const box=new THREE.Box3(),size=new THREE.Vector3(),ctr=new THREE.Vector3(),measure=()=>{root.updateMatrixWorld(true);box.setFromObject(root);box.getSize(size)};
 measure();if(size.x>size.z*1.05){root.rotation.y+=Math.PI/2;measure()}   // length axis -> Z
 if(cfg.rotY){root.rotation.y+=cfg.rotY;measure()}
 holder.scale.setScalar(LENGTH/size.z*(cfg.scale||1));holder.updateMatrixWorld(true);box.setFromObject(holder);box.getSize(size);box.getCenter(ctr);
 holder.position.set(-ctr.x,-box.min.y,-ctr.z);
 return{holder,slots,aero,count,alwaysVisible:cfg.alwaysVisible||[],reflectionMeshes:[...new Set(slots.filter(s=>s.cls==='body'||s.cls==='rim').map(s=>s.mesh))],w:size.x,h:size.y,l:size.z}}

export function createStage({preserve=false,postprocessing=false}={}){
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:preserve});
 renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.9;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 const scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(36,1,.1,200),ambient=new THREE.AmbientLight('#ffffff',.45);scene.fog=new THREE.FogExp2(0x151a1a,.012);
 const keyLight=new THREE.DirectionalLight(0xfff1dc,2.1),fillLight=new THREE.DirectionalLight(0xc8ddff,1.1),rimLight=new THREE.DirectionalLight(0xffffff,2.4);
 keyLight.position.set(4,7,5);keyLight.castShadow=true;keyLight.shadow.mapSize.set(1024,1024);keyLight.shadow.camera.left=-7;keyLight.shadow.camera.right=7;keyLight.shadow.camera.top=7;keyLight.shadow.camera.bottom=-7;keyLight.shadow.bias=-.0002;
 fillLight.position.set(-5,3,2);rimLight.position.set(1,4,-6);scene.add(ambient,keyLight,fillLight,rimLight);
 const room=new RoomEnvironment(),pmrem=new THREE.PMREMGenerator(renderer),environment=pmrem.fromScene(room,.04);scene.environment=environment.texture;pmrem.dispose();
 room.traverse(o=>{o.geometry?.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m?.dispose())});
 const cv=document.createElement('canvas');cv.width=cv.height=256;const g=cv.getContext('2d'),gr=g.createRadialGradient(128,128,10,128,128,128);
 gr.addColorStop(0,'rgba(0,0,0,.6)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,256,256);
 const shadow=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(cv),transparent:true,depthWrite:false}));
 shadow.rotation.x=-Math.PI/2;shadow.position.y=.005;scene.add(shadow);
 const receiver=new THREE.Mesh(new THREE.PlaneGeometry(30,30),new THREE.MeshPhysicalMaterial({color:0x121616,metalness:.32,roughness:.3,clearcoat:.45,clearcoatRoughness:.2}));receiver.rotation.x=-Math.PI/2;receiver.position.y=-.008;receiver.receiveShadow=true;scene.add(receiver);
 let composer=null,ssaoPass=null,ssrPass=null,outputPass=null;
 if(postprocessing){composer=new EffectComposer(renderer);composer.setPixelRatio(Math.min(renderer.getPixelRatio()*.5,1));composer.addPass(new RenderPass(scene,cam));
  ssrPass=new SSRPass({renderer,scene,camera:cam,width:512,height:512,selects:[]});ssrPass.opacity=.42;ssrPass.maxDistance=3.5;ssrPass.thickness=.12;ssrPass.blur=true;composer.addPass(ssrPass);
  ssaoPass=new SSAOPass(scene,cam,512,512,16);ssaoPass.kernelRadius=2.2;ssaoPass.minDistance=.008;ssaoPass.maxDistance=.08;composer.addPass(ssaoPass);
  outputPass=new OutputPass();composer.addPass(outputPass)}
 const s={renderer,scene,cam,ambient,cur:null,url:null,seat:null,seatVisible:false,dist:9,ty:.45,look:null};
 s.setLook=look=>{s.look=look;ambient.color.set(look.light||'#ffffff');
  if(s.cur){const [rimColor,metalness,roughness]=RIMS[look.wheelType]||RIMS.forged;s.cur.slots.forEach(({material,cls})=>{
   if(!material.color)return;if(cls==='body')material.color.set(look.body);else if(cls==='rim'){material.color.set(rimColor);if('metalness'in material)material.metalness=metalness;if('roughness'in material)material.roughness=roughness}
   else if(cls==='caliper')material.color.set(look.cal);else if(cls==='interior')material.color.set(look.interior)});
   Object.entries(s.cur.aero).forEach(([part,list])=>list.forEach(o=>{o.visible=(look.parts||[]).includes(part)||s.cur.alwaysVisible.includes(part)}))}
  if(s.seat){s.seat.userData.trimMaterials.leather.color.set(look.interior);s.seat.userData.trimMaterials.piping.color.set(look.body)}};
 s.show=(m,gl)=>{const p=prepare(gl,m.cfg);if(s.cur){scene.remove(s.cur.holder);release(s.url);disposePrepared(s.cur)}if(s.seat){scene.remove(s.seat);disposeSeat(s.seat)}
  scene.add(p.holder);s.cur=p;s.url=m.url;retain(m.url);
  if(ssrPass)ssrPass.selects=[...p.reflectionMeshes,receiver];
  s.seat=makeSeat(p.h*1.05,s.look||{interior:'#171b1c',body:'#a88358'});s.seat.position.set(p.w*.5+s.seat.userData.height*.42,0,p.l*.12);s.seat.visible=s.seatVisible;scene.add(s.seat);
  s.dist=Math.max(p.l,p.h*2.2,p.w*1.2)*1.3*(m.cfg?.camera||1);s.ty=p.h*.45+(m.cfg?.targetY||0);shadow.scale.set(p.w*1.5,p.l*1.4,1);
  if(s.look)s.setLook(s.look);return p};
 s.setSeatVisible=visible=>{s.seatVisible=visible;if(s.seat)s.seat.visible=visible};
 s.render=()=>{const floorVisible=cam.position.y>=receiver.position.y;receiver.visible=floorVisible;shadow.visible=floorVisible;if(composer)composer.render();else renderer.render(scene,cam)};
 s.home=ctl=>{cam.position.copy(VIEW_DIR).multiplyScalar(s.dist).add(new THREE.Vector3(0,s.ty,0));if(ctl){ctl.target.set(0,s.ty,0);ctl.update()}else cam.lookAt(0,s.ty,0)};
 s.resize=(w,h)=>{renderer.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();composer?.setSize(w,h)};
 s.dispose=()=>{if(s.cur){scene.remove(s.cur.holder);release(s.url);disposePrepared(s.cur)}if(s.seat){scene.remove(s.seat);disposeSeat(s.seat)}composer?.passes.forEach(pass=>pass.dispose?.());composer?.dispose();shadow.geometry.dispose();shadow.material.map.dispose();shadow.material.dispose();receiver.geometry.dispose();receiver.material.dispose();keyLight.shadow.map?.dispose();scene.environment.dispose();renderer.dispose()};
 return s}

// ---- still image of a car (used for thumbnails: home, model picker, garage). One shared stage, requests queued, results cached ----
let snapStage,queue=Promise.resolve();const SNAPS=new Map();
const snapshotKey=(vehicle,look)=>[vehicle.key,look.body,look.wheelType,look.cal,look.interior,look.light,(look.parts||[]).join()].join('|');
export function snapshot(vehicle,look,w=1000,h=470){
 const key=snapshotKey(vehicle,look);if(SNAPS.has(key))return SNAPS.get(key);
 const job=queue.then(async()=>{snapStage=snapStage||createStage({preserve:true});
  for(const m of vehicle.models){try{const gl=await loadModel(m.url);snapStage.show(m,gl);snapStage.setLook(look);snapStage.home();snapStage.resize(w,h);snapStage.renderer.render(snapStage.scene,snapStage.cam);
   return snapStage.renderer.domElement.toDataURL('image/png')}catch(e){/* try next candidate */}}return null});
 queue=job.catch(()=>{});SNAPS.set(key,job);return job.catch(error=>{if(SNAPS.get(key)===job)SNAPS.delete(key);throw error})}
