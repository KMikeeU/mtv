

// Matrix Transformation Visualizer by mikee.dev
// Vanilla JS implementation

class Matrix {
    data;
    name;

    constructor(matrix = [ [1, 0, 0], [0, 1, 0], [0, 0, 1] ], name = "Identity") {
        this.data = matrix;
        this.name = name;
    }

    static getTranslate(x, y){
        return new Matrix([
            [1, 0, x],
            [0, 1, y],
            [0, 0, 1]
        ], `Translate (${x}, ${y})`);
    }

    static getScale(x, y){
        return new Matrix([
            [x, 0, 0],
            [0, y, 0],
            [0, 0, 1]
        ], `Scale (${x}, ${y})`);
    }

    static getRotate(ang){
        let radang = ang * (Math.PI / 180);
        let msin = Math.round(Math.sin(radang) * 100) / 100;
        let mcos = Math.round(Math.cos(radang) * 100) / 100;

        return new Matrix([
            [mcos, -msin, 0],
            [msin, mcos, 0],
            [0, 0, 1]
        ], `Rotate ${ang}`);
    }

    static getIdentity(){
        return new Matrix([
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1]
        ]);
    }

    multiply(matrix){
        let output = [];

        // row
        for (let i = 0; i < this.data.length; i++) {
            output.push([]);
            
            // column
            for (let j = 0; j < matrix.data[i].length; j++) {
                output[i].push(0);

                for(let c = 0; c < this.data[i].length; c++){
                    output[i][j] += this.data[i][c] * matrix.data[c][j];
                }
            }
        }

        return new Matrix(matrix=output);
    }

    toString(){
        let result = "";
        for(let i = 0; i < this.data.length; i++){
            result += this.data[i].join(" ") + "\n";
        }

        return result;
    }
}

class Polygon {
    points;

    constructor(points){
        this.points = points;
    }

    clone(){
        return new Polygon(JSON.parse(JSON.stringify(this.points)));
    }

    transform(matrix){
        for(let i = 0; i < this.points.length; i++){
            let result = matrix.multiply(new Matrix([
                [this.points[i][0]],
                [this.points[i][1]],
                [1]
            ]));
            this.points[i] = [result.data[0][0], result.data[1][0]]
        }
    }
}

class CanvasHelper {
    canvas;
    ctx;
    w;
    h;
    offx = 0;
    offy = 0;

    constructor(canvas){
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");

        this.w = canvas.width;
        this.h = canvas.height;

        this.ctx.lineWidth = 1;

        this.transform();
        this.drawAxis();
    }

    rescale(x, y){
        this.w = x;
        this.h = y;

        this.transform();
    }
    
    transform(){
        this.ctx.transform(1, 0, 0, -1, this.w/2 + this.offx, this.h/2 + this.offy);
    }

    move(x, y) {
        this.offx += x;
        this.offy += y;

        this.transform();
    }

    drawGhost(poly){
        this.draw(poly, "gray")
    }

    draw(polygon, color = "red"){
        this.ctx.strokeStyle = color;
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        
        let first = polygon.points[0];
        this.ctx.moveTo(first[0] * 100, first[1] * 100);
        
        for(let i = 0; i < polygon.points.length; i++){
            let wi = (i + 1) % polygon.points.length;
            this.ctx.lineTo(polygon.points[wi][0] * 100, polygon.points[wi][1] * 100);
        }
        
        
        this.ctx.closePath();
        this.ctx.stroke();
        
        let s = 5;

        for(let i = 0; i < polygon.points.length; i++){
            this.ctx.beginPath();
            this.ctx.ellipse(polygon.points[i][0] * 100, polygon.points[i][1] * 100, s, s, 0, 0, 2* Math.PI);
            this.ctx.closePath();
            this.ctx.fill();
        }
    }

    drawAxis(){
        this.ctx.strokeStyle = "#777";
        
        this.ctx.beginPath();
        this.ctx.moveTo(0, -this.h);
        this.ctx.lineTo(0, this.h);

        this.ctx.moveTo(-this.w, 0);
        this.ctx.lineTo(this.w, 0);

        this.ctx.closePath();
        this.ctx.stroke();
    }

    clear(){
        // Store the current transformation matrix
        this.ctx.save();

        // Use the identity matrix while clearing the canvas
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.w, this.h);

        // Restore the transform
        this.ctx.restore();

        this.drawAxis();
    }
}


let options = {
    optionsElem: document.querySelector(".options"),
    listElem: document.querySelector(".matrices-list"),
    canvas: new CanvasHelper(document.querySelector("canvas#main")),
    poly: new Polygon([
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1]
    ]),
    // canvas: new CanvasHelper(document.querySelector("canvas#main")),

    matrices: [],

    addMatrix(matrix = null){     
        if(matrix === null){
            matrix = Matrix.getIdentity();
        }
        this.matrices.push(matrix);
        
        this.renderDOM();
        this.render();
    },

    deleteMatrix(index){
        let newMatrices = [];

        for(let i = 0; i < this.matrices.length; i++){
            if(i == index){
                continue;
            }

            newMatrices.push(this.matrices[i]);
        }

        this.matrices = newMatrices;
        
        this.renderDOM();
        this.render();
    },

    render(){
        this.canvas.clear();

        this.canvas.drawGhost(this.poly);

        let clone = this.poly.clone();

        for (const matrix of this.matrices) {
            clone.transform(matrix);
        }

        this.canvas.draw(clone, "#e53724");
    },
    
    renderDOM(){
        this.listElem.innerHTML = "";
        for (let m = 0; m < this.matrices.length; m++) {
            let matrix = this.matrices[m];

            let elem = document.createElement("div");
            elem.id = m;

            let label = document.createElement("label");
            label.innerHTML = matrix.name;

            elem.appendChild(label);

            let inputs = document.createElement("div");
            inputs.classList.add("matrix-data");
            
            elem.appendChild(inputs);

            for(let i = 0; i < matrix.data.length; i++){
                for(let j = 0; j < matrix.data[i].length; j++){
                    let inputElem = document.createElement("input");

                    inputElem.pattern = "[0-9\.\-]+"

                    inputElem.value = matrix.data[i][j];
                    inputElem.setAttribute("x", i);
                    inputElem.setAttribute("y", j);
                    inputElem.classList.add("matrix-input");
                    
                    inputElem.addEventListener("keyup", (e) => {
                        let target = e.target;
                        let x = target.getAttribute("x");
                        let y = target.getAttribute("y");

                        this.matrices[target.parentNode.parentNode.id].data[x][y] = target.value;
                        this.render();
                    });

                    inputs.appendChild(inputElem);
                }
            }

            let removeButton = document.createElement("a");
            removeButton.innerHTML = "🗑️";
            removeButton.classList.add("button-remove");
            removeButton.classList.add("button-manage");
            removeButton.onclick = (e) => {
                this.deleteMatrix(e.target.parentElement.parentElement.id);
            }
            
            let upButton = document.createElement("a");
            upButton.innerHTML = "⮝";
            upButton.classList.add("button-up");
            upButton.classList.add("button-manage");
            upButton.onclick = (e) => {
                let id = parseInt(e.target.parentElement.parentElement.id);

                if(id == 0){
                    return;
                }

                let matrix = this.matrices[id-1];
                this.matrices[id-1] = this.matrices[id];
                this.matrices[id] = matrix;
                
                this.renderDOM();
                this.render();
            }


            let downButton = document.createElement("a");
            downButton.innerHTML = "⮟";
            downButton.classList.add("button-down");
            downButton.classList.add("button-manage");
            downButton.onclick = (e) => {
                let id = parseInt(e.target.parentElement.parentElement.id);

                if(id == this.matrices.length - 1){
                    return;
                }

                let matrix = this.matrices[id+1];
                this.matrices[id+1] = this.matrices[id];
                this.matrices[id] = matrix;
                
                this.renderDOM();
                this.render();
            }

            let manageButtons = document.createElement("div");
            manageButtons.classList.add("manage-buttons");

            manageButtons.appendChild(removeButton);
            manageButtons.appendChild(upButton);
            manageButtons.appendChild(downButton);
            
            elem.appendChild(manageButtons);
            
            this.listElem.appendChild(elem);
        }
    }
}


window.onresize = (e) => {
    options.canvas.canvas.width = window.innerWidth;
    options.canvas.canvas.height = window.innerHeight;
    
    options.canvas.rescale(window.innerWidth, window.innerHeight);
    options.render();
}

window.onload = (e) => {
    options.canvas.canvas.width = window.innerWidth;
    options.canvas.canvas.height = window.innerHeight;

    options.canvas.rescale(window.innerWidth, window.innerHeight);

    // Default transform
    options.addMatrix(Matrix.getRotate(45));

    options.renderDOM();
    options.render();
}