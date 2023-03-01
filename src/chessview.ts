import { ChessController } from "./controller";
import {Square, Piece} from "./game";

import{textPieceDrawer, SpriteData, solidBoardDrawer, getLetterFromPiece, boardDrawer,pieceDrawer } from "./renderers"

export class ChessView {
    controller: ChessController;

    renderEnabled:boolean;
    pieceRend: pieceDrawer<SpriteData>;
    boardRend: boardDrawer;
    
    CTX:CanvasRenderingContext2D;
    cvsDim:number;

    constructor(cvsDim:number, controller: ChessController){
        this.controller = controller;
        this.renderEnabled = true;
        this.cvsDim = cvsDim;
        this.pieceRend = new textPieceDrawer();
        this.boardRend = new solidBoardDrawer();
        

        let root = document.getElementById("root") as HTMLElement;
        let CVS : HTMLCanvasElement = document.createElement("canvas");
        CVS.height = cvsDim;
        CVS.width = cvsDim;
        CVS.addEventListener("click", click => this.controller.processInput(click.x , click.y,this.cvsDim));
        root.appendChild(CVS);

        this.CTX = CVS.getContext("2d") as CanvasRenderingContext2D;
    }

    toggleRender(){
        this.renderEnabled = !this.renderEnabled;
    }


    draw(pieces:Piece[] , selectedPieceLegalMoves:boolean[][]){
        this.CTX.clearRect(0,0,this.cvsDim,this.cvsDim);
        if(this.renderEnabled === false){
            this.drawToConsole(pieces,selectedPieceLegalMoves);
        }
        else{
            this.boardRend.draw(selectedPieceLegalMoves, this.CTX, this.cvsDim);
            this.pieceRend.draw(pieces,this.CTX,this.cvsDim);
        }
          
    }


    drawToConsole(pieces:Piece[] , selectedPieceThreats:boolean[][]){
        let board:string[][] = Array.from(Array(8), x => Array.from(Array(8), y=> "-"));
        for ( let piece of pieces){
            board[piece.x][piece.y] = getLetterFromPiece(piece);
        }
        let [curHorizontalSlice, curLetter] = ["",""];
        for(var y = 7; y>=0 ; y-- ){
            for(var x = 0 ; x<8 ; x++ ){
                curLetter=board[x][y];
                
                /*if(selectedPieceThreats[x][y]){
                    curHorizontalSlice = curHorizontalSlice+ "("+curLetter+")";
                } else{
                    curHorizontalSlice += curLetter;
                }*/
                curHorizontalSlice += curLetter;
            }
            console.log(curHorizontalSlice);
            curHorizontalSlice = "";
        }
    }

}

