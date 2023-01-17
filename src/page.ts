import {Square,GAME} from "./game";
import {RENDERER} from "./renderer";

let squareCanvasDim=800;

let CVS:HTMLCanvasElement = document.createElement("canvas") as HTMLCanvasElement;
document.body.appendChild(CVS);
let CTX:CanvasRenderingContext2D|null=CVS.getContext("2d");
if(CTX){
    start(CTX); 
}

function start(CTX:CanvasRenderingContext2D): void{
    let game = new GAME();
    let board : Square[][] = game.getBoard(); 
    let rend = new RENDERER(squareCanvasDim/8,CTX);
    rend.draw(board,[[false]]);
}
