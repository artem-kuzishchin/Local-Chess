export type RULESET= "QUEEN" | "KING" | "KNIGHT" | "PAWN" | "BISHOP" | "ROOK";
export type COLOR = "W" | "B";

export type Piece = {
    ruleSet :RULESET;
    color: COLOR;
    x:number;
    y:number;
}  

export type Square = Piece | "EMPTY";

export type numPair = {x:number , y:number};

class Player {
    king: Piece;
    subjects: Piece[];
    hasKingsideCastleRights:boolean = true;
    hasQueensideCastleRights:boolean = true;
    
    constructor(king:Piece, subjects:Piece[]){
        this.king = king;
        this.subjects = subjects;
    }

    removePiece(piece:Piece){
        this.subjects = this.subjects.filter(subj => !(subj === piece));
    }

    addPiece(piece:Piece){
        if(this.subjects.indexOf(piece)== -1){
            this.subjects.push(piece);
        }
    }

    color():COLOR{
        return this.king.color;
    }
}

export class ChessBoard {
   
    // NECESSARY DATA STRUCTURES:

    private board:Square[][];
    private players : Player[] =[];



//|----------------|
//|-INITIALIZATION-|
//|----------------|

    constructor(){
        this.board= Array.from(Array(8),()=>Array(8).fill("EMPTY"));
        this.players.push(this.initPlayer("W"));
        this.players.push(this.initPlayer("B")); 
    }



    private initPlayer(color:COLOR): Player{
        let kingY = ( color==="W" ? 0 : 7);
        let king =  this.createPieceAt(4,kingY,"KING",color);
        let soldiers = this.makeSoldiers(color);
        return new Player(king,soldiers);
    }


    private makeSoldiers(color:COLOR):Piece[]{
        
        let [pieceRow, pawnRow] = [0,1];
        if(color == "B"){
            [pieceRow,pawnRow] = [7,6];
        } 
        let soldiers :Piece[] = [this.createPieceAt(3,pieceRow,"QUEEN",color)];         
        for(let i = 0; i <8 ; i++){
            soldiers.push(this.createPieceAt(i,pawnRow,"PAWN",color));
        }

        let minorPieces :RULESET[]= ["ROOK","KNIGHT","BISHOP"];
        minorPieces.forEach((ruleset,index)=>{
            soldiers.push(this.createPieceAt(index,pieceRow,ruleset,color));
            soldiers.push(this.createPieceAt(7-index,pieceRow,ruleset,color));
        },this);

        return soldiers;
    }

// |---------------------|
// |-GETTERS AND SETTERS-|
// |---------------------|

    getTestBoard() : Square[][] {
        let deepCopy : Square[][] = Array.from(Array(8), () => Array(8).fill("EMPTY") );
        let square:Square = "EMPTY";
        for (let x = 0; x<8; x++){
            for(let y= 0; y<8 ; y++){
                square = this.board[x][y]; 
                if(square!= "EMPTY"){
                    deepCopy[x][y] = {...square};
                }
            }
        }
        return deepCopy;
    }


    getPlayer(color:COLOR):Player{
        switch(color){
            case("W"): return this.players[0];
            case("B"): return this.players[1];
        }
    }

    getAllPiecesOf(color:COLOR):Piece[]{
        let player = this.getPlayer(color);
        return [...player.subjects, player.king];
    }

    getAllPiecesButKingOf(color:COLOR):Piece[]{
        return [...this.getPlayer(color).subjects];
    }

    getKingOf(color:COLOR):Piece{
        return {...this.getPlayer(color).king};
    }

    getEmptyMoveBoard():boolean[][]{
        return Array.from(Array(8),()=>Array(8).fill(false));
    }


    getSquareAt(coord:numPair):Square{
        return this.board[coord.x][coord.y];
    }

    getAllGamePieces(){
        let p1_pieces = this.getAllPiecesOf("W");
        let p2_pieces = this.getAllPiecesOf("B");
        return p1_pieces.concat(p2_pieces);
    }

    commitMove(piece:Piece,dest:numPair){
        this.board[piece.x][piece.y] = "EMPTY";
        let destSquare = this.board[dest.x][dest.y];
        if( destSquare != "EMPTY"){
            this.clearPiece(destSquare);
        } 
        this.setPieceAt(piece,dest);
    }

    private createPieceAt(x:number,y:number, newRuleSet:RULESET, newColor: COLOR):Piece{
        let piece : Piece = {ruleSet: newRuleSet, color: newColor,x:x,y:y}; 
        this.board[x][y] = piece;
        return piece;
    }

    private setPieceAt(piece: Piece , coord: numPair){
        this.board[coord.x][coord.y] = piece;
        piece = Object.assign(piece,coord);
    }

    private clearPiece(piece:Piece){
        let player = this.getPlayer(piece.color);
        player.removePiece(piece);
        this.board[piece.x][piece.y] = "EMPTY";
    }


    squareIsEmpty(square:numPair):boolean{
        return this.board[square.x][square.y] === "EMPTY";
    }  

    squareHasEnemy(color:COLOR, square:numPair){
        let squareContents = this.board[square.x][square.y];
        if(squareContents === "EMPTY" ){
            return false;
        } else {
            return (color != squareContents.color);
        }
    }




}