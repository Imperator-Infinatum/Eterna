import * as THREE from 'three';
import './style.css';
import { loadAssetManifest } from './assets/asset-loader';

void loadAssetManifest().then((manifest) => {
  console.info('[Eterna] Asset registry ready:', manifest.assets.length, 'approved project assets;', manifest.externalCandidates.length, 'researched external candidates.');
}).catch((error: unknown) => {
  console.warn('[Eterna] Asset registry could not be loaded:', error);
});
import {FollowCamera} from './game/camera';
import {PointClickControls} from './game/controls';
import {createHero} from './game/hero';
import {createWorld} from './game/world';

const canvas=document.querySelector<HTMLCanvasElement>('#game-canvas'),minimap=document.querySelector<HTMLCanvasElement>('#minimap'),loading=document.querySelector<HTMLDivElement>('#loading-screen'),selectionStatus=document.querySelector<HTMLDivElement>('#selection-status'),toast=document.querySelector<HTMLDivElement>('#selection-toast'),coordinates=document.querySelector<HTMLSpanElement>('#world-coordinates');
if(!canvas||!minimap||!loading||!selectionStatus||!toast||!coordinates)throw new Error('Eterna is missing a required canvas or UI element.');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const loadingSubtitle=loading.querySelector<HTMLDivElement>('.loading-subtitle');
const loadingBar=loading.querySelector<HTMLSpanElement>('.loading-track span');
await new Promise<void>((resolve)=>window.setTimeout(resolve,60));
const world=await createWorld((progress,message)=>{
  if(loadingSubtitle)loadingSubtitle.textContent=message.toUpperCase();
  if(loadingBar)loadingBar.style.width=(progress*100).toFixed(0)+'%';
});
const hero=createHero();world.scene.add(hero.root,hero.marker);hero.root.position.set(0,world.heightAt(0,0),0);hero.destination.set(0,hero.root.position.y,0);const cameraRig=new FollowCamera(canvas);
const controls=new PointClickControls(canvas,cameraRig.camera,hero,world,selected=>{selectionStatus.textContent=selected?'SELECTED':'NOT SELECTED';selectionStatus.classList.toggle('unselected',!selected);if(selected)showToast('WAYFARER SELECTED');},(x,z)=>{coordinates.textContent='X '+x.toFixed(0)+' · Z '+z.toFixed(0);showToast('MOVEMENT ORDER RECEIVED');});
function showToast(message:string):void{toast!.textContent=message;toast!.classList.add('visible');window.setTimeout(()=>toast!.classList.remove('visible'),1150);}
function drawMinimap():void{
 const c=minimap!.getContext('2d');if(!c)return;const w=minimap!.width,h=minimap!.height;c.clearRect(0,0,w,h);c.fillStyle='#314934';c.fillRect(0,0,w,h);c.strokeStyle='rgba(203,190,139,.16)';c.lineWidth=1;
 for(let i=1;i<5;i++){c.beginPath();c.moveTo(i*w/5,0);c.lineTo(i*w/5,h);c.stroke();c.beginPath();c.moveTo(0,i*h/5);c.lineTo(w,i*h/5);c.stroke();}
 const mx=(x:number)=>(x+48)/96*w,my=(z:number)=>(z+48)/96*h;c.strokeStyle='#9c8059';c.lineWidth=6;c.lineCap='round';c.beginPath();const road=[[-1,-42],[-1.2,-32],[-0.4,-22],[0.8,-12],[2,-2],[1.4,8],[0.2,18],[-1.2,28],[-3.5,39]];road.forEach(([x,z],i)=>i?c.lineTo(mx(x),my(z)):c.moveTo(mx(x),my(z)));c.stroke();
 c.fillStyle='#517f7c';c.beginPath();c.arc(mx(-20.5),my(-13.4),16,0,Math.PI*2);c.fill();for(const l of world.landmarks){c.fillStyle=l.kind==='ruin'?'#c6b58b':'#d8c48a';c.beginPath();c.arc(mx(l.x),my(l.z),4.5,0,Math.PI*2);c.fill();}
 c.fillStyle='#e4d08a';c.beginPath();c.arc(mx(hero.root.position.x),my(hero.root.position.z),5.5,0,Math.PI*2);c.fill();c.strokeStyle='#2d2318';c.lineWidth=2;c.stroke();
}
minimap!.addEventListener('pointerdown',e=>{const r=minimap!.getBoundingClientRect();controls.moveTo((e.clientX-r.left)/r.width*96-48,(e.clientY-r.top)/r.height*96-48);});
const clock=new THREE.Clock();let elapsed=0;function resize():void{renderer.setSize(window.innerWidth,window.innerHeight,false);cameraRig.resize(window.innerWidth,window.innerHeight);}window.addEventListener('resize',resize);resize();
function animate():void{requestAnimationFrame(animate);const delta=Math.min(clock.getDelta(),0.05);elapsed+=delta;hero.update(delta,world.heightAt);cameraRig.update(hero.root.position,delta);world.update(elapsed*1000);renderer.render(world.scene,cameraRig.camera);if(Math.floor(elapsed*4)!==Math.floor((elapsed-delta)*4))drawMinimap();}
try{animate();drawMinimap();window.setTimeout(()=>loading.classList.add('hidden'),500);}catch(error){console.error(error);loading.classList.add('error');loading.querySelector('.loading-subtitle')!.textContent='THE WORLD COULD NOT INITIALISE — CHECK WEBGL SUPPORT';}
window.addEventListener('beforeunload',()=>{controls.dispose();cameraRig.dispose();renderer.dispose();});