import type * as THREE from 'three';
export interface WorldLandmark { name:string; x:number; z:number; kind:'camp'|'ruin'|'water'|'road'; }
export interface WorldScene {
  scene:THREE.Scene; terrain:THREE.Mesh<THREE.BufferGeometry,THREE.MeshStandardMaterial>;
  landmarks:WorldLandmark[]; heightAt(x:number,z:number):number; update(time:number):void;
}
export interface HeroActor {
  root:THREE.Group; selectionRing:THREE.Mesh; marker:THREE.Mesh; destination:THREE.Vector3;
  selected:boolean; moving:boolean;
  setDestination(x:number,z:number,heightAt:(x:number,z:number)=>number):void;
  update(delta:number,heightAt:(x:number,z:number)=>number):void;
}