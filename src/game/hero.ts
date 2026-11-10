import * as THREE from 'three';
import type {HeroActor} from './types';
const brass=new THREE.MeshStandardMaterial({color:0xb58b43,metalness:0.52,roughness:0.42}),steel=new THREE.MeshStandardMaterial({color:0x87949a,metalness:0.62,roughness:0.36}),leather=new THREE.MeshStandardMaterial({color:0x4c3022,roughness:0.82}),cloth=new THREE.MeshStandardMaterial({color:0x274d40,roughness:0.9}),skin=new THREE.MeshStandardMaterial({color:0xc58f69,roughness:0.83}),dark=new THREE.MeshStandardMaterial({color:0x1d2422,roughness:0.9});
function mesh(g:THREE.BufferGeometry,m:THREE.Material,p:THREE.Object3D,v:THREE.Vector3):THREE.Mesh{const o=new THREE.Mesh(g,m);o.position.copy(v);o.castShadow=true;o.receiveShadow=true;p.add(o);return o;}
export function createHero():HeroActor{
  const root=new THREE.Group();root.name='EternaPlayerHero';
  const torso=mesh(new THREE.CapsuleGeometry(0.43,0.78,7,12),cloth,root,new THREE.Vector3(0,1.34,0));torso.scale.set(1,1,0.72);
  mesh(new THREE.BoxGeometry(0.88,0.66,0.58),steel,root,new THREE.Vector3(0,1.55,0.02));mesh(new THREE.BoxGeometry(0.94,0.12,0.62),brass,root,new THREE.Vector3(0,1.16,0.02));
  const shoulder=new THREE.SphereGeometry(0.29,16,12);mesh(shoulder,brass,root,new THREE.Vector3(-0.56,1.75,0));mesh(shoulder,brass,root,new THREE.Vector3(0.56,1.75,0));
  const head=mesh(new THREE.SphereGeometry(0.32,20,16),skin,root,new THREE.Vector3(0,2.18,0.02));head.scale.set(0.9,1.05,0.86);mesh(new THREE.SphereGeometry(0.35,16,12),leather,root,new THREE.Vector3(0,2.37,0.02)).scale.set(1.18,0.46,1.05);
  const legs=new THREE.CylinderGeometry(0.17,0.22,0.72,10);for(const side of [-1,1]){const leg=mesh(legs,leather,root,new THREE.Vector3(side*0.23,0.48,0));leg.rotation.z=side*-0.035;mesh(new THREE.BoxGeometry(0.36,0.18,0.5),dark,root,new THREE.Vector3(side*0.23,0.14,0.09));const arm=mesh(new THREE.CapsuleGeometry(0.14,0.42,4,8),steel,root,new THREE.Vector3(side*0.59,1.37,0.03));arm.rotation.z=side*-0.22;}
  const shield=mesh(new THREE.CylinderGeometry(0.38,0.31,0.12,8),brass,root,new THREE.Vector3(-0.79,1.28,0.12));shield.rotation.x=Math.PI/2;mesh(new THREE.SphereGeometry(0.13,12,10),steel,root,new THREE.Vector3(-0.79,1.28,0.2)).scale.set(1,1,0.5);
  const sword=new THREE.Group();sword.position.set(0.75,1.24,0.06);sword.rotation.z=-0.16;root.add(sword);mesh(new THREE.BoxGeometry(0.12,0.86,0.07),steel,sword,new THREE.Vector3(0,0.48,0));mesh(new THREE.BoxGeometry(0.43,0.09,0.12),brass,sword,new THREE.Vector3(0,0.02,0));mesh(new THREE.CylinderGeometry(0.085,0.085,0.28,10),leather,sword,new THREE.Vector3(0,-0.18,0));mesh(new THREE.ConeGeometry(0.11,0.22,4),steel,sword,new THREE.Vector3(0,0.98,0));
  const cape=mesh(new THREE.ConeGeometry(0.62,1.18,5,1,true),cloth,root,new THREE.Vector3(0,1.24,-0.36));cape.rotation.x=-0.12;cape.rotation.z=Math.PI;cape.scale.set(0.9,1,0.42);
  const ring=new THREE.Mesh(new THREE.RingGeometry(0.82,1.02,48),new THREE.MeshBasicMaterial({color:0xd8bb6e,transparent:true,opacity:0.84,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=0.035;root.add(ring);
  const marker=new THREE.Mesh(new THREE.RingGeometry(0.52,0.7,40),new THREE.MeshBasicMaterial({color:0xd7bd70,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false}));marker.rotation.x=-Math.PI/2;marker.position.y=0.06;
  return {root,selectionRing:ring,marker,destination:new THREE.Vector3(),selected:true,moving:false,
    setDestination(x,z,heightAt){this.destination.set(x,heightAt(x,z),z);this.moving=true;this.marker.position.set(x,heightAt(x,z)+0.08,z);(this.marker.material as THREE.MeshBasicMaterial).opacity=0.92;},
    update(delta,heightAt){this.selectionRing.visible=this.selected;this.selectionRing.scale.setScalar(1+Math.sin(performance.now()*0.004)*0.035);
      if(this.moving){const dx=this.destination.x-this.root.position.x,dz=this.destination.z-this.root.position.z,d=Math.hypot(dx,dz);if(d<0.12){this.moving=false;(this.marker.material as THREE.MeshBasicMaterial).opacity=0;}else{const step=Math.min(d,delta*4.2);this.root.position.x+=dx/d*step;this.root.position.z+=dz/d*step;this.root.rotation.y=Math.atan2(dx,dz);}}
      this.root.position.y=heightAt(this.root.position.x,this.root.position.z);this.marker.position.y=heightAt(this.marker.position.x,this.marker.position.z)+0.08;
    }};
}