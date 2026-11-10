import * as THREE from 'three';
export class FollowCamera {
  readonly camera:THREE.PerspectiveCamera;
  private yaw=0; private distance=34; private dragging=false; private previousX=0;
  constructor(private readonly canvas:HTMLCanvasElement) {
    this.camera=new THREE.PerspectiveCamera(43,1,0.1,180);this.camera.position.set(0,27,22);this.camera.lookAt(0,0,0);
    canvas.addEventListener('pointerdown',this.onPointerDown);window.addEventListener('pointermove',this.onPointerMove);window.addEventListener('pointerup',this.onPointerUp);
    canvas.addEventListener('wheel',this.onWheel,{passive:false});
  }
  private onPointerDown=(e:PointerEvent):void=>{if(e.button!==1)return;this.dragging=true;this.previousX=e.clientX;this.canvas.classList.add('camera-dragging');e.preventDefault();};
  private onPointerMove=(e:PointerEvent):void=>{if(!this.dragging)return;const dx=e.clientX-this.previousX;this.previousX=e.clientX;this.yaw-=dx*0.006;};
  private onPointerUp=():void=>{this.dragging=false;this.canvas.classList.remove('camera-dragging');};
  private onWheel=(e:WheelEvent):void=>{this.distance=THREE.MathUtils.clamp(this.distance+e.deltaY*0.018,22,52);e.preventDefault();};
  update(target:THREE.Vector3,delta:number):void {
    const h=this.distance*0.68,desired=new THREE.Vector3(target.x+Math.sin(this.yaw)*h,target.y+this.distance*0.82,target.z+Math.cos(this.yaw)*h);
    this.camera.position.lerp(desired,1-Math.exp(-delta*3.8));this.camera.lookAt(target.x,target.y+0.85,target.z);
  }
  resize(w:number,h:number):void{this.camera.aspect=w/h;this.camera.updateProjectionMatrix();}
  dispose():void{this.canvas.removeEventListener('pointerdown',this.onPointerDown);window.removeEventListener('pointermove',this.onPointerMove);window.removeEventListener('pointerup',this.onPointerUp);this.canvas.removeEventListener('wheel',this.onWheel);}
}