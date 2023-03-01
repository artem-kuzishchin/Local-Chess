import {Square, Piece, COLOR, ChessBoard, numPair } from "./game";
import { ChessView } from "./chessview";


type selectedPiece = Piece| "NONE";


export class ChessController {
    private view: ChessView;
    private game:ChessBoard;
    private enPassantTarget: numPair | "NONE" = "NONE";
    private selection:selectedPiece = "NONE";


    private whoseTurn:COLOR = "W";
    private currentPlayersLegalMoves : Map<Piece, boolean[][]>;


    constructor(){
        this.game = new ChessBoard();
        this.view = new ChessView(800, this);

        let whitesPieces = this.game.getAllPiecesOf("W");
        this.currentPlayersLegalMoves = this.calcLegalMoves(whitesPieces);
        this.printMoves();
        this.display();
       
    }


    display(){
        let moves = this.game.getEmptyMoveBoard();
        if(this.selection!= "NONE"){
            moves = this.currentPlayersLegalMoves.get(this.selection) as boolean[][];
        }
        this.view.draw(this.game.getAllGamePieces(), moves);
        
    }

    printMoves(){
        let s = "";
        for (let [key,value] of this.currentPlayersLegalMoves){
            console.log(key);
            s = (key.color=="W" ? key.ruleSet : key.ruleSet.toLowerCase());
            for(let x = 0; x < 8; x++){
                for(let y = 0; y < 8; y++){
                    if(value[x][y]){
                        console.log(`${s} can move to (${x},${y})`);
                    }
                    
                }
            }
        }
    }


    processInput(clickX:number,clickY:number,cvsDim:number){
        
        let sqDim = cvsDim/8;
        let boardCo = { x: Math.floor(clickX/sqDim), 
                        y: 7- Math.floor(clickY/sqDim)};
        
        if(this.selection == "NONE"){
            this.selectSquare(boardCo);
            this.display();
        } else if (this.moveIsLegal(this.selection,boardCo)){
            this.game.commitMove(this.selection, boardCo);
            this.selection= "NONE"
            this.display();
            this.whoseTurn = this.currentOpponent();
            let activePieces = this.game.getAllPiecesOf(this.whoseTurn);
            this.currentPlayersLegalMoves = this.calcLegalMoves(activePieces);
            if(!this.currentPlayerHasLegalMoves()){
                if(this.curPlayerInCheck()){
                    this.handleWin();
                }
                else {
                    this.handleStalemate();
                }  
            }
            
        } else{
            this.selection= "NONE";
        }
        
       
    }

    private calcLegalMoves(pieces:Piece[]): Map<Piece, boolean[][]>{
        let moves = new  Map<Piece, boolean[][]>();
        for (let piece of pieces){
            moves.set(piece,this.getLegalMovesOf(piece));
        }
        return moves;
    }

    private moveIsLegal(piece:Piece, dest:numPair):boolean{
        if(this.currentPlayersLegalMoves.has(piece)){
            let moves = this.currentPlayersLegalMoves.get(piece) as boolean[][];
            return moves[dest.x][dest.y];
        }
        return false;
    }

    private handleWin(){
        console.log(`Player ${this.whoseTurn} wins by checkmate. `);
    }

    private handleStalemate(){
        console.log(`A draw by stalemate.`);
    }

    private handleDrawByInsufficientMaterial(){
        console.log('A draw by insufficient material');
    }

    private curPlayerInCheck():boolean{
        let king :Piece = this.game.getKingOf(this.whoseTurn);
        // ie does the king avoid check by staying still
        return !this.moveAvoidsCheck(king,{x:king.x,y:king.y});

    }


    private currentOpponent():COLOR{
        return (this.whoseTurn === "W" ? "B" :  "W"); 
        
    }

    private currentPlayerHasLegalMoves():boolean{
        let cumulativeSearch = false;
        let pieceHasMoves = false;
        for( let moves of this.currentPlayersLegalMoves.values()){
            // true if any move in "moves" is true
            pieceHasMoves = moves.map( a => a.reduce( (p,c) => p||c ) )
                                 .reduce( (p,c) => p||c );
            cumulativeSearch = cumulativeSearch||pieceHasMoves;

        }
        return cumulativeSearch;
    }
   
    private selectSquare(square:numPair):void{
        let content = this.game.getSquareAt(square);
        if(content != "EMPTY" && content.color == this.whoseTurn){
            this.selection = content;
        }
        if(this.selection!= "NONE"){
            this.view.draw(this.game.getAllGamePieces(), this.currentPlayersLegalMoves.get(this.selection) as boolean[][]);
        }
        
    }


