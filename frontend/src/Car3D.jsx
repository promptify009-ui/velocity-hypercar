import React,{useEffect,useRef} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {createStage,loadModel} from './carStage.js';


export default function Car3D({vehicle,look,view,onFail,onLoad,onBusy,autoRotate=false,seatPreview=false}){
 const host=useRef(),S=useRef({token:0});S.current.look=look;S.current.autoRotate=autoRotate;
 useEffect(()=>{const el=host.current;let raf;
  try{
   const st=createStage({postprocessing:true}),canvas=st.renderer.domElement;el.appendChild(canvas);canvas.style.cssText='width:100%;height:100%;display:block;touch-action:none;cursor:grab';
  const ctl=new OrbitControls(st.cam,canvas);ctl.enablePan=true;ctl.enableZoom=false;ctl.enableDamping=true;ctl.dampingFactor=.05;ctl.minPolarAngle=0;ctl.maxPolarAngle=Math.PI;ctl.autoRotate=autoRotate;ctl.autoRotateSpeed=.45;
  let zoomTarget=null,lastFrame=performance.now(),panBounds=null,modelBounds=null,cameraTween=null,baseMinDistance=0,baseMaxDistance=Infinity;const pointers=new Map();
  const distance=()=>st.cam.position.distanceTo(ctl.target);
  const zoomTo=value=>{zoomTarget=THREE.MathUtils.clamp(value,ctl.minDistance,ctl.maxDistance)};
  const onWheel=e=>{e.preventDefault();zoomTo((zoomTarget??distance())*Math.exp(e.deltaY*.001))};
  const pinchDistance=()=>{const pts=[...pointers.values()];return pts.length===2?Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y):0};
  const onPointerDown=e=>{if(e.pointerType==='touch')pointers.set(e.pointerId,{x:e.clientX,y:e.clientY})};
  const onPointerMove=e=>{if(!pointers.has(e.pointerId))return;const previous=pinchDistance();pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});const next=pinchDistance();if(previous>0&&next>0)zoomTo((zoomTarget??distance())*previous/next)};
  const onPointerUp=e=>pointers.delete(e.pointerId);
  const onInteraction=()=>{cameraTween=null};ctl.addEventListener('start',onInteraction);
  canvas.addEventListener('wheel',onWheel,{passive:false});canvas.addEventListener('pointerdown',onPointerDown);canvas.addEventListener('pointermove',onPointerMove);canvas.addEventListener('pointerup',onPointerUp);canvas.addEventListener('pointercancel',onPointerUp);
   const resize=()=>st.resize(el.clientWidth||1,el.clientHeight||1);resize();const ro=new ResizeObserver(resize);ro.observe(el);
  const loop=now=>{raf=requestAnimationFrame(loop);const dt=Math.min((now-lastFrame)/1000,.05);lastFrame=now;
  if(zoomTarget!==null){const offset=st.cam.position.clone().sub(ctl.target),next=THREE.MathUtils.damp(offset.length(),zoomTarget,12,dt);st.cam.position.copy(ctl.target).add(offset.setLength(next));if(Math.abs(next-zoomTarget)<.002)zoomTarget=null}
  if(cameraTween){const progress=Math.min(1,(now-cameraTween.start)/cameraTween.duration),ease=progress*progress*(3-2*progress);st.cam.position.lerpVectors(cameraTween.fromPosition,cameraTween.toPosition,ease);ctl.target.lerpVectors(cameraTween.fromTarget,cameraTween.toTarget,ease);if(progress===1)cameraTween=null}
  ctl.update();if(panBounds){const before=ctl.target.clone();ctl.target.x=THREE.MathUtils.clamp(ctl.target.x,panBounds.min.x,panBounds.max.x);ctl.target.y=THREE.MathUtils.clamp(ctl.target.y,panBounds.min.y,panBounds.max.y);ctl.target.z=THREE.MathUtils.clamp(ctl.target.z,panBounds.min.z,panBounds.max.z);st.cam.position.add(ctl.target.clone().sub(before));ctl.update()}
  st.render()};loop(performance.now());
  view.current={reset:()=>{cameraTween=null;zoomTarget=null;ctl.minDistance=baseMinDistance;ctl.maxDistance=baseMaxDistance;ctl.autoRotate=S.current.autoRotate;st.home(ctl)},
   interior:()=>{if(!modelBounds)return;ctl.autoRotate=false;zoomTarget=null;ctl.minDistance=Math.min(baseMinDistance,modelBounds.h*.18);cameraTween={start:performance.now(),duration:1100,fromPosition:st.cam.position.clone(),toPosition:new THREE.Vector3(modelBounds.w*.62,modelBounds.h*.62,-modelBounds.l*.1),fromTarget:ctl.target.clone(),toTarget:new THREE.Vector3(0,modelBounds.h*.52,-modelBounds.l*.06)}},
   zoom:f=>zoomTo((zoomTarget??distance())/f),
    rotate:()=>{const d=st.cam.position.clone().sub(ctl.target);d.applyAxisAngle(new THREE.Vector3(0,1,0),.6);st.cam.position.copy(ctl.target).add(d)}};
   Object.assign(S.current,{st,ctl});st.setLook(S.current.look);
  return()=>{S.current.token++;cancelAnimationFrame(raf);ro.disconnect();ctl.removeEventListener('start',onInteraction);ctl.dispose();canvas.removeEventListener('wheel',onWheel);canvas.removeEventListener('pointerdown',onPointerDown);canvas.removeEventListener('pointermove',onPointerMove);canvas.removeEventListener('pointerup',onPointerUp);canvas.removeEventListener('pointercancel',onPointerUp);st.dispose();el.contains(canvas)&&el.removeChild(canvas);view.current=null;S.current.st=null}
  }catch(e){onFail()}},[]);

 useEffect(()=>{const {st,ctl}=S.current;if(!st)return;const token=++S.current.token;onBusy&&onBusy(true);
  (async()=>{for(const m of vehicle.models){
    try{const gl=await loadModel(m.url);if(token!==S.current.token)return;const model=st.show(m,gl);
    modelBounds=model;baseMinDistance=st.dist*.35;baseMaxDistance=st.dist*2.5;ctl.minDistance=baseMinDistance;ctl.maxDistance=baseMaxDistance;panBounds={min:{x:-model.w*.65,y:model.h*.05,z:-model.l*.65},max:{x:model.w*.65,y:model.h*1.25,z:model.l*.65}};st.home(ctl);onLoad&&onLoad(m);onBusy&&onBusy(false);
     if(import.meta.env.DEV)console.info(`[VELOCITY] backend car: ${vehicle.name}\n[VELOCITY] resolved model: ${m.url}`);return}
    catch(e){if(token!==S.current.token)return}}
   onBusy&&onBusy(false);onFail&&onFail()})()},[vehicle]);

 useEffect(()=>{S.current.st&&S.current.st.setLook(look)},[look]);
 useEffect(()=>{if(S.current.ctl)S.current.ctl.autoRotate=autoRotate},[autoRotate]);
 useEffect(()=>{S.current.st?.setSeatVisible(seatPreview)},[seatPreview]);
 return <div ref={host} className="c3d"/>}
