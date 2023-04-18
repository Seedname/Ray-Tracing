precision mediump float;

uniform vec2 u_resolution;
uniform float u_fov;
uniform vec3 u_cameraPos;
uniform vec3 u_cameraDir;
uniform sampler2D u_accumulatedColors;
uniform sampler2D u_samplesPerPixel;
uniform float u_width;
uniform float u_height;

struct Ray {
    vec3 origin;
    vec3 direction;
};

vec3 trace(Ray ray);

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    float aspectRatio = u_width / u_height;
    float focalLength = (0.5 * u_width) / tan((u_fov / 2.0) * 3.14159265359 / 180.0);

    vec2 screenPos = vec2(2.0 * uv.x - 1.0, 1.0 - 2.0 * uv.y);
    vec3 rayDir = vec3(screenPos.x * tan(u_fov / 2.0 * 3.14159265359 / 180.0) * aspectRatio, screenPos.y * tan(u_fov / 2.0 * 3.14159265359 / 180.0), -focalLength);
    rayDir = normalize(rayDir - u_cameraPos);

    Ray ray = Ray(u_cameraPos, rayDir);
    vec3 clr = trace(ray);

    vec2 index = gl_FragCoord;
    vec3 accumulatedColor = texture2D(u_accumulatedColors, uv).rgb;
    float samples = texture2D(u_samplesPerPixel, uv).r;
    samples += 1.0;

    accumulatedColor += clr;
    vec3 avgColor = accumulatedColor / samples;

    gl_FragColor = vec4(avgColor, 1.0);
}