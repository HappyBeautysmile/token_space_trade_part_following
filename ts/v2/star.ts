import * as THREE from "three";
import { S } from "../settings";


export class Star extends THREE.Mesh {
  constructor() {
    super(new THREE.IcosahedronBufferGeometry(S.float('ss'), 4),
      Star.makeMaterial());
    this.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e30);
  }

  private static makeMaterial(): THREE.ShaderMaterial {
    const material = new THREE.ShaderMaterial({
      vertexShader: `
      varying vec3 vDirection;
      varying float viewDot;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        float distance = length(worldPosition.xyz / worldPosition.w);
        if (distance > 700.0) {
          worldPosition.xyz *= 700.0 / distance;
        }
        vec4 mvPosition = viewMatrix * worldPosition;
        gl_Position = projectionMatrix * mvPosition;

        vec3 toCamera = cameraPosition - worldPosition.xyz;
        toCamera /= length(toCamera);
        vDirection = normal;
        viewDot = dot(normal, toCamera);
      }`,
      fragmentShader: `
      varying vec3 vDirection;
      varying float viewDot;
      float wave(in vec4 x, in vec4 dir, in float freq, in float offset) {
        return sin(offset + dot(x, dir) * freq);
      }
      
      float compoundWaves(in vec4 view) {
        float sum = 0.0;
        { vec4 dir = vec4(-5.0, 1.0, 4.0, -3.0); dir = dir / length(dir); sum += wave(view, dir, 9.0, 0.4); }
        { vec4 dir = vec4(1.0, 4.0, -3.0, -2.0); dir = dir / length(dir); sum += wave(view, dir, 7.0, -0.4); }
        { vec4 dir = vec4(0.0, -3.0, 7.0, 3.0); dir = dir / length(dir); sum += wave(view, dir, 5.0, 0.2); }
        { vec4 dir = vec4(3.0, -8.0, 1.0, -7.0); dir = dir / length(dir); sum += wave(view, dir, 11.0, 0.9); }
        { vec4 dir = vec4(-7.0, 3.0, 5.0, 9.0); dir = dir / length(dir); sum += wave(view, dir, 13.0, 0.8); }
        return sum / 2.0;
      }
      
      vec4 compound4(in vec4 view) {
        return vec4(
          compoundWaves(view.xyzw), 
          compoundWaves(view.yzwx), 
          compoundWaves(view.zwyx),
          compoundWaves(view.wzxy));
      }
      
      void main() {          
          vec3 view = vDirection;
      
          vec4 noise = 0.5 + 0.5 * compound4(
            0.1 * compound4(vec4(view, 0.0)));
          float intensity = length(noise) * 0.7;
          
          float red = pow(intensity, 1.1);
          float green = pow(intensity, 0.3);
          float blue = 0.5 + 0.1 * noise.b;
          
          vec3 col = vec3(red, min(red, green), 0);
       
          gl_FragColor = vec4(col.rgb, 1.0) * viewDot;
      }
      `,

      depthWrite: true,
      depthTest: true,
      blending: THREE.NormalBlending,
      side: THREE.FrontSide,
    });

    return material;
  }

}