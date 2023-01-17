export type RULESET= "QUEEN" | "KING" | "KNIGHT" | "PAWN" | "BISHOP" | "ROOK";
export type COLOR = "W" | "B";

export type Piece = {
    ruleSet :RULESET;
    color: COLOR;
}  

export type Square = Piece | "EMPTY";

type xyLocation = {x:number , y:number};

export class GAME {
   
    // NECESSARY DATA STRUCTURES:

    private board:Square[][];

    private turn: COLOR = "W";


    constructor(){
        this.board= Array.from(Array(8),()=>Array(8).fill("EMPTY"));
        this.initStartPosition();
        this.turn = "W";
    }

    private initStartPosition(){
        this.initPawns();
        this.initMinorPieces();
        this.initRoyalty();
    }

    private initPawns(){
        for(let i = 0; i <8 ; i++){
            this.setPieceAt(i,1,"PAWN","W");
            this.setPieceAt(i,6,"PAWN","B");
        }
    }

    private initMinorPieces(){
        let minorPieces :RULESET[]= ["ROOK","KNIGHT","BISHOP"];
        minorPieces.forEach((ruleset,index)=>{
            this.setPieceAt(index,0,ruleset,"W");
            this.setPieceAt(index,7,ruleset,"B");
            this.setPieceAt(7-index,0,ruleset,"W");
            this.setPieceAt(7-index,7,ruleset,"B");
        },this);
    }

    private initRoyalty(){
        this.setPieceAt(3,0,"QUEEN","W");
        this.setPieceAt(3,7,"QUEEN","B");
        this.setPieceAt(4,0,"KING","W");
        this.setPieceAt(4,7,"KING","B");
    }

    private setPieceAt(x:number,y:number, newRuleSet:RULESET, newColor: COLOR){
        let piece : Piece = {ruleSet: newRuleSet, color: newColor}; 
        this.board[x][y] = piece;
    }

    private clearSquareAt(x:number,y:number){
        this.board[x][y] = "EMPTY";
    }


    getBoard() : Square[][] {
        return this.board;
    }
    
    
    legalMovesByWhatIs(atSquare:xyLocation):boolean[][]{
        let piece :Square = this.board[atSquare.x][atSquare.y];
        if( piece === "EMPTY" ){
            return this.getCleanThreatBoard();
        }
        return this.getLegalMovesOf(piece,atSquare);
    }

    getLegalMovesOf(piece:Piece,atSquare:xyLocation):boolean[][]{
        return this.getCleanThreatBoard();
        // let candidateMoves:boolean[][] = this.getMovespaceOf(piece,atSquare);
        // for each true (x,y) in candidateMoves
        //      if moveInducesCheck(atSquare,(x,y))
        //      if(piece is king) - check that you arent castling through threatened squares
        //return candidatemoves
    }

    private candidateMoveIsLegal(piece:Piece, origin:xyLocation, target:xyLocation){
        // create copy of board with candidate move on it,
        // then examine whether the king is in check after.
        // 
    }

    private getMovespaceOf(piece:Piece,atSquare:xyLocation):boolean[][]{
        switch(piece.ruleSet){
            case("QUEEN"): return this.queenMovespace( atSquare);
            case("KING"): return this.kingMovespace(piece.color, atSquare);
            case("KNIGHT"): return this.knightMovespace( atSquare);
            case("BISHOP"): return this.bishopMovespace( atSquare);
            case("ROOK"): return this.rookMovespace( atSquare);
            case("PAWN"): return this.pawnMovespace( atSquare);

        }
    }

    private queenMovespace(atSquare:xyLocation):boolean[][]{
        return this.getCleanThreatBoard();
    }

    private bishopMovespace(atSquare:xyLocation):boolean[][]{
        return this.getCleanThreatBoard();
    }
    private rookMovespace(atSquare:xyLocation):boolean[][]{
        return this.getCleanThreatBoard();
    }

    private pawnMovespace(atSquare:xyLocation):boolean[][]{
        // if(this.enPassantPossibleForThePawn(atSquare))
        return this.getCleanThreatBoard();
    }
    private knightMovespace(atSquare:xyLocation):boolean[][]{
        return this.getCleanThreatBoard();
    }
    private kingMovespace(color:COLOR ,atSquare:xyLocation):boolean[][]{
        // castlerights check
        return this.getCleanThreatBoard();
    }


    private isThereAThreatAt(xy:xyLocation, forPlayer : COLOR):boolean{
        return false;
    }


    private getCleanThreatBoard(){
        return Array.from(Array(8),()=>Array(8).fill(false));
    }

}