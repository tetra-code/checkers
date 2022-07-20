const wsProtocol = location.protocol.includes('https') ? 'wss:' : 'ws:';
const socket = io();

/*===================== Global variables =========================*/
const splashBtn = document.getElementById('splashBtn');
const square_class = document.getElementsByClassName("square");
const white_checker_class = document.getElementsByClassName("white_checker");
const black_checker_class = document.getElementsByClassName("black_checker");
const board = document.getElementById("board");
const score = document.getElementById("score");
const black_background = document.getElementById("black_background");
const moveSound = document.getElementById("moveSound");
const winSound = document.getElementById("winSound");

let windowHeight, windowWidth;
let moveLength = 80 ;
let moveDeviation = 10;
// var Dimension = 1;
let contor = 0;
let bigScreen = 1;

let updatingBoard = false;

let selectedPiece, selectedPieceindex;
let upRight, upLeft, downLeft, downRight; 

const box = [];
const whitecheckers = [];
const blackcheckers = [];
let previousSquare;
let currentSquare;
let currentSquareIndex;

let toUpdateSqaureIndex;

let movedSquares;
let selectedChecker;
let selectedCheckerType;
let mustAttack = false;
let gameOver = false;
let multiplier = 1  //to determine whether jump 2 rows for attack or jump 1 row for moving
let oneMove; //to move once for 1 jump
let anotherMove; //to move twice for attack
let boardLimit,reverse_boardLimit, moveUpLeft,moveUpRight, moveDownLeft,moveDownRight, boardLimitLeft, boardLimitRight;

// white always goes first
const color = sessionStorage.getItem('color');
console.log(color);
let whiteIsNext = true;
let gameIsLive = true;
const gameID = window.location.href.split('/play/')[1];

/*===================== checkers board adjustment =========================*/
getDimension();
if (windowWidth > 640) {
    moveLength = 80;
    moveDeviation = 10;
} else {
    moveLength = 50;
    moveDeviation = 6;
}

/*================Class constructors===============*/
const squareGen = function(square, index) {
	this.id = square;
	this.occupied = false;
	this.pieceId = undefined;
	this.id.onclick = function() {
		makeMove(index);
	}
}

const checkerGen = function(piece, color, square) {
	this.id = piece;
	this.color = color;
	this.king = false;
	this.occupied_square = square;
	this.alive = true;
	if (square % 8 ) {
		this.coordX= square % 8;
		this.coordY = Math.floor(square/8) + 1 ;
	} else {
		this.coordX = 8;
		this.coordY = square/8 ;
	}
	this.id.onclick = function () {
		showMoves(piece);	
	}
}

checkerGen.prototype.setCoord = function() {
	let x = (this.coordX - 1  ) * moveLength + moveDeviation;
	let y = (this.coordY - 1 ) * moveLength  + moveDeviation;
	this.id.style.top = y + 'px';
	this.id.style.left = x + 'px';
}

checkerGen.prototype.changeCoord = function(X,Y){
	this.coordY += Y ;
	this.coordX += X;
}

checkerGen.prototype.checkIfKing = function () {
	if(this.coordY == 8 && !this.king && this.color == "white"){
		this.king = true;
		this.id.style.border = "4px solid #FFFF00";
	}
	if(this.coordY == 1 && !this.king &&this.color == "black"){
		this.king = true;
		this.id.style.border = "4px solid #FFFF00";
	}
}

/*==========================Setup game board=================================*/
// for class query, index starts at 1
for (let i = 1; i <= 64; i++) {
	box[i] = new squareGen(square_class[i], i);
}

/*=========================Setup game checker pieces =========================*/
//setup white pieces
for (var i = 1; i <= 4; i++){
	whitecheckers[i] = new checkerGen(white_checker_class[i], "white", 2*i -1 );
	whitecheckers[i].setCoord(0,0);
	box[2*i - 1].occupied = true;
	box[2*i - 1].pieceId = whitecheckers[i];
}

for (var i = 5; i <= 8; i++){
	whitecheckers[i] = new checkerGen(white_checker_class[i], "white", 2*i );
	whitecheckers[i].setCoord(0,0);
	box[2*i].occupied = true;
	box[2*i].pieceId = whitecheckers[i];
}

for (var i = 9; i <= 12; i++){
	whitecheckers[i] = new checkerGen(white_checker_class[i], "white", 2*i - 1 );
	whitecheckers[i].setCoord(0,0);
	box[2*i - 1].occupied = true;
	box[2*i - 1].pieceId = whitecheckers[i];
}

//setup black pieces
for (var i = 1; i <= 4; i++){
	blackcheckers[i] = new checkerGen(black_checker_class[i], "black", 56 + 2*i  );
	blackcheckers[i].setCoord(0,0);
	box[56 +  2*i ].occupied = true;
	box[56+  2*i ].pieceId =blackcheckers[i];
}

