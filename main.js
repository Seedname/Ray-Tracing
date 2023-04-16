class Material {
    constructor(color, emitColor, strength) {
        this.color = createVector((color[0])/255, (color[1])/255, (color[2])/255);
        this.emitColor = createVector((emitColor[0])/255, (emitColor[1])/255, (emitColor[2])/255);
        this.strength = strength;
    }
}
  
class Sphere {
    constructor(x, y, z, r, color, emitColor, strength) {
        this.pos = createVector(x, y, z);
        this.r = r;
        this.material = new Material(color, emitColor, strength);
    }

    collide(pos, dir) {
        var p = p5.Vector.sub(pos, this.pos);
        var a = dir.dot(dir);
        var b = 2 * p.dot(dir);
        var c = p.dot(p) - this.r*this.r;
    
        var radicand = b * b - 4 * a * c;
        if (radicand >= 0) {
            var dst = (-b - Math.sqrt(radicand)) / (2 * a);
            if (dst >= 0) {
                let hit = p5.Vector.add(pos, p5.Vector(dir, dst));
                return [dst, hit, p5.Vector.sub(hit, this.pos).normalize()];
            }
        }
    }
}

class Ray {
    constructor(x, y, z, angle1, angle2) {
        this.pos = createVector(x, y, z);
        this.dir = createVector(cos(radians(angle1)), sin(radians(angle2)), 1);
        this.dir.normalize();
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
                this.dir.add(normal);
                this.dir.normalize();

                let material = collision[1];
                let emitted = p5.Vector.mult(material.emitColor, material.strength);
                light.add(p5.Vector.mult(emitted, rayColor));
                rayColor.mult(material.color);
            } else {
                break;
            }
        } 
        return light;
    }
}

function preload() {

}

function setup() {
    createCanvas(600, 600);

    var objects = [];
    objects.push(new Sphere(250, 300, 250, 20, [255, 0, 0], [255, 0, 0], 0.5));
    objects.push(new Sphere(300, 300, 200, 50, [0, 0, 0], [255, 255, 255], 1));
    
    var fov = 10;

    loadPixels(); 
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        var ray = new Ray(x-width/2, y, 0, random(-fov/2, fov/2), random(-fov/2, fov/2));
        var clr = ray.trace(objects);
        let index = (x + y * width) * 4; 
        pixels[index] =     255*clr.x;
        pixels[index + 1] = 255*clr.y;
        pixels[index + 2] = 255*clr.z;
        pixels[index + 3] = 255;
      }
    }
    updatePixels(); 
}

