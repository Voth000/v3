export const simulationVertexShader = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const simulationFragmentShader = `
precision mediump float;

uniform sampler2D textureA;
uniform vec2 mouse;
uniform vec2 resolution;
uniform float time;
uniform int frame;

varying vec2 vUv;

const float deltaBase = 0.72;

void main() {
    vec2 uv = vUv;

    if (frame == 0) {
        gl_FragColor = vec4(0.0);
        return;
    }

    vec4 data = texture2D(textureA, uv);
    float pressure = data.x;
    float pVel = data.y;

    float isMobile = step(500.0, resolution.x); // 0 on mobile, 1 on desktop
    float scale = mix(2.0, 8.0, isMobile); // 2 on mobile, 8 on desktop
    vec2 texelSize = scale / resolution;
    float delta = deltaBase * mix(0.6, 1.0, isMobile); // 0.72 on mobile, 1.2 on desktop

    // Horizontal neighbors only for mobile performance
    vec2 offset = vec2(texelSize.x, 0.0);
    float left = texture2D(textureA, uv - offset).x;
    float right = texture2D(textureA, uv + offset).x;

    // Approximate vertical with same values to reduce reads
    float up = right;
    float down = left;

    float dH = right + left - 2.0 * pressure;
    float dV = up + down - 2.0 * pressure;

    pVel += delta * 0.25 * (dH + dV);
    pressure += delta * pVel;

    pVel -= 0.005 * delta * pressure;
    pVel *= 1.0 - 0.002 * delta;
    pressure *= 0.999;

    // Ripple initialization
    if (frame < 2) {
        vec2 deltaUV = uv - 0.5;
        float distSq = dot(deltaUV, deltaUV);
        if (distSq < 0.25) {
            pressure += 2.5 * (1.0 - distSq * 2.0);
        }
    }

    // Mouse interaction
    if (mouse.x > 0.0) {
        vec2 mouseUV = mouse / resolution;
        vec2 diff = uv - mouseUV;
        float distSq = dot(diff, diff);
        if (distSq < 0.0004) {
            float dist = sqrt(distSq);
            float softness = smoothstep(0.02, 0.005, dist);
            pressure += 1.2 * softness;
        }
    }

    gl_FragColor = vec4(pressure, pVel, (right - left) * 0.5, (up - down) * 0.5);
}
`;


export const renderVertexShader = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const renderFragmentShader = `
precision mediump float;

uniform sampler2D textureA;
uniform float time;

varying vec2 vUv;

const vec3 customGreen = vec3(0.7, 1.0, 0.3);
const vec3 customBlue = vec3(1.0, 0.5, 0.6);

void main() {
    vec4 data = texture2D(textureA, vUv);
    vec3 normal = normalize(vec3(-data.z, 0.2, -data.w));

    float t = time * 3.0;
    vec2 timeOffset = 0.00014 * vec2(sin(t), sin(t * 0.43));

    vec2 offset = normal.xz;
    vec2 offsetG = 0.024 * offset - timeOffset;
    vec2 offsetB = 0.022 * offset + timeOffset;

    // Cache texture reads
    float g = texture2D(textureA, vUv + offsetG).g;
    float b = texture2D(textureA, vUv + offsetB).b;

    vec3 rippleColor = g * customGreen + b * customBlue;
    float alpha = max(g, b) * 0.9;

    gl_FragColor = vec4(rippleColor, alpha);
}
`;