for (var i = 5; i <= 8; i++){
	blackcheckers[i] = new checkerGen(black_checker_class[i], "black", 40 +  2*i - 1 );
	blackcheckers[i].setCoord(0,0);
	box[ 40 + 2*i - 1].occupied = true;
	box[ 40 + 2*i - 1].pieceId = blackcheckers[i];
}

for (var i = 9; i <= 12; i++){
	blackcheckers[i] = new checkerGen(black_checker_class[i], "black", 24 + 2*i  );
	blackcheckers[i].setCoord(0,0);
	box[24 + 2*i ].occupied = true;
	box[24 + 2*i ].pieceId = blackcheckers[i];
}

/*=====================Selected checker=====================*/
if (color === 'white') {
	selectedCheckerType = whitecheckers;
} else {
	selectedCheckerType = blackcheckers;
}

function isTurn() {
	if (whiteIsNext && color === 'white') {
		return true;
	}
	if (!whiteIsNext && color === 'black') {
		return true;
	}
	return false;
}

function showMoves(piece) {
	if (!isTurn() && !updatingBoard) return false;
	let match = false;
	mustAttack = false;
	if (selectedPiece) {
        eraseRoads();
        // necessary to still display previous move made by opponent
        highLightMove();
    }
	selectedPiece = piece;
	let i;
	for (let j = 1; j <= 12; j++) {
		if(selectedCheckerType[j].id == piece) {
			i = j;
			selectedPieceindex = j;
			match = true;
			break;
		}
	}
    const selectedCheckerPiece = selectedCheckerType[i];

    // for when multiple moves (multiple hits) are avilable
	if (oneMove && !hasAttackMoves(oneMove)) {
		changeTurns(oneMove);
		oneMove = undefined;
		return false;
	}

	if (oneMove && oneMove != selectedCheckerPiece) return false;

    //if no match was found; it happens when for example red moves and you press black
	if (!match) return false; 

	//depending on the color, set the edges and movements of the pieces
	if (selectedCheckerPiece.color =="white") {
		boardLimit = 8;
		boardLimitRight = 1;
		boardLimitLeft = 8;
		moveUpRight = 7;
		moveUpLeft = 9;
		moveDownRight = - 9;
		moveDownLeft = -7;
	} else {
		boardLimit = 1;
		boardLimitRight = 8;
		boardLimitLeft = 1;
		moveUpRight = -7;
		moveUpLeft = -9;
		moveDownRight = 9;
		moveDownLeft = 7;
	}
 	// check if you can attack
	hasAttackMoves(selectedCheckerPiece)
	
	// if can't attack move it
 	if (!mustAttack) {
 	    downLeft = checkMove( selectedCheckerPiece , boardLimit , boardLimitRight , moveUpRight , downLeft);
		downRight = checkMove(selectedCheckerPiece , boardLimit , boardLimitLeft , moveUpLeft , downRight);
		if (selectedCheckerPiece.king) {
			upLeft = checkMove( selectedCheckerPiece , reverse_boardLimit , boardLimitRight , moveDownRight , upLeft);
			upRight = checkMove( selectedCheckerPiece, reverse_boardLimit , boardLimitLeft , moveDownLeft, upRight);
		}
	}
	if (downLeft || downRight || upLeft || upRight) return true;
	return false;
}


/**
 * Removes the highlighted moveable places of selected checker piece
 */
function eraseRoads() {
	if(downRight) box[downRight].id.style.background = "#BA7A3A";
	if(downLeft) box[downLeft].id.style.background = "#BA7A3A";
	if(upRight) box[upRight].id.style.background = "#BA7A3A";
	if(upLeft) box[upLeft].id.style.background = "#BA7A3A";
}
		
/*==================Actually moving checker pieces================*/

