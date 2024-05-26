uniform vec3 iResolution;
uniform float iTime;
uniform vec4 iMouse;
varying vec2 vUv;

float mod_emu(float x, float y) {
    return x - y * floor(x / y);
}

float f_N21(vec2 p) {
    vec3 a = fract(p.xyx * vec3(213.897, 653.453, 253.098));
    a += dot(a, a.yzx + 79.76);
    return fract((a.x + a.y) * a.z);
}

vec2 f_GetPos(vec2 id, vec2 offs, float t) {
    float n = f_N21(id + offs);
    float n1 = fract(n * 10.0);
    float n2 = fract(n * 100.0);
    float a = t + n;
    return offs + vec2(sin(a * n1), cos(a * n2)) * 0.4;
}

float f_df_line(vec2 a, vec2 b, vec2 p) {
    vec2 pa = p - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h);
}

float f_line(vec2 a, vec2 b, vec2 uv) {
    float r1 = 0.04;
    float r2 = 0.01;
    float d = f_df_line(a, b, uv);
    float d2 = length(a - b);
    float fade = smoothstep(1.5, 0.5, d2);
    fade += smoothstep(0.05, 0.02, abs(d2 - 0.75));
    return smoothstep(r1, r2, d) * fade;
}

float f_NetLayer(vec2 st, float n, float t) {
    vec2 id = floor(st) + n;
    st = fract(st) - 0.5;
    vec2 p[9];
    int i = 0;
    for (float y = -1.0; y <= 1.0; y++) {
        for (float x = -1.0; x <= 1.0; x++) {
            p[i++] = f_GetPos(id, vec2(x, y), t);
        }
    }
    float m = 0.0;
    for (int i = 0; i < 9; i++) {
        m += f_line(p[4], p[i], st);
    }
    m += f_line(p[1], p[3], st);
    m += f_line(p[1], p[5], st);
    m += f_line(p[7], p[5], st);
    m += f_line(p[7], p[3], st);
    float sPhase = (sin(t + n) + sin(t * 0.1)) * 0.25 + 0.5;
    sPhase += pow((sin(t * 0.1) * 0.5 + 0.5), 50.0) * 5.0;
    m *= sPhase;
    return m;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord.xy / iResolution.xy) * 2.0 - 1.0;
    uv.x *= iResolution.x / iResolution.y;
    vec2 M = (iMouse.xy / iResolution.xy) - 0.5;
    float t = iTime * 0.1;
    float s = sin(t);
    float c = cos(t);
    mat2 rot = mat2(c, -s, s, c);
    vec2 st = uv * rot;
    M = M * rot * 2.0;
    float m = 0.0;
    for (float i = 0.0; i < 1.0; i += 0.25) {
        float z = fract(t + i);
        float size = mix(15.0, 1.0, z);
        float fade = smoothstep(0.0, 0.6, z) * smoothstep(1.0, 0.8, z);
        m += fade * f_NetLayer(st * size - M * z, i, iTime);
    }
    vec3 col = vec3(1.0) * m;
    col *= 1.0 - dot(uv, uv);
    t = mod(iTime, 230.0);
    col *= smoothstep(0.0, 20.0, t) * smoothstep(224.0, 200.0, t);
    fragColor = vec4(col, 0.6); // Set alpha for transparency
}

void main() {
    mainImage(gl_FragColor, vUv * iResolution.xy);
}
