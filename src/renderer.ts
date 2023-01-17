import {Square,Piece,COLOR,RULESET} from "../src/game";

// TODO: Add support for sprites. Currently just have colored text to denote pieces and solid colored backgrounds.

// These types help specify the RENDERER's API, and must be updated as specified in RENDERER under "//CURRENT DRAWERS"
type pieceDrawerOptions = "Text"|"Sprites";
type boardDrawerOptions = "Solid";

// The RENDERER draw()-s to the canvas whenever given GAME data by the PAGE.
// The drawing is done board-first, pieces-second by the "currentBoardDrawer" and "currentPieceDrawer" components respectively.
// The user can swap out drawers mid-game by changing styles in the game UI.
// The RENDERER keeps a list of options and reports them through the PAGE to the UI for button construction and listener-making.
export class RENDERER{
    CTX:CanvasRenderingContext2D;
    sqDim:number;
    // True => canvas | False => console
    renderEnabled:boolean;

    // CURRENT DRAWERS
    // When a new option for a current(X)Drawer's type is made possible, the following must be updated:
    //  1) The types "(X)DrawerOptions" above,
    //  2) The functions "get(X)DrawerOptions" and "set(X)Drawer" below.
    currentPieceDrawer: textPieceDrawer | spriteSheetPieceDrawer;
    curPDrawerType:pieceDrawerOptions;

    currentBoardDrawer: solidBoardDrawer;
    curBDrawerType:boardDrawerOptions;

    getPieceDrawerOptions():pieceDrawerOptions[]{
        return ["Text","Sprites"];
    }

    getBoardDrawerOptions():boardDrawerOptions[]{
        return ["Solid"];
    }

    // The switch statements below have no default case intentionally.
    // It may be the case that the type (X)DrawerOptions changes without the change being accounted for here.
    // If a "default" case exists, VSCode fails to spot the inconsistency, and will not prompt you to change this method.
    setBoardDrawer(label:boardDrawerOptions):boolean{
        switch(label){
            case("Solid"): 
                this.currentBoardDrawer = new solidBoardDrawer(this);
                this.curBDrawerType = "Solid";
                return true;
        }
    }

    setPieceDrawer(label:pieceDrawerOptions):boolean{
        switch(label){
            case("Text"): 
                this.currentPieceDrawer = new textPieceDrawer(this);
                this.curPDrawerType = "Text";
                return true;
            case("Sprites"):
                this.currentPieceDrawer = new spriteSheetPieceDrawer(this);
                this.curPDrawerType = "Sprites";
                return true;
        }
    }


    constructor(sqDim:number, CTX: CanvasRenderingContext2D){
        this.renderEnabled = false;
        this.CTX = CTX;
        this.sqDim= 20;
        this.curBDrawerType = "Solid";
        this.currentBoardDrawer = new solidBoardDrawer(this);
        this.curPDrawerType = "Text";
        this.currentPieceDrawer = new textPieceDrawer(this);
    }



    draw(board:Square[][] , selectedPieceLegalMoves:boolean[][]){
        if(this.renderEnabled === false){
            this.drawToConsole(board,selectedPieceLegalMoves);
        }
        else{
            this.currentBoardDrawer.draw(selectedPieceLegalMoves);
            this.drawSprites(board);
        }
          
    }

    drawSprites(board: Square[][]):void{
        let [xCo,yCo] = [0,0];
        let curSquare:Square;``
        for(let x = 0 ; x < 8; x++){
            for(let y = 0 ; y < 8; y++){
                [xCo,yCo] = this.boardToCanvasCoordTransform(x,y);
                curSquare = board[x][y];
                if(curSquare != "EMPTY"){
                    this.currentPieceDrawer.drawSpriteAt(xCo,yCo, curSquare);
                }
            }   
        }
    }


    drawToConsole(board:Square[][] , selectedPieceThreats:boolean[][]){
        let curSquare:Square;
        let [curHorizontalSlice, curLetter] = ["",""];
        for(var y = 7; y>=0 ; y-- ){
            for(var x = 0 ; x<8 ; x++ ){
                curSquare = board[x][y];
                if(curSquare === "EMPTY"){
                    curLetter = "X";
                } else{
                    curLetter=this.getLetterFromPiece(curSquare);
                    if(curSquare.color === "B"){
                        curLetter= curLetter.toLowerCase();
                    }
                }
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

    boardToCanvasCoordTransform(squareX: number, squareY:number):number[]{
        return [this.sqDim*squareX, this.sqDim*(8-squareY)];
    }

    getSqDim():number{
        return this.sqDim;
    }

    getCTX():CanvasRenderingContext2D{
        return this.CTX;
    }

    getLetterFromPiece(piece:Piece) : string{
        switch(piece.ruleSet){
            case("KING"): return "K";
            case("QUEEN"): return "Q";
            case("ROOK"): return "R";
            case("BISHOP"): return "B";
            case("KNIGHT"): return "N";
            case("PAWN"): return "P";
        }
    }

}



//
// SPRITE
//
// DRAWERS 
//
// BEGIN
//

abstract class pieceSpriteDrawer<SpriteData>{
    parent: RENDERER;
    constructor(parent:RENDERER){
        this.parent = parent;
    }

    getSprite(piece:Piece):SpriteData{
        switch(piece.color){
            case("W"): return this.getWhiteSprite(piece);
            case("B"): return this.getBlackSprite(piece);
        }
    }

    abstract drawSpriteAt(xCo : number, yCo:number, sprite :Piece) : void;
    abstract getWhiteSprite(piece: Piece ): SpriteData;
    abstract getBlackSprite(piece: Piece ): SpriteData;

}



// Text Sprites are two-entry string arrays
//      0: A char representation of a Piece 
//      1: A CSS color value for the text
type textSprite = {spriteChar:string, spriteColor:string};
class textPieceDrawer extends pieceSpriteDrawer<textSprite>{

    constructor(parent:RENDERER){
        super(parent);
    }

    drawSpriteAt(xCo: number, yCo: number, piece: Piece): void {
        let CTX = this.parent.getCTX();
        let sqDim = this.parent.getSqDim();
        let sprite:textSprite = this.getSprite(piece);
        CTX.fillStyle = sprite.spriteColor;
        CTX.fillText(sprite.spriteChar,xCo,yCo);
    }

    getWhiteSprite(piece: Piece): textSprite {
        return {spriteChar: this.parent.getLetterFromPiece(piece), spriteColor:"white"};
    }

    getBlackSprite(piece: Piece): textSprite {
        let pieceLetter = this.parent.getLetterFromPiece(piece);
        return {spriteChar:pieceLetter.toLowerCase(), spriteColor:"black"};
    }

}

type spriteSheetCoordinates = [xBL:number,yBL:number,width:number, height:number ];

class spriteSheetPieceDrawer extends pieceSpriteDrawer<spriteSheetCoordinates>{
        drawSpriteAt(xCo: number, yCo: number, sprite: Piece): void {
        }

        getBlackSprite(piece: Piece): spriteSheetCoordinates {
            return [0,0,0,0];
        }
        getWhiteSprite(piece: Piece): spriteSheetCoordinates {
            return [0,0,0,0];
        }
}


//
// BOARD
//
// DRAWERS 
//
// BEGIN
//

abstract class boardSpriteDrawer{
    parent : RENDERER; 
    evenCheckerSprite: string="";
    oddCheckerSprite:string="";
    selectedCheckerSprite:string="";

    constructor(parent:RENDERER){
        this.parent = parent;
    }
    
    abstract draw(selectedPieceThreats:boolean[][] ):void;

    BGSpriteAtXYGivenThreats(x:number,y:number, selectedPieceThreats:boolean[][]){
        if(selectedPieceThreats[x][y]) return this.selectedCheckerSprite;
        if(x+y%2 == 0) return this.evenCheckerSprite;
        return this.oddCheckerSprite;
    }

}



class solidBoardDrawer extends boardSpriteDrawer{

    constructor(parent:RENDERER){
       super(parent);
       this.evenCheckerSprite = "beige";
       this.oddCheckerSprite = "brown";
       this.selectedCheckerSprite = "grey"; 
    }
    
    draw(selectedPieceThreats:boolean[][]){
        let CTX = this.parent.getCTX();
        let sqDim = this.parent.getSqDim();
        let [bgcolor,xCo,yCo] = ["",0,0];
        for(var x = 0; x<8 ; x++ ){
            for(var y = 0 ; y<8 ; y++ ){
                bgcolor = this.BGSpriteAtXYGivenThreats(x,y,selectedPieceThreats);
                CTX.fillStyle = bgcolor;
                [xCo,yCo] = this.parent.boardToCanvasCoordTransform(x,y);
                CTX.fillRect(xCo,yCo,sqDim,sqDim);
            }
        }
    }
}