    private getLegalMovesOf(piece:Piece):boolean[][]{

        let candidateMoves:boolean[][] = this.getMovespaceOf(piece);

        candidateMoves = this.inducedCheckFilter(piece,candidateMoves);

        
        if(piece.ruleSet == "KING"){
            let player = this.game.getPlayer(piece.color);
            if(player.hasKingsideCastleRights && this.kingsideCastleCheck(piece)){
                console.log("you can kingside castle");
            }

            if(player.hasQueensideCastleRights && this.queensideCastleCheck(piece)){
                
            }
            
        }

        return candidateMoves;
    }

    private kingsideCastleCheck(king:Piece):boolean { 
        return this.intermediateSquaresCheck(king,[{x:5,y:king.y},{x:6,y:king.y}]);
    }

    private queensideCastleCheck(king:Piece):boolean{
        return this.intermediateSquaresCheck(king,[{x:1,y:king.y},{x:2,y:king.y},{x:3,y:king.y}]);
    }

    private intermediateSquaresCheck(king:Piece, intermediateSquares:numPair[]):boolean{
        let kingCanTraverse :boolean[] = [];
        for(let square of intermediateSquares){
            kingCanTraverse.push( this.game.squareIsEmpty(square) && this.moveAvoidsCheck(king,square) );
        }
        return kingCanTraverse.reduce((canTraverseAllSoFar, canTraverseCurrent) => canTraverseAllSoFar && canTraverseCurrent);
    }

    
    private inducedCheckFilter(piece:Piece, candidateMoves : boolean[][]): boolean[][]{
        for(var x = 0; x< 8; x++){
            for(var y = 0; y< 8; y++){
                if(candidateMoves[x][y]){
                    candidateMoves[x][y] = this.moveAvoidsCheck(piece,{x:x,y:y});
                } 
            }
        }
        return candidateMoves;
    }

    private moveAvoidsCheck(piece:Piece, target:numPair):boolean{
        
        let king = this.game.getKingOf(this.whoseTurn);
        let kingLocation = {x: king.x , y: king.y};

        let opponentsPieces = this.game.getAllPiecesOf(this.currentOpponent());
        // Allowing potential captures.
        opponentsPieces = opponentsPieces.filter( piece => piece.x!=target.x && piece.y != target.y);
        let origin:numPair = {x:piece.x,y:piece.y};
        let testBoard : Square[][] = this.game.getTestBoard();
        let testPiece = {... piece,x:target.x,y:target.y};
        testBoard[origin.x][origin.y] = "EMPTY";
        testBoard[target.x][target.y] = testPiece;
        
        if(piece.ruleSet == "KING"){
            kingLocation = target;
        }

        let curThreats:boolean[][] =[];
        for(let opPiece of opponentsPieces){
            curThreats = this.getMovespaceOf(opPiece);
            if(curThreats[kingLocation.x][kingLocation.y]){
                return false;
            }
        }

        return true;
        
    }


    private getMovespaceOf(piece:Piece):boolean[][]{
        let origin:numPair = {x:piece.x, y:piece.y};
        switch(piece.ruleSet){
            case("QUEEN"): return this.queenThreats(piece.color,origin);
            case("KING"): return this.kingThreats(piece.color,origin);
            case("KNIGHT"): return this.knightThreats(piece.color,origin);
            case("BISHOP"): return this.bishopThreats(piece.color,origin);
            case("ROOK"): return this.rookThreats(piece.color,origin);
            case("PAWN"): return this.combineBoolArrays(this.pawnThreats(piece.color,origin),this.pawnMoves(piece.color,origin));
        }
    }

    private queenThreats(color:COLOR, atSquare:numPair):boolean[][]{
        return this.combineBoolArrays(this.bishopThreats(color,atSquare), this.rookThreats(color, atSquare));
    }

    private combineBoolArrays(a1: boolean[][],a2: boolean[][]): boolean[][]{
        return a1.map( (x,index) =>
            x.map( (y,index2) =>   
                y || a2[index][index2]
            )
        );
    }

    private bishopThreats(color:COLOR, atSquare:numPair):boolean[][]{
        let attackDirections :numPair[] = [{x:1,y:-1},{x:-1,y:1},{x:1,y:1},{x:-1,y:-1}];
        return this.directionalThreatSearch(color,atSquare, attackDirections);
    }

    private rookThreats(color:COLOR, atSquare:numPair):boolean[][]{
        let attackDirections :numPair[] = [{x:1,y:0},{x:-1,y:0},{x:0,y:-1},{x:0,y:1}];
        return this.directionalThreatSearch(color,atSquare, attackDirections);
    }