function makeMove(index) {
    let selectedCheckerPiece = selectedCheckerType[1];
	let isMove = false;
    //if the game has just started and no track has been selected
	if (!selectedPiece) return false;
	if (index != upLeft && index != upRight && index != downLeft && index != downRight) {
		eraseRoads();
		selectedPiece = undefined;
		return false;
	}
    // perspective is of the moving player
	if (selectedCheckerPiece.color=="white") {
		cpy_downRight = upRight;
		cpy_downLeft = upLeft;
		cpy_upLeft = downLeft;
		cpy_upRight = downRight;
	} else {
		cpy_downRight = upLeft;
		cpy_downLeft = upRight;
		cpy_upLeft = downRight;
		cpy_upRight = downLeft;
	}  

	if(mustAttack) multiplier = 2;
	else multiplier = 1;

    if (index == cpy_upRight) {
        isMove = true;		
        if(selectedCheckerPiece.color=="white"){
            executeMove( multiplier * 1, multiplier * 1, multiplier * 9 );
            // remove track if jump performed
            if(mustAttack) eliminateCheck(index - 9);
        }
        else{
            executeMove( multiplier * 1, multiplier * -1, multiplier * -7);
            if(mustAttack) eliminateCheck( index + 7 );
        }
    }

    if (index == cpy_upLeft) {
        isMove = true;
        if(selectedCheckerPiece.color=="white"){
            executeMove( multiplier * -1, multiplier * 1, multiplier * 7);
            if(mustAttack)	eliminateCheck(index - 7 );				
        }
        else{
            executeMove( multiplier * -1, multiplier * -1, multiplier * -9);
            if (mustAttack) eliminateCheck( index + 9 );
        }
    }

    if (index == cpy_downRight) {
        isMove = true;
        if (selectedCheckerPiece.color=="white") {
            executeMove( multiplier * 1, multiplier * -1, multiplier * -7);
            if(mustAttack) eliminateCheck ( index  + 7) ;
        } else {
            executeMove( multiplier * 1, multiplier * 1, multiplier * 9);
            if(mustAttack) eliminateCheck ( index  - 9) ;
        }
    }

    if (index == cpy_downLeft) {
        isMove = true;
        if (selectedCheckerPiece.color=="white") {
            executeMove( multiplier * -1, multiplier * -1, multiplier * -9);
            if (mustAttack) eliminateCheck ( index  + 9);
        } else {
            executeMove( multiplier * -1, multiplier * 1, multiplier * 7);
            if (mustAttack) eliminateCheck ( index  - 7);
        }
    }

    // for when hit is made, need to erase roads
	eraseRoads();
	selectedCheckerType[selectedPieceindex].checkIfKing();

	// change the turn 
	// may not be necessary
	if (isMove) {
		anotherMove = undefined;
		if (mustAttack) {
			anotherMove = hasAttackMoves(selectedCheckerType[selectedPieceindex]);
		}
		if (anotherMove){
			oneMove = selectedCheckerType[selectedPieceindex];
			showMoves(oneMove);
		} else {
			oneMove = undefined;
		 	changeTurns(selectedCheckerPiece);
		 	gameOver = checkIfLost();
		 	if(gameOver) { setTimeout( declareWinner(),3000 ); return false};
		 	gameOver = checkForMoves();
		 	if(gameOver) { setTimeout( declareWinner() ,3000) ; return false};
		}
	}
	whiteIsNext = !whiteIsNext;
	console.log("made move")
	// don't braodcast if you're updating
	if (!updatingBoard) {
		broadcastMove();
	}
}

/*===========Utility methods to check and moving pieces=========*/
function executeMove(X,Y,nSquare) {
    // erase previous highlighted move
    eraseHighlights()

	// exchange coordinates of moved parts
    selectedChecker = selectedCheckerType[selectedPieceindex];
	selectedChecker.changeCoord(X,Y); 
	selectedChecker.setCoord(0,0);

	// release the field that the piece occupies and occupy the one that it selected
	selectedCheckerType[selectedPieceindex].occupied_square + nSquare
	previousSquare = box[selectedChecker.occupied_square];

	toUpdateSqaureIndex = selectedPieceindex;
	currentSquareIndex = selectedChecker.occupied_square + nSquare;
	currentSquare = box[currentSquareIndex];
    // highlight previous and new squares
    highLightMove()

    previousSquare.occupied = false;	
	currentSquare.occupied = true;
    currentSquare.pieceId = previousSquare.pieceId;
	previousSquare.pieceId = undefined; 	

	selectedChecker.occupied_square += nSquare;
}

function highLightMove() {
    if (previousSquare && currentSquare) {
        previousSquare.id.style.background = "#a2ea8c";
        currentSquare.id.style.background = "#a2ea8c";
    }
}

function eraseHighlights() {
    if (previousSquare && currentSquare) {
        previousSquare.id.style.background = "#BA7A3A";
        currentSquare.id.style.background = "#BA7A3A";
    }
}

function checkMove(Apiece,tLimit,tLimit_Side,moveDirection,theDirection){
	if(Apiece.coordY != tLimit){
		if(Apiece.coordX != tLimit_Side && !box[ Apiece.occupied_square + moveDirection ].occupied){
			box[ Apiece.occupied_square + moveDirection ].id.style.background = "#704923";
			theDirection = Apiece.occupied_square + moveDirection;
		} else theDirection = undefined;
	} else theDirection = undefined;
	return theDirection;
}

