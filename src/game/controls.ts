import * as THREE from 'three';
import type {HeroActor,WorldScene} from './types';
export class PointClickControls {
  private readonly raycaster=new THREE.Raycaster();private readonly pointer=new THREE.Vector2();
  constructor(private readonly canvas:HTMLCanvasElement,private readonly camera:THREE.Camera,private readonly hero:HeroActor,private readonly world:WorldScene,private readonly onSelection:(selected:boolean)=>void,private readonly onMove:(x:number,z:number)=>void) {
    canvas.addEventListener('contextmenu',this.preventContextMenu);canvas.addEventListener('pointerdown',this.onPointerDown);
  }
  private preventContextMenu=(event:Event):void=>event.preventDefault();
  private setRay(event:Pick<PointerEvent,'clientX'|'clientY'>):void {
    const rect=this.canvas.getBoundingClientRect();this.pointer.set(((event.clientX-rect.left)/rect.width)*2-1,-((event.clientY-rect.top)/rect.height)*2+1);this.raycaster.setFromCamera(this.pointer,this.camera);
  }
  private onPointerDown=(event:PointerEvent):void=>{
    if(event.button===1)return;this.setRay(event);
    if(event.button===0){const selected=this.raycaster.intersectObject(this.hero.root,true).length>0;this.hero.selected=selected;this.onSelection(selected);return;}
    if(event.button===2){const hits=this.raycaster.intersectObject(this.world.terrain,false);if(!hits.length)return;const p=hits[0].point;this.moveTo(p.x,p.z);}
  };
  moveTo(x:number,z:number):void {const cx=THREE.MathUtils.clamp(x,-44,44),cz=THREE.MathUtils.clamp(z,-44,44);this.hero.selected=true;this.hero.setDestination(cx,cz,this.world.heightAt);this.onSelection(true);this.onMove(cx,cz);}
  dispose():void {this.canvas.removeEventListener('contextmenu',this.preventContextMenu);this.canvas.removeEventListener('pointerdown',this.onPointerDown);}
}