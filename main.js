function randomPointOnUnitSphere() {
    let theta = Math.random() * 2 * Math.PI;
    let phi = Math.acos(2 * Math.random() - 1);
    return createVector(Math.sin(phi) * Math.cos(theta), Math.sin(phi) * Math.sin(theta), Math.cos(phi));
  }

class Material {
    constructor(color, emitColor, strength, smoothness) {
        this.color = createVector((color[0])/255, (color[1])/255, (color[2])/255);
        this.emitColor = createVector((emitColor[0])/255, (emitColor[1])/255, (emitColor[2])/255);
        this.strength = strength;
        this.smoothness = smoothness;
    }
}
  
class Sphere {
    constructor(x, y, z, r, color, emitColor, strength, smoothness) {
        this.pos = createVector(x, y, z);
        this.r = r;
        this.material = new Material(color, emitColor, strength, smoothness);
    }

    collide(pos, dir) {
        var p = p5.Vector.sub(pos, this.pos);
        var a = dir.dot(dir);
        var b = 2 * p.dot(dir);
        var c = p.dot(p) - this.r * this.r;
        var radicand = b * b - 4 * a * c;
        if (radicand >= 0) {
          var dst = (-b - Math.sqrt(radicand)) / (2 * a);
          if (dst >= 0) {
            let hit = p5.Vector.add(pos, p5.Vector.mult(dir, dst));
            return [dst, hit, p5.Vector.sub(hit, this.pos).normalize()];
          }
        }
      }
}

class Triangle {
    constructor(x1, y1, z1, x2, y2, z2, x3, y3, z3, color, emitColor, strength, smoothness) {
        this.a = createVector(x1, y1, z1);
        this.b = createVector(x2, y2, z2);
        this.c = createVector(x3, y3, z3);
        this.material = new Material(color, emitColor, strength, smoothness);
    }
    
    collide(pos, dir) {
        const EPSILON = 0.000001;
        const edge1 = p5.Vector.sub(this.b, this.a);
        const edge2 = p5.Vector.sub(this.c, this.a);
        const h = p5.Vector.cross(dir, edge2);
        const det = edge1.dot(h);
    
        if (det > -EPSILON && det < EPSILON) {
            return;
        }
    
        const invDet = 1.0 / det;
        const s = p5.Vector.sub(pos, this.a);
        const u = s.dot(h) * invDet;
    
        if (u < 0 || u > 1) {
            return;
        }
    
        const q = p5.Vector.cross(s, edge1);
        const v = dir.dot(q) * invDet;
    
        if (v < 0 || u + v > 1) {
            return;
        }
    
        const t = edge2.dot(q) * invDet;
    
        if (t > EPSILON) {
            const intersectionPoint = p5.Vector.add(pos, p5.Vector.mult(dir, t));
            const normal = p5.Vector.cross(edge1, edge2).normalize();
            return [t, intersectionPoint, normal]
        }
    }
}
class Ray {
    constructor(x, y, z, dx, dy, dz) {
        this.pos = createVector(x, y, z);
        this.dir = createVector(dx, dy, dz);
    }

    collide(objects) {
        var minDist = Infinity;
        var minData = null;
        for (var i = 0; i < objects.length; i++) {
            var collision = objects[i].collide(this.pos, this.dir);
            if (collision && collision[0] < minDist) {
                minDist = collision[0];
                minData = [collision, objects[i].material];
            }
        }
        return minData;
    }