function checkAttack( check , X, Y , negX , negY, squareMove, direction) {
	if (check.coordX * negX >= 	X * negX && 
		check.coordY *negY <= Y * negY && 
		box[check.occupied_square + squareMove ].occupied && 
		box[check.occupied_square + squareMove].pieceId.color != check.color && 
		!box[check.occupied_square + squareMove * 2 ].occupied) {
		mustAttack = true;
		direction = check.occupied_square +  squareMove*2 ;
		box[direction].id.style.background = "#704923";
		return direction ;
	} 
    direction =  undefined;
    return direction;
}

function eliminateCheck(index) {
	if (index < 1 || index > 64) return  0;
	let x = box[index].pieceId ;
	x.alive =false;
	box[index].occupied = false;
	x.id.style.display  = "none";
}
	
function hasAttackMoves(checker) {
    upRight = checkAttack( checker , 6, 3 , -1 , -1 , -7, upRight );
    upLeft = checkAttack( checker, 3 , 3 , 1 , -1 , -9 , upLeft );
    downLeft = checkAttack( checker , 3, 6, 1 , 1 , 7 , downLeft );
    downRight = checkAttack( checker , 6 , 6 , -1, 1 ,9 , downRight );

    // ??
    // boolean value of undefined is false
 	if (checker.color === "black" && (upRight || upLeft || downLeft || downRight)) {
	 	let p = upLeft;
	 	upLeft = downLeft;
	 	downLeft = p;

	 	p = upRight;
	 	upRight = downRight;
	 	downRight = p;

	 	p = downLeft ;
	 	downLeft = downRight;
	 	downRight = p;

	 	p = upRight ;
	 	upRight = upLeft;
	 	upLeft = p;
 	}

 	if (upLeft != undefined || upRight != undefined || downRight != undefined || downLeft != undefined) {
 		return true;
 	}
 	return false;
}

function changeTurns(checker) {
	if (checker.color === "white") selectedCheckerType = blackcheckers;
    else selectedCheckerType = whitecheckers;
}

function checkIfLost() {
	for(let i = 1 ; i <= 12; i++)
		if(selectedCheckerType[i].alive)
			return false;
	return true;
}

function checkForMoves() {
	for(let i = 1 ; i <= 12; i++)
		if (selectedCheckerType[i].alive && showMoves(selectedCheckerType[i].id)) {
			eraseRoads();
			return false;
		}
	return true;
}

function declareWinner() {
	black_background.style.display = "inline";
	score.style.display = "box";
    if (selectedCheckerType[1].color == "white") score.innerHTML = "Black wins";
    else score.innerHTML = "Red wins";
}

function getDimension() {
	contor++;
    windowHeight = window.innerHeight|| document.documentElement.clientHeight || document.body.clientHeight;
    windowWidth =  window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
}

/**
 * To resize board based on display size 
 */
document.getElementsByTagName("BODY")[0].onresize = function() {
	getDimension();
	var cpy_bigScreen = bigScreen ;

    if(windowWidth < 650) {
		moveLength = 50;
		moveDeviation = 6; 
		if(bigScreen == 1) bigScreen = -1;
	}

    if(windowWidth > 650) {
		moveLength = 80;
		moveDeviation = 10; 
		if(bigScreen == -1) bigScreen = 1;
	}

	if(bigScreen !== cpy_bigScreen) {
        for(let i = 1; i <= 12; i++){
            blackcheckers[i].setCoord(0,0);
            whitecheckers[i].setCoord(0,0);
        }
	}
}

function broadcastMove() {
	console.log(toUpdateSqaureIndex)
	console.log(selectedCheckerType[selectedPieceindex])
	const payload = {
		'piece_index': toUpdateSqaureIndex,
		'dest_square_index': currentSquareIndex,
		'color': color,
		'white_is_next': whiteIsNext,
		'game_is_live': gameIsLive
	}
    socket.emit("game_move", JSON.stringify(payload));
};

// default msg type 'connect'
socket.on('connect', () => {
    console.log("connected to server");
	socket.emit("join_game", gameID);
});

// default msg type 'disconnect'
socket.on('disconnect', () => {
    console.log("disconnected from server");
});

socket.on('game_move', (payload) => {
	console.log('received game move')
	const response = JSON.parse(payload);
	//only accept if its from opponent
	if (color !== response.color) {
		updateBoard(response);
	}
});

function updateBoard(response) {
	updatingBoard = true;
	if (response.color === 'white') {
		selectedCheckerType = whitecheckers;
	} else {
		selectedCheckerType = blackcheckers;
	}
	selectedPieceindex = response.piece_index
	selectedPiece = selectedCheckerType[selectedPieceindex];
	console.log(selectedPiece.id)
	showMoves(selectedPiece.id)
	makeMove(response.dest_square_index)
	// whiteIsNext = response.white_is_next;
	game_is_live = response.game_is_live;
	console.log("updated info")
	updatingBoard = false;
}
