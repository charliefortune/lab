$(document).ready(function(){
    //Canvas stuff
    var canvas = $("#canvas")[0];
    var ctx = canvas.getContext("2d");
    var w = $("#canvas").width();
    var h = $("#canvas").height();
    
    var cw = 10;    //cell width
    //var d;	    //direction the snake is headed at any given time
    var food;
    var landscape_max_depth = h-((h/10)*2);
    var landscape_max_height = 10;
    var game;	//the game parameters are held in this object
    var mover;
    var move_buffer;		//this is an array to hold any quick moves user presses during a single iteration of the game loop
    var scroll_counter = 0;	//need this to slow down the landscape, so it moves only once every nth iteration
    var snake_counter = 0;	//this slows down the snake.
    //this will hold all of the pieces of the scrolling landscape
    var landscape_array;
    //Lets create the snake now
    var snake_array; //an array of cells to make up the snake
    var bullets_array;	//an array of bullet objects.


    //*************The game code **********************//

    function init(){
	$("#messages").append("Start a new game<br />");
	d = "right"; //default direction
	bullets_array = [];
	move_buffer = [];
	move_buffer.push("right");	    //start with a default direction of 'right'
	setup_game_params();
	create_landscape();
	create_snake();
	create_food(); //Now we can see the food particle
	create_mover();

	if(typeof game_loop != "undefined") clearInterval(game_loop);
	game_loop = setInterval(paint, 60);
    }
    init();
    shade_buttons();
    
    $("#pause_button").click(function(){
	game.paused = !(game.paused);
	$(this).blur();
	shade_buttons();
    })

    $("#mover_button").click(function(){
	game.mover_visible = !(game.mover_visible);
	$(this).blur();
	shade_buttons();
    })
    
    $("#landscape_button").click(function(){
	game.scrolling = !(game.scrolling);
	$(this).blur();
	shade_buttons();
    })
    
    $("#shooting_button").click(function(){
	game.shooting = !(game.shooting);
	$(this).blur();
	shade_buttons();
    })
    
    $("#play_button").click(function(){
	game.normal_game = !game.normal_game;
	//if(game.normal_game){
	  //  setup_game_params();
	//}
	$(this).blur();
	shade_buttons();
    })

    function shade_buttons(){
	$("#pause_button").css('opacity',game.paused/2 + 0.5);
	$("#mover_button").css('opacity',game.mover_visible/2 + 0.5);
	$("#landscape_button").css('opacity',game.scrolling/2 + 0.5);
	$("#shooting_button").css('opacity',game.shooting/2 + 0.5);
	$("#play_button").css('opacity',game.normal_game/2 + 0.5);
    }

    function setup_game_params(){
	game = {
		mover_visible: false,
		score: 0,
		scrolling: false,
		shooting: false,
		scroll_x: -1,
		scroll_speed: 2,    //the higher this number is the slower the landscape scrolls
		paused: false,
		normal_game: true
	    };
    }

    function create_bullet(){
	//a bullet has x and y coordinates, and assumes the direction that the snake was travelling in at the time.
	var new_bullet = {x: snake_array[0].x, y: snake_array[0].y, d:d};
	bullets_array.push(new_bullet);
	//console.log(bullets_array);
    }

    function create_snake(){
	    var length = 1; //Length of the snake
	    snake_array = []; //Empty array to start with
	    for(var i = length-1; i>=0; i--)
	    {
		//This will create a horizontal snake starting from the top left
		snake_array.push({x: i, y:0});
	    }
    }

    function create_landscape(){
	landscape_array = [];
	var dir = 1;	// a positive value makes a hill, a negative makes a slope
	x = 1;
	y = 40;
	
	for(var i = 0; i<=w/cw; i++){
	    y = null;
	    landscape_array.push(y);
	}
	landscape_array.push(9);
	landscape_array.push(10);
    }

    //Lets create the food now
    function create_food(){
	    food = {
		    x: Math.round(Math.random()*(w-cw)/cw), 
		    y: Math.round(Math.random()*(h-cw)/cw), 
	    };
	    //console.log(food);
	    //This will create a cell with x/y between 0-44
	    //Because there are 45(450/10) positions accross the rows and columns
    }

    //Lets create the mover now
    function create_mover(){
	    mover = {
		    x: Math.round(Math.random()*(w-cw)/cw), 
		    y: Math.round(Math.random()*(h-cw)/cw),
		    dir_x: -1,
		    dir_y: 1
	    };
	    //This will create a cell with x/y between 0-44
	    //Because there are 45(450/10) positions accross the rows and columns
    }

    //Lets do everything that needs to be done in a single loop
    function paint(){
	//Paint the canvas
	if(game.paused) return;
	ctx.fillStyle = "white";
	ctx.fillRect(0, 0, w, h);
	ctx.strokeStyle = "black";
	ctx.strokeRect(0, 0, w, h);

	//Pop out the tail cell and place it infront of the head cell
	var nx = snake_array[0].x;
	var ny = snake_array[0].y;
	//These were the positions of the head cell.

	if(d == "right") nx++;
	else if(d == "left") nx--;
	else if(d == "up") ny--;
	else if(d == "down") ny++;
	
	//Restart the game if the snake hits the wall
	//If the head of the snake bumps into its body, the game will restart
	if(nx == -1 || nx == w/cw || ny == -1 || ny == h/cw || check_collision(nx, ny, snake_array))
	{
	    $("#messages").append("You scored " + game.score + "<br />");
	    init();
	    return;
	}

	if(game.scrolling && check_landscape_collisions())
	{
	    $("#messages").append("You hit the hills. You scored " + game.score + "<br />");
	    //restart game
	    init();
	    //Lets organize the code a bit now.
	    return;
	}
	
	//Lets write the code to make the snake eat the food
	//If the new head position matches that of the food, create a new head instead of moving the tail
	if(nx == food.x && ny == food.y){
		var tail = {x: nx, y: ny};
		game.score++;
		//$("#messages").append("Munch!<br />");
		//Create new food
		create_food();
	}
	else{
		var tail = snake_array.pop(); //pops out the last cell
		tail.x = nx; tail.y = ny;
	}
	//The snake can now eat the food.
	snake_array.unshift(tail); //puts back the tail as the first cell

	for(var i = 0; i < snake_array.length; i++){
		var c = snake_array[i];
		//Lets paint 10px wide cells
		paint_cell(c.x, c.y, "blue");
	}

	//Lets paint the food
	paint_cell(food.x, food.y, "blue");
	//Now let's paint the mover
	if(game.mover_visible){
	    paint_mover(mover.x, mover.y);
	}
	//Now lets paint the landscape
	if(game.scrolling){
	    scroll_landscape();
	    paint_landscape();
	}
	
	if(game.shooting){
	    move_bullets();
	    paint_bullets();
	}
	
	if(game.normal_game) change_level();
	
	//Lets paint the score
	var score_text = "Score: " + game.score;
	ctx.fillStyle = "green";
	ctx.fillText(score_text, 5, h-5);
    }

    //Lets first create a generic function to paint cells
    function paint_cell(x, y, colour){
	    ctx.fillStyle = colour;
	    ctx.fillRect(x*cw, y*cw, cw, cw);
	    ctx.strokeStyle = "white";
	    ctx.strokeRect(x*cw, y*cw, cw, cw);
    }

    //Lets first create a generic function to paint the mover
    function paint_mover(x, y){
	    mover.x = mover.x + mover.dir_x;
	    mover.y = mover.y + mover.dir_y;
	    if(mover.x > (w-cw)/cw|| mover.x < 1) {
		//console.log('hit the x boundary ' + mover.dir_x);
		mover.dir_x = - mover.dir_x;
	    }
	    if(mover.y > (h-cw)/cw || mover.y < 1) {
		//console.log('hit the y boundary ' + mover.dir_y);
		mover.dir_y = - mover.dir_y;
	    }
	    paint_cell(mover.x,mover.y,"green");
	    
    }

    function scroll_landscape(){
	//lop the beginning off the landscape and add a new one on the end.
	scroll_counter++;
	if(scroll_counter > game.scroll_speed){
	    landscape_array.shift();
	    var length = landscape_array.length;
	    var last_y = landscape_array[length-1];
	    var y = last_y;
	    var dir = landscape_array[length-2] - last_y;
		if(y > landscape_max_depth){
		    y = last_y - dir;
		}
		else if (y < landscape_max_height){
		    y++;
		}
		else if(Math.floor(Math.random()*10) > 8){
		    y--;
		}
		else y = y - dir;
	    landscape_array.push(y);
	    scroll_counter = 0;
	}
    }

    function paint_landscape(){
	//then run through the landscape array and draw each one.
	for(var x = 0; x < landscape_array.length; x++)
	    {
		var y = landscape_array[x];
		if(y !== null) paint_cell(x, y, "brown");
	    }
    }

    function move_bullets(){
	for(var i = 0; i < bullets_array.length; i++){
	    switch(bullets_array[i].d){
		
		case "right":
		    bullets_array[i].x++;
		    break;
		    
		case "left":
		    bullets_array[i].x--;
		    break;

		case "up":
		    bullets_array[i].y--;
		    break;

		case "down":
		    bullets_array[i].y++;
		    break;
	    }
	    if(bullets_array[i].x < 1 || bullets_array[i].x > h/cw || bullets_array[i].y < 1 || bullets_array[i].y > w/cw){
		//remove this bullet from the array
		bullets_array.splice(i,i); 
	    }
	    check_bullet_collisions();
	    
	}
    }
    
    function paint_bullets(){
	for(var i = 0; i < bullets_array.length; i++){
	    var bullet = bullets_array[i];
	    paint_cell(bullet.x,bullet.y,"yellow");
	}
    }

    function check_bullet_collisions(){
	for(var i = 0; i < bullets_array.length; i++){
	    bullet = bullets_array[i];
	    if(landscape_array[bullet.x] == bullet.y){
		landscape_array[bullet.x] = null;
	    }
	    if(mover.x == bullet.x && mover.y == bullet.y){
		mover.visible = false;
	    }
	}
    }

    function check_collision(x, y, array){
	    
	    //This function will check if the provided x/y coordinates exist
	    //in an array of cells or not
	    for(var i = 0; i < array.length; i++)
	    {
		if(array[i].x == x && array[i].y == y){
		    $("#messages").append('Whacked yourself in the goolies!<br />');
		    return true; 
		}

		else if(game.mover_visible && array[i].x == mover.x && array[i].y == mover.y){
		    $("#messages").append('Biffed by the mover :( <br />')
		    return true;
		}
		    
	    }
	    return false;
    }
    
    function check_landscape_collisions(){
	//check to see if we bumped into the hills
	for(var i = 0; i < snake_array.length; i++){
		if(landscape_array[snake_array[i].x] == snake_array[i].y){
		    $("#messages").append('Hill crash!<br />');
		    return true; 
		}
	    }
	return false;
    }
    
    function change_level(){
	if(game.score > 10){
	    game.shooting = true;
	}
	else if(game.score > 7){
	    game.scrolling = true;
	}
	else if(game.score > 4){
	    game.mover_visible = true;
	}
	shade_buttons();
    }
    
    //*************The sounds code **********************//
    
    function init_sounds(){
	var snd = new Audio("sounds/ballad2.mp3"); // buffers automatically when created
	snd.addEventListener('ended', function () {
	    this.currentTime = 0;
	    this.play();
	}, false);
	snd.play();
    }
    

    
    
    //************* -------------- **********************//
    init_sounds();

    //Lets add the keyboard controls now
    $(document).keydown(function(e){
	    var key = e.which;
	    //Pressing Enter will pause and unpause the game
	    if(key == "13") {
		game.paused = !game.paused;
		shade_buttons();
	    }
	    else{
		if(key == "37" && d != "right") d = "left";
		else if(key == "38" && d != "down") d = "up";
		else if(key == "39" && d != "left") d = "right";
		else if(key == "40" && d != "up") d = "down";
		move_buffer.push(d);
	    }
	    if(key == '32' && game.shooting){
		create_bullet();
	    }
	    
	    
	    
    })

})