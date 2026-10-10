import React,{useRef,useState,useMemo,useEffect} from 'react';
import Car3D from './Car3D.jsx';
import {Wheel} from './Wheel.jsx';
import {snapshot} from './carStage.js';
import {resolveVehicleVisual} from './vehicleVisuals.js';
import {ART,NamedPlaceholder} from './VehicleArt.jsx';
export {Wheel};

function Still({car,look,sources,Art,onImageError,index}){const src=sources[index];
 if(src)return <div className="pw"><div className="pi plain"><div className="pglow" style={{'--p':look.body}}/><img className="photo" src={src} alt={`${car.name} configured vehicle`} draggable={false} onError={onImageError}/>
  {look.paintName&&<span className="pchip"><i style={{background:look.body}}/>{look.paintName}</span>}</div></div>;
 return Art?<Art look={look}/>:<NamedPlaceholder name={car.name}/>}


function Thumb({vehicle,look,car,onUnavailable}){const [url,setUrl]=useState(null);
 useEffect(()=>{let live=true;snapshot(vehicle,look).then(u=>{if(!live)return;u?setUrl(u):onUnavailable()}).catch(()=>{if(live)onUnavailable()});return()=>{live=false}},[vehicle,look.body,look.wheelType,look.cal,look.interior,look.light,(look.parts||[]).join()]);
 return url?<img className="photo snap" src={url} alt={`${car.name} configured vehicle`} draggable={false}/>:<span className="loading3d" role="status">…</span>}

function Inner({car,look,compact}){
 const v=useMemo(()=>resolveVehicleVisual(car),[car]);
 const vehicle=useMemo(()=>({key:v.key,name:car.name,models:v.models}),[v,car.name]);
 const [no3d,setNo3d]=useState(false),[busy,setBusy]=useState(false),[loaded,setLoaded]=useState(null),[img,setImg]=useState(0),[autoRotate,setAutoRotate]=useState(false),[seatPreview,setSeatPreview]=useState(false);const view=useRef(null);
 const Art=v.art&&ART[v.art];
 const still=<Still car={car} look={look} sources={v.sources} Art={Art} index={img} onImageError={()=>setImg(i=>i+1)}/>;

 if(compact)return <div className="stage compact" data-model={v.key}><div className="car">{no3d?still:<Thumb vehicle={vehicle} look={look} car={car} onUnavailable={()=>setNo3d(true)}/>}</div></div>;

 if(!no3d)return <div className="stage s3d" data-model={v.key}><Car3D vehicle={vehicle} look={look} view={view} autoRotate={autoRotate} seatPreview={seatPreview} onLoad={setLoaded} onBusy={setBusy} onFail={()=>setNo3d(true)}/>
  {busy&&<span className="loading3d" role="status">LOADING {car.name}…</span>}{loaded?.credit&&<span className="credit">{loaded.credit}</span>}
  <div className="ctrls" role="group" aria-label="Preview controls"><button className={'auto'+(autoRotate?' active':'')} aria-label={autoRotate?'Stop auto rotation':'Start auto rotation'} aria-pressed={autoRotate} title={autoRotate?'Stop auto rotation':'Start auto rotation'} onClick={()=>setAutoRotate(value=>!value)}>↻</button><button className={'seat-toggle'+(seatPreview?' active':'')} aria-label={seatPreview?'Hide seat preview':'Show seat preview'} aria-pressed={seatPreview} title={seatPreview?'Hide seat preview':'Show seat preview'} onClick={()=>setSeatPreview(value=>!value)}>SEAT</button><button className="seat-toggle cabin-toggle" disabled={!loaded||busy} aria-label="View cabin and seats" title="View cabin and seats" onClick={()=>{setAutoRotate(false);view.current?.interior()}}>CABIN</button><button aria-label="Zoom out" onClick={()=>view.current?.zoom(1/1.2)}>−</button><button aria-label="Reset view" onClick={()=>view.current?.reset()}>⛶</button>
   <button aria-label="Zoom in" onClick={()=>view.current?.zoom(1.2)}>+</button><button aria-label="Rotate" onClick={()=>view.current?.rotate()}>↔</button></div></div>;

 return <div className="stage" data-model={v.key}><div className="ground"/><div className="car">{still}</div>
  <span className="credit warn">{v.placeholder?`${car.name} GLB is a placeholder — model asset pending`:`3D model for ${car.name} is not installed — showing its visual fallback`}</span></div>}

export default function CarVisual(props){return <Inner key={props.car?.id??'none'} {...props}/>}
