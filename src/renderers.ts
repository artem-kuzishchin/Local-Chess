import {Piece} from "./game";


// Abstractions Used:

export abstract class pieceDrawer<SpriteData>{


    getSprite(piece:Piece):SpriteData{
        switch(piece.color){
            case("W"): return this.getWhiteSprite(piece);
            case("B"): return this.getBlackSprite(piece);
        }
    }

    abstract draw(pieces:Piece[], CTX:CanvasRenderingContext2D, cvsDim:number) : void;
    abstract getWhiteSprite(piece: Piece ): SpriteData;
    abstract getBlackSprite(piece: Piece ): SpriteData;

}

export abstract class boardDrawer {

    evenCheckerSprite: string="";
    oddCheckerSprite:string="";
    selectedCheckerSprite:string="";

    
    abstract draw(selectedPieceThreats:boolean[][] , CTX:CanvasRenderingContext2D, cvsDim:number ):void;

    BGSpriteAtXYGivenThreats(x:number,y:number, selectedPieceThreats:boolean[][]){
        if(selectedPieceThreats[x][y]){return this.selectedCheckerSprite;}
        if(x%2 == y%2){ return this.evenCheckerSprite;}
        return this.oddCheckerSprite;
    }

}

export type SpriteData = textSprite | spriteSheetCoordinates;

// Text Sprites are two-entry string arrays
//      0: A char representation of a Piece 
//      1: A CSS color value for the text
type textSprite = {spriteChar:string, spriteColor:string};
export class textPieceDrawer extends pieceDrawer<textSprite>{

    constructor(){
        super();
    }

    draw(pieces: Piece[], CTX:CanvasRenderingContext2D, cvsDim:number): void {
        let sprite:textSprite = {spriteChar:"",spriteColor:""};
        let [xCo,yCo] = [0,0];
        let sqSize = Math.floor(cvsDim/8);
        CTX.font = `${Math.floor(sqSize/2)}px Arial`
        let offset = 1/3;

        for(let piece of pieces){
            sprite = this.getSprite(piece);
            xCo = sqSize*(piece.x+offset);
            yCo = sqSize*(8-(piece.y+offset));
            if(sprite.spriteColor == "white"){
                CTX.strokeStyle = 'black';
                CTX.lineWidth = 8;
                CTX.strokeText(sprite.spriteChar, xCo, yCo);
            }
            
            CTX.fillStyle = sprite.spriteColor;
            CTX.fillText(sprite.spriteChar,xCo,yCo);
            
        }

    }

    getWhiteSprite(piece: Piece): textSprite {
        return {spriteChar: getLetterFromPiece(piece), spriteColor:"white"};
    }

    getBlackSprite(piece: Piece): textSprite {
        return {spriteChar:getLetterFromPiece(piece), spriteColor:"black"};
    }


}

type spriteSheetCoordinates = [xBL:number,yBL:number,width:number, height:number ];

export class spriteSheetPieceDrawer extends pieceDrawer<spriteSheetCoordinates>{

        draw( sprite: Piece[], CTX:CanvasRenderingContext2D, sqDim:number): void {
        }

        getBlackSprite(piece: Piece): spriteSheetCoordinates {
            return [0,0,0,0];
        }
        getWhiteSprite(piece: Piece): spriteSheetCoordinates {
            return [0,0,0,0];
        }

        pieceDrawingCoordinateTransform(squareX: number, squareY: number): number[] {
            return [0,0];
        }
}



export class solidBoardDrawer extends boardDrawer{

    constructor(){
        super();
        this.evenCheckerSprite = "beige";
        this.oddCheckerSprite = "brown";
        this.selectedCheckerSprite = "grey"; 
    }
    
    draw(selectedPieceThreats:boolean[][],CTX:CanvasRenderingContext2D,cvsDim:number){
        let [bgcolor,xCo,yCo] = ["",0,0];
        let sqDim = cvsDim/8;
        for(var x = 0; x<8 ; x++ ){
            for(var y = 0 ; y<8 ; y++ ){
                bgcolor = this.BGSpriteAtXYGivenThreats(x,y,selectedPieceThreats);
                CTX.fillStyle = bgcolor;
                xCo = x*sqDim;
                yCo = (7-y)*sqDim;
                CTX.fillRect(xCo,yCo,sqDim,sqDim);
            }
        }
    }
}


export function getLetterFromPiece(piece:Piece) : string{
    let s = piece.ruleSet.slice(0,1);
    if(piece.ruleSet == "KNIGHT"){
        s= "N";
    }
    if(piece.color == "B"){
        s = s.toLowerCase();
    }
    return s;
}


