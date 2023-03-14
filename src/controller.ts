import {Square, Piece, Color, ChessBoard, numPair } from "./game";
import { ChessView } from "./chessview";


type selectedPiece = Piece| "NONE";
type castleType = "KINGSIDE" | "QUEENSIDE";
type castleReply = "NO" | castleType;


export class ChessController {
    // Renders data to screen
    private view: ChessView;
    // Stores the current gamestate
    private game:ChessBoard;
    // Not "NONE" whenever a pawn has moved two spaces.
    private enPassantTarget: numPair | "NONE" = "NONE";
    private selection:selectedPiece = "NONE";


    private whoseTurn:Color = "W";
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
        let moves = this.getEmptyMoveBoard();
        if(this.selection!= "NONE"){
            moves = this.currentPlayersLegalMoves.get(this.selection) as boolean[][];
        }
        this.view.draw(this.game.getAllGamePieces(), moves);
        console.log("newboy");
        this.printMoves();
        
    }


    processInput(clickX:number,clickY:number,cvsDim:number){
        
        let sqDim = cvsDim/8;
        let boardCo = { x: Math.floor(clickX/sqDim), 
                        y: 7- Math.floor(clickY/sqDim)};
        
        if(this.selection != "NONE" && this.moveIsLegal(this.selection,boardCo)){
            this.commitTurn(this.selection, boardCo);
            
            this.selection= "NONE";
            this.display();
            
            this.advanceTurn();
            
            this.checkEndState();
        } else {
            this.selectSquare(boardCo);
            this.display();
        }
        
    }

    private advanceTurn(){
        this.whoseTurn = this.currentOpponent();
        let activePieces = this.game.getAllPiecesOf(this.whoseTurn);
        this.currentPlayersLegalMoves = this.calcLegalMoves(activePieces);
    }

    private selectSquare(square:numPair):void{
        let content = this.game.getSquareAt(square);
        if(content != "EMPTY" && content.color == this.whoseTurn){
            this.selection = content;
        } else{
            this.selection = "NONE";
        } 
    }

    private checkEndState(){
        if(!this.currentPlayerHasLegalMoves()){
            if(this.curPlayerInCheck()){
                this.handleWin();
            }
            else {
                this.handleStalemate();
            }  
        }

        if(this.insufficientMaterialToMate()){
            this.handleDrawByInsufficientMaterial();
        }
    }
    


    private insufficientMaterialToMate():boolean{
        return false;
    }

    private handleWin(){
        console.log(`Player ${this.currentOpponent()} wins by checkmate. `);
    }

    private handleStalemate(){
        console.log(`A draw by stalemate.`);
    }

    private handleDrawByInsufficientMaterial(){
        console.log('A draw by insufficient material');
    }

    private moveIsLegal(piece:Piece, dest:numPair):boolean{
        if(this.currentPlayersLegalMoves.has(piece)){
            let moves = this.currentPlayersLegalMoves.get(piece) as boolean[][];
            return moves[dest.x][dest.y];
        }
        return false;
    }

    private commitTurn(piece:Piece, boardCo:numPair){
        this.enPassantTarget = "NONE";

        if(piece.ruleSet == "PAWN"){
            this.decideEPFlag(piece,boardCo);
        }

        let playerHasNotCastled = true;
        if(this.game.playerCanCastle(this.whoseTurn)){
            
            if(piece.ruleSet == "KING"){
                let reply = this.moveIsCastles(boardCo);
                if(reply!= "NO"){
                    this.castle(piece,reply);
                    playerHasNotCastled = false;
                }
                this.game.revokeAllCastleRights(this.whoseTurn);
            }

            if(piece.ruleSet == "ROOK" ){
                if(piece.x == 0){
                    this.game.revokeQueensideCastleRights(this.whoseTurn);
                }
                if(piece.x == 7){
                    this.game.revokeKingsideCastleRights(this.whoseTurn);
                }
            }

        }


        if(playerHasNotCastled){
            this.game.commitMove(piece, boardCo);
        }
        
    }

    private castle(king: Piece, castleType: castleType){
        let row = king.color == "W" ? 0:7;
        let [rookHome,kingDest,rookDest] = [0,0,0];
        if(castleType == "KINGSIDE"){
            [rookHome,kingDest,rookDest] = [7,6,5];
        }else{
            [rookHome,kingDest,rookDest] = [0,2,3];
        }
        let rook = this.game.getSquareAt({x:rookHome, y:row}) as Piece;
        this.game.commitMove(king, {x:kingDest,y:row});
        this.game.commitMove(rook, {x:rookDest,y:row});
        
    }


    private moveIsCastles(target:numPair) : castleReply{
        let player = this.game.getPlayer(this.whoseTurn);
        if(target.x == 6 && player.hasKingsideCastleRights){
            return "KINGSIDE";
        }

        if(target.x == 2 && player.hasQueensideCastleRights){
            return "QUEENSIDE";
        }
        return "NO";
    }

    private decideEPFlag(pawn:Piece, target:numPair){
        if(this.pawnHasNotMoved(pawn)){
            let facingDir = pawn.color == "W" ? 1 : -1;
            let startY = pawn.color == "W" ? 1:6;
            let movingTwoSpaces = (target.y == startY+2*facingDir);
            if(movingTwoSpaces){
                this.enPassantTarget = {x:target.x, y: target.y - facingDir};
            }
        }
        
            
        

    }


    private calcLegalMoves(pieces:Piece[]): Map<Piece, boolean[][]>{
        let moves = new  Map<Piece, boolean[][]>();
        for (let piece of pieces){
            moves.set(piece,this.getLegalMovesOf(piece));
        }
        return moves;
    }

    private getLegalMovesOf(piece:Piece):boolean[][]{
        let currentPosition = this.game.getTestBoard();

        let candidateMoves:boolean[][] = this.getMovespaceOf(piece, currentPosition );

        candidateMoves = this.inducedCheckFilter(piece,candidateMoves, currentPosition);

        candidateMoves = this.castleFilter(piece,candidateMoves, currentPosition);
        

        return candidateMoves;
    }





    private curPlayerInCheck():boolean{
        let king :Piece = this.game.getKingOf(this.whoseTurn);
        // ie does the king avoid check by staying still
        return !this.moveAvoidsCheck(king,{x:king.x,y:king.y}, this.game.getTestBoard());

    }


    private currentOpponent():Color{
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
   






    private castleFilter(piece:Piece,threats:boolean[][], position:Square[][]) : boolean[][]{
        if(piece.ruleSet!= "KING"){
            return threats;
        }
        
        let player = this.game.getPlayer(piece.color);
        let [x,y] = piece.color == "W" ? [6,0]: [6,7];
        if(player.hasKingsideCastleRights && this.kingsideCastleCheck(piece, position)){
            threats[x][y] = true;
        }

        [x,y] = piece.color == "W" ? [2,0]: [2,7];
        if(player.hasQueensideCastleRights && this.queensideCastleCheck(piece,position)){
            threats[x][y] = true;
                
        }
            
        return threats;
    }

    private kingsideCastleCheck(king:Piece, position:Square[][]):boolean { 
        return this.intermediateSquaresCheck(king,[{x:5,y:king.y},{x:6,y:king.y}]);
    }

    private queensideCastleCheck(king:Piece, position:Square[][]):boolean{
        return this.intermediateSquaresCheck(king,[{x:1,y:king.y},{x:2,y:king.y},{x:3,y:king.y}]);
    }

    private intermediateSquaresCheck(king:Piece, intermediateSquares:numPair[]):boolean{
        let kingCanTraverse :boolean[] = [];
        for(let square of intermediateSquares){
            kingCanTraverse.push( this.game.squareIsEmpty(square) && this.moveAvoidsCheck(king,square,this.game.getTestBoard()) );
        }
        return kingCanTraverse.reduce((canTraverseAllSoFar, canTraverseCurrent) => canTraverseAllSoFar && canTraverseCurrent);
    }

    
    private inducedCheckFilter(piece:Piece, candidateMoves : boolean[][], position:Square[][]): boolean[][]{
        for(var x = 0; x< 8; x++){
            for(var y = 0; y< 8; y++){
                if(candidateMoves[x][y]){
                    candidateMoves[x][y] = this.moveAvoidsCheck(piece,{x:x,y:y}, position);
                } 
            }
        }
        return candidateMoves;
    }

    private moveAvoidsCheck(piece:Piece, target:numPair, position: Square[][]):boolean{
        
        let king = this.game.getKingOf(this.whoseTurn);
        let kingLocation = {x: king.x , y: king.y};

        let opponentsPieces = this.game.getAllPiecesOf(this.currentOpponent());
        // Allowing potential captures.
        opponentsPieces = opponentsPieces.filter( piece => piece.x!=target.x || piece.y != target.y);
        let origin:numPair = {x:piece.x,y:piece.y};
        let testBoard : Square[][] = this.cloneBoard(position);
        let testPiece = {... piece,x:target.x,y:target.y};
        testBoard[origin.x][origin.y] = "EMPTY";
        testBoard[target.x][target.y] = testPiece;
        
        if(piece.ruleSet == "KING"){
            kingLocation = target;
        }

        let curThreats:boolean[][] =[];
        for(let opPiece of opponentsPieces){
            curThreats = this.getMovespaceOf(opPiece, testBoard);
            if(curThreats[kingLocation.x][kingLocation.y]){
                return false;
            }
        }



        return true;
        
    }


    private getMovespaceOf(piece:Piece,position:Square[][]):boolean[][]{
        switch(piece.ruleSet){
            case("QUEEN"): return this.queenThreats(piece,position);
            case("KING"): return this.kingThreats(piece,position);
            case("KNIGHT"): return this.knightThreats(piece,position);
            case("BISHOP"): return this.bishopThreats(piece,position);
            case("ROOK"): return this.rookThreats(piece,position);
            case("PAWN"): return this.combineBoolArrays(this.pawnThreats(piece,position),this.pawnMoves(piece,position));
        }
    }

    private queenThreats(piece:Piece,position:Square[][]):boolean[][]{
        return this.combineBoolArrays(this.bishopThreats(piece,position), this.rookThreats(piece,position));
    }

    private bishopThreats(piece:Piece,position:Square[][]):boolean[][]{
        let attackDirections :numPair[] = [{x:1,y:-1},{x:-1,y:1},{x:1,y:1},{x:-1,y:-1}];
        return this.directionalThreatSearch(piece,position, attackDirections);
    }

    private rookThreats(piece:Piece,position:Square[][]):boolean[][]{
        let attackDirections :numPair[] = [{x:1,y:0},{x:-1,y:0},{x:0,y:-1},{x:0,y:1}];
        return this.directionalThreatSearch(piece,position, attackDirections);
    }

    // Returns b[i][k] := a1[i][k] || a2[i][k]
    private combineBoolArrays(a1: boolean[][],a2: boolean[][]): boolean[][]{
        return a1.map( (x,index) =>
            x.map( (y,index2) =>   
                y || a2[index][index2]
            )
        );
    }


    // Takes in an array of 2d vectors, each of which is searched along to find threatened squares.
    private directionalThreatSearch(piece:Piece,position:Square[][], threatDirections:numPair[]):boolean[][]{
        let atSquare = {x:piece.x,y:piece.y};
        let threats = this.getEmptyMoveBoard();
        let threatenedSquare:numPair = {...atSquare};
        let squareContents :Square = "EMPTY";


        for (let dir of threatDirections){
            for(let length = 1; length <7; length++){
                threatenedSquare.x += dir.x;
                threatenedSquare.y += dir.y;

              

                if(!this.inBounds(threatenedSquare)){
                    break;
                }

                squareContents = position[threatenedSquare.x][threatenedSquare.y];
                if(squareContents!= "EMPTY"){
                    if(squareContents.color === piece.color){
                        break;    
                    }
                    threats[threatenedSquare.x][threatenedSquare.y] = true;
                    break;
                }

                threats[threatenedSquare.x][threatenedSquare.y] = true;
            }

            threatenedSquare.x = atSquare.x;
            threatenedSquare.y = atSquare.y;
        }
        
        return threats;
    }

    private inBounds(sq : numPair):boolean{
        return !(sq.x > 7 || sq.y >7 || sq.x < 0 || sq.y<0);
    }

    

    private pawnThreats(piece:Piece,position:Square[][]):boolean[][]{
        let atSquare = {x:piece.x,y:piece.y};
        let threats = this.getEmptyMoveBoard();
        let facingDirection = (piece.color == "W" ? 1 : -1);
        let threatSquares = [{x:atSquare.x+1, y:atSquare.y+facingDirection},
                             {x:atSquare.x-1, y:atSquare.y+facingDirection} ];

        for (let threat of threatSquares){
            if(this.inBounds(threat)){
                if(this.positionHasEnemyAt(threat, position) || this.EPCheck(threat)){
                    threats[threat.x][threat.y]= true;
                    }
            }
            
        }

        return threats;
       
    }

    private positionHasEnemyAt(threat:numPair, position:Square[][]) : boolean{
        let square = position[threat.x][threat.y];
        if(square == "EMPTY"){
            return false;
        } else{ 
             return square.color != this.whoseTurn;
        }
        
    }

    private EPCheck(square:numPair):boolean{
        let epTarg = this.enPassantTarget;
        if(epTarg == "NONE"){
            return false;
        } else{
            return (epTarg.x == square.x && epTarg.y == square.y);
        }

    }

    private pawnMoves(pawn:Piece,position:Square[][]):boolean[][]{
        let moves = this.getEmptyMoveBoard();
        let facingDirection = (pawn.color == "W" ? 1 : -1);
        let curSq ={x: pawn.x, y: pawn.y + facingDirection};

        if(this.inBounds(curSq) && !this.squareIsEmpty(curSq,position)){
            return moves;
        }

        moves[curSq.x][curSq.y] = true;
        
        curSq.y += facingDirection;

        if(this.inBounds(curSq)  && this.squareIsEmpty(curSq,position) && this.pawnHasNotMoved(pawn) ){
            moves[curSq.x][curSq.y] = true;
        }

        return moves;
        
    }

    private squareIsEmpty(square:numPair, position: Square[][]):boolean{
        return position[square.x][square.y] == "EMPTY";
    }

    private pawnHasNotMoved(piece:Piece):boolean{
        let color = piece.color;
        let atSquare = {x:piece.x,y:piece.y};
        switch(color){
            case("W"):
                return atSquare.y === 1;
            case("B"):
                return atSquare.y === 6;
        }
    }

    private knightThreats(piece:Piece,position:Square[][]):boolean[][]{
    
        let atSquare = {x:piece.x,y:piece.y};
        let threats = this.getEmptyMoveBoard();
        let curThreats : numPair[];
        for(let horizStep = -1; horizStep <=1 ; horizStep+=2){
            for(let vertStep = -1; vertStep <=1 ; vertStep+=2){
                curThreats = [ {x:atSquare.x + 2*horizStep, y: atSquare.y + vertStep },
                               {x:atSquare.x + horizStep, y: atSquare.y + 2*vertStep }];
                for (let square of curThreats){
                    if(this.inBounds(square)){
                        threats[square.x][square.y] = this.canMoveToOrCaptureOn(piece,square,position);
                    }
                    
                }
            }   
        }
        return threats;
    }

    private kingThreats(piece:Piece,position:Square[][]):boolean[][]{
        
        let threats = this.getEmptyMoveBoard();
        let curSquare = {x:0,y:0};
        for(let i = -1 ; i <= 1 ; i++){
            for(let j = -1 ; j <= 1 ; j++){
                curSquare.x= piece.x + i;
                curSquare.y = piece.y + j;
                if(this.inBounds(curSquare)){
                    threats[curSquare.x][curSquare.y] = this.canMoveToOrCaptureOn(piece,curSquare, position);
                }
                
            }
        }

        threats[piece.x][piece.y] = false;
        return threats;
    }

    private getEmptyMoveBoard():boolean[][]{
        return Array.from(Array(8),()=>Array(8).fill(false));
    }

    private canMoveToOrCaptureOn(piece:Piece, square:numPair, position: Square[][]):boolean{
        let content = position[square.x][square.y];
        if(content != "EMPTY"){
            return (piece.color !=content.color);
        }

        return true;
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

    private cloneBoard(position:Square[][]):Square[][]{
        let newBoard :Square[][]= [];
        let newSquare:Square = "EMPTY";
        let curSquare:Square = "EMPTY";
        for(let x = 0; x < 8; x++){
            newBoard.push([]);
            for(let y = 0; y< 8; y++){
                curSquare = position[x][y];
                if(curSquare!= "EMPTY"){
                    newSquare = {...curSquare};
                } else{
                    newSquare = "EMPTY";
                }
                
                newBoard[x].push(newSquare);
            }
        }

        return newBoard;
    }


}