    // Takes in an array of 2d vectors, each of which is searched along to find threatened squares.
    private directionalThreatSearch(color:COLOR, atSquare:numPair, threatDirections:numPair[]):boolean[][]{
        let threats = this.game.getEmptyMoveBoard();
        let threatenedSquare:numPair = {...atSquare};
        let squareContents :Square = "EMPTY";


        for (let dir of threatDirections){
            for(let length = 1; length <7; length++){
                threatenedSquare.x += dir.x;
                threatenedSquare.y += dir.y;

              

                if(!this.inBounds(threatenedSquare)){
                    break;
                }

                squareContents = this.game.getSquareAt(threatenedSquare);
                if(squareContents!= "EMPTY"){
                    if(squareContents.color === color){
                        break;    
                    }
                    threats[threatenedSquare.x][threatenedSquare.y] = true;
                    break;
                }

                threats[threatenedSquare.x][threatenedSquare.y] = true;
            }

            threatenedSquare = {...atSquare};
        }
        
        return threats;
    }

    private inBounds(sq : numPair):boolean{
        return !(sq.x > 7 || sq.y >7 || sq.x < 0 || sq.y<0);
    }

    

    private pawnThreats(color:COLOR, atSquare:numPair):boolean[][]{
        let threats = this.game.getEmptyMoveBoard();
        let facingDirection: number = 1;
        if(color === "B") facingDirection = -1;
        let threatSquares = [{x:atSquare.x+1, y:atSquare.y+facingDirection},
                             {x:atSquare.x-1, y:atSquare.y+facingDirection} ];

        for (let threat of threatSquares){
            if(this.inBounds(threat)){
                if(this.game.squareHasEnemy(color,threat) || this.EPCheck(threat)){
                    threats[threat.x][threat.y]= true;
                    }
            }
            
        }

        return threats;
       
    }

    private EPCheck(square:numPair):boolean{
        let epTarg = this.enPassantTarget;
        if(epTarg == "NONE"){
            return false;
        } else{
            return (epTarg.x == square.x && epTarg.y == square.y);
        }

    }

    private pawnMoves(color:COLOR, atSquare:numPair):boolean[][]{
        let moves = this.game.getEmptyMoveBoard();
        let facingDirection = 1;
        if(color == "B") facingDirection = -1;

        let curX = atSquare.x;
        let curY = atSquare.y + facingDirection;

        if(this.inBounds({x:curX,y:curY}) && !this.game.squareIsEmpty({x:curX, y:curY})){
            return moves;
        }

        moves[curX][curY] = true;

        curY += facingDirection;

        if(this.inBounds({x:curX,y:curY}) && this.pawnHasNotMoved(color,atSquare) && this.game.squareIsEmpty({x:curX, y:curY}) ){
            moves[curX][curY] = true;
        }

        return moves;
        
    }

    private pawnHasNotMoved(color:COLOR, atSquare:numPair):boolean{
        switch(color){
            case("W"):
                return atSquare.y === 1;
            case("B"):
                return atSquare.y === 6;
        }
    }

    private knightThreats(color:COLOR, atSquare:numPair):boolean[][]{
        let threats = this.game.getEmptyMoveBoard();
        let curThreats : numPair[];
        for(let horizStep = -1; horizStep <=1 ; horizStep+=2){
            for(let vertStep = -1; vertStep <=1 ; vertStep+=2){
                curThreats = [ {x:atSquare.x + 2*horizStep, y: atSquare.y + vertStep },
                               {x:atSquare.x + horizStep, y: atSquare.y + 2*vertStep }];
                for (let square of curThreats){
                    if(this.inBounds(square)){
                        threats[square.x][square.y] = this.canMoveToOrCaptureOn(color,square);
                    }
                    
                }
            }   
        }
        return threats;
    }

    private kingThreats(color:COLOR, atSquare:numPair):boolean[][]{
        let threats = this.game.getEmptyMoveBoard();
        let [curX,curY] = [0,0];
        for(let i = -1 ; i <= 1 ; i++){
            for(let j = -1 ; j <= 1 ; j++){
                curX= atSquare.x + i;
                curY = atSquare.y + j;
                if(this.inBounds({x:curX, y:curY})){
                    threats[curX][curY] = this.canMoveToOrCaptureOn(color, {x:curX, y:curY});
                }
                
            }
        }

        threats[atSquare.x][atSquare.y] = false;
        return threats;
    }

    private canMoveToOrCaptureOn(color:COLOR, square:numPair):boolean{
        let content = this.game.getSquareAt(square);
        if(content != "EMPTY"){
            return (color !=content.color);
        }

        return true;
    }



}
