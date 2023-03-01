1) The app consists of a GAME (data), a CHESSCONTROLLER (logic), and a VIEW (display). 
2) From outside, the GAME can be queried for
    - The game board
    - The piece at a given location,
    and can be asked to
    - Alter the contents of a square.
3) The CHESSCONTROLLER is in charge of 
    - All the logic for determining legality of moves
    - Passing information between the GAME and the VIEW
    - Processing user input.
4) The VIEW 
    - Constructs the HTML for displaying the chess game
    - Draws lists of pieces and highlights squares with legal moves
    and can
    - be requested to change the current style / rendering component.

