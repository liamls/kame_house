uniform float uTime;
uniform float uWaveSpeed;
uniform float uWaveAmplitude;

varying vec2 vUv;

void main() {
    vUv = uv;

    float sineOffset = sin(uTime * uWaveSpeed) * uWaveAmplitude;

    vec3 modifiedPosition = position;
    modifiedPosition.z += sineOffset; // Z car le plan est tourné

    gl_Position = projectionMatrix * modelViewMatrix * vec4(modifiedPosition, 1.0);
}