    trace(objects) {
        var light = createVector(0, 0, 0);
        var rayColor = createVector(1, 1, 1);
        for (let i = 0; i < 3; i++) {
          let collision = this.collide(objects);
          if (collision) {
            var c = collision[0];
            this.pos.set(c[1]);
            let normal = c[2];
            let material = collision[1];
            let lightStrength = 1;

            let incoming_ray = this.dir.copy();
            let dot_product = incoming_ray.dot(normal);
            let scaled_normal = p5.Vector.mult(normal, 2 * dot_product);
            let specularRay = p5.Vector.sub(incoming_ray, scaled_normal).normalize();
            let randomDir;
            do {
            randomDir = randomPointOnUnitSphere();
            } while (p5.Vector.dot(randomDir, normal) < 0);
            lightStrength = p5.Vector.dot(normal, randomDir);
            let refractedRay = randomDir.normalize();
            
            this.dir.set(lerp(specularRay.x, refractedRay.x, material.smoothness), lerp(specularRay.y, refractedRay.y, material.smoothness), lerp(specularRay.z, refractedRay.z, material.smoothness));
            let emitted = p5.Vector.mult(material.emitColor, material.strength);
            light.add(p5.Vector.mult(emitted, rayColor));
            rayColor.mult(material.color);
            rayColor.mult(lightStrength * 2);
          } else {
            break;
          }
        }
        return light;
      }
}


let accumulatedColors;
let samplesPerPixel;

var objects = [];


function drawWall(x, y, z, w, h, objects) {
    objects.push(new Triangle(x, y, z, x+w, y+h, z,  x+w, y, z, [0, 0, 255], [0,0,255], 0, 1));
    objects.push(new Triangle(x, y, z, x, y+h, z, x+w, y+h, z, [0, 0, 255], [0,0,255], 0, 1));
}

function setup() {
    createCanvas(400, 400);
    pixelDensity(1);
    accumulatedColors = new Array(width * height * 3).fill(0);
    samplesPerPixel = new Array(width * height).fill(0);
    objects.push(new Sphere(2, -5, 10000, 4, [0,255,255], [0, 255, 255], 0, 0.8));
    objects.push(new Sphere(-0.5, -1.25, 10000-3, 1.5, [255,0,255], [255, 0, 255], 0, 1));

    objects.push(new Sphere(-1.6, 0.6, 10000-4, 1, [255,0,0], [255, 0, 0], 0, 1));
    objects.push(new Sphere(0, 9, 10000-5, 5, [0,0,0], [255, 255, 255], 6, 1));
}

function draw() {
    background(0);
    
    var fov = 70;
    let aspectRatio = width / height;
    let cameraPos = createVector(0, 0, -3000);
    let cameraDir = createVector(0, 0, 0);
    let focalLength = (0.5 * width) / Math.tan((fov / 2) * Math.PI / 180); 
    // let focalLength = 11;
    loadPixels();
    for (let x = 0; x < width; x += 1) {
        for (let y = 0; y < height; y += 1) {
            let normalizedX = (x + 0.5) / width;
            let normalizedY = (y + 0.5) / height;
            let screenX = 2 * normalizedX - 1;
            let screenY = 1 - 2 * normalizedY;
            let cameraX = screenX * Math.tan(fov / 2 * Math.PI / 180) * aspectRatio;
            let cameraY = screenY * Math.tan(fov / 2 * Math.PI / 180);
 
            let rayDir = createVector(cameraX, cameraY, -focalLength);

            rayDir.sub(cameraPos);
            rayDir.normalize();

            var ray = new Ray(cameraPos.x, cameraPos.y, cameraPos.z, rayDir.x, rayDir.y, rayDir.z);
            var clr = ray.trace(objects);
            let index = x + y * width;

            accumulatedColors[index * 3] += clr.x;
            accumulatedColors[index * 3 + 1] += clr.y;
            accumulatedColors[index * 3 + 2] += clr.z;
            samplesPerPixel[index]++;

            let avgColor = [accumulatedColors[index * 3] / samplesPerPixel[index], accumulatedColors[index * 3 + 1] / samplesPerPixel[index], accumulatedColors[index * 3 + 2] / samplesPerPixel[index]];

            let pixelIndex = index * 4;
            pixels[pixelIndex] = 255 * avgColor[0];
            pixels[pixelIndex + 1] = 255 * avgColor[1];
            pixels[pixelIndex + 2] = 255 * avgColor[2];
        }
    }
    updatePixels();
    let a = get(0, 0, width, height);
    image(a, 0, 0);
    filter(BLUR, 10-frameCount)
    
}
