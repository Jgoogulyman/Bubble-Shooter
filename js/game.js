var BubbleShoot = window.BubbleShoot || {};
BubbleShoot.Game = (function($){
	var Game = function(){
		var curBubble;
		var board;
		var numBubbles;
		var bubbles = [];
		var MAX_BUBBLES = 70;
		var POINTS_PER_BUBBLE = 2;
		var level = 0;
		var score = 0;
		var gameData = {high_score : 0, COINS : 0}
		var requestAnimationID;
		var MAX_ROWS = 11;
		var player = "guest";
		this.init = function(){
			if(BubbleShoot.Renderer){
				BubbleShoot.Renderer.init(function(){
					$(".guest_start_game").click({param1: "guest"},startGame);
					$(".select_user").click("click",userSelect);
				});
			}else{
				$(".guest_start_game").click({param1: "guest"},startGame);
				$(".select_user").click("click",userSelect);
			};
		};
		var makeBomb = function(){
			BubbleShoot.ui.MAKE_BOMB += 1;
			BubbleShoot.ui.EXPLODE += 1;
			gameData.COINS -= 1;
			BubbleShoot.ui.drawCoins(gameData.COINS);
		};
		var buttonEnable = function(){
			if(COINS >= 1){
				$(".but_buy_bomb").bind("click",makeBomb);
			}else{
				$("but_buy_bomb").unbind("click");
			};
		};
		var userSelect = function(){
			BubbleShoot.ui.hideDialog();
			$("select_user").unbind("click");
			$(".guest_start_game").unbind("click");
			$("#user_selection").fadeIn(300);
			$(".Jacob").bind({param1: "jacob"},startGame);
			$(".Brenna").bind({param1: "brenna"},startGame);
			$(".Mom").bind({param1: "mom"},startGame);
			$(".Dad").bind({param1: "dad"},startGame);
			$(".Back").bind("click",goBack);
			alert("done");
		};
		var goBack = function(){
			$(".Jacob").unbind("click");
			$(".Brenna").unbind("click");
			$(".Mom").unbind("click");
			$(".Dad").unbind("click");
			$(".Back").unbind("click");
			$("#user_selection").fadeOut(300);
			$("#start_game").fadeIn(300);
			$(".guest_start_game").click({param1: "guest"},startGame);
			$(".select_user").click("click",userSelect);
		};
		var startGame = function(event){
			alert("yep");
			$(".guest_start_game").unbind("click");
			$(".select_user").unbind("click");
			$(".Jacob").unbind("click");
			$(".Brenna").unbind("click");
			$(".Mom").unbind("click");
			$(".Dad").unbind("click");
			$(".Back").unbind("click");
			numBubbles = MAX_BUBBLES - level * 5;;
			BubbleShoot.ui.hideDialog();
			$("#user_selection").fadeOut();
			if(event.data.param1 != "guest"){
				if(window.localStorage && localStorage.getItem(event.data.param1)){
					gameData = JSON.parse(localStorage.getItem(event.data.param1));
					gameData.COINS = 0;
					buttonEnable();
				};
			};
			player = event.data.param1;
			BubbleShoot.ui.drawHighScore(gameData.highScore);
			BubbleShoot.ui.drawCoins(gameData.COINS);
			board = new BubbleShoot.Board();
			bubbles = board.getBubbles();
			if(BubbleShoot.Renderer)
			{
				if(!requestAnimationID)
					requestAnimationID = requestAnimationFrame(renderFrame);
			}else{
				BubbleShoot.ui.drawBoard(board);
			};
			curBubble = getNextBubble();
			$("#game").bind("click",clickGameScreen);
			BubbleShoot.ui.drawScore(score);
			BubbleShoot.ui.drawLevel(level);
		};
		var getNextBubble = function(){
			var bubble = BubbleShoot.Bubble.create();
			bubbles.push(bubble);
			bubble.setState(BubbleShoot.BubbleState.CURRENT);
			bubble.getSprite().addClass("cur_bubble");
			var top = 470;
			var left = ($("#board").width() - BubbleShoot.ui.BUBBLE_DIMS)/2;
			bubble.getSprite().css({
				top : top,
				left : left
			});
			$("#board").append(bubble.getSprite());
			BubbleShoot.ui.drawBubblesRemaining(numBubbles);
			numBubbles--;
			return bubble;
		};
		var clickGameScreen = function(e){
			var angle = BubbleShoot.ui.getBubbleAngle(curBubble.getSprite(),e);
			var duration = 750;
			var distance = 1000;
			var collision = BubbleShoot.CollisionDetector.findIntersection(curBubble,
				board,angle);
			if(collision){
				var coords = collision.coords;
				duration = Math.round(duration * collision.distToCollision / distance);
				board.addBubble(curBubble,coords);
				var group = board.getGroup(curBubble,{});
				if(curBubble.getType() == 4){
					popBubbles(group.list,duration);
					var topRow = board.getRows()[0];
					var topRowBubbles = [];
					for(var i=0;i<topRow.length;i++){
						if(topRow[i])
							topRowBubbles.push(topRow[i]);
					};
					if(topRowBubbles.length <= 5){
						popBubbles(topRowBubbles,duration);
						group.list.concat(topRowBubbles);
					};
					var orphans = board.findOrphans();
					var delay = duration + 200 + 30 * group.list.length;
					dropBubbles(orphans,delay);
					var popped = [].concat(group.list,orphans);
					var points = POINTS_PER_BUBBLE ^ popped.length;
					score += points;
					setTimeout(function(){
						BubbleShoot.ui.drawScore(score);
					},delay);
				}
				if(group.list.length >= 3){
					popBubbles(group.list,duration);
					var topRow = board.getRows()[0];
					var topRowBubbles = [];
					for(var i=0;i<topRow.length;i++){
						if(topRow[i])
							topRowBubbles.push(topRow[i]);
					};
					if(topRowBubbles.length <= 5){
						popBubbles(topRowBubbles,duration);
						group.list.concat(topRowBubbles);
					};
					var orphans = board.findOrphans();
					var delay = duration + 200 + 30 * group.list.length;
					dropBubbles(orphans,delay);
					var popped = [].concat(group.list,orphans);
					var points = POINTS_PER_BUBBLE ^ popped.length;
					score += points;
					setTimeout(function(){
						BubbleShoot.ui.drawScore(score);
					},delay);
				}
			}else{
				var distX = Math.sin(angle) * distance;
				var distY = Math.cos(angle) * distance;
				var bubbleCoords = BubbleShoot.ui.getBubbleCoords(curBubble.getSprite());
				var coords = {
					x : bubbleCoords.left + distX,
					y : bubbleCoords.top - distY
				};
			};
			BubbleShoot.ui.fireBubble(curBubble,coords,duration);
			if(board.getRows().length > MAX_ROWS){
				endGame(false);
			}else if(numBubbles == 0){
				endGame(false);
			}else if(board.isEmpty()){
				endGame(true);
			}else{
				curBubble = getNextBubble(board);
			}
		};
		var popBubbles = function(bubbles,delay){
			$.each(bubbles,function(){
				var bubble = this;
				setTimeout(function(){
					bubble.setState(BubbleShoot.BubbleState.POPPING);
					bubble.animatePop();
					setTimeout(function(){
						bubble.setState(BubbleShoot.BubbleState.POPPED);
					},200);
					BubbleShoot.Sounds.play("_mp3/pop.mp3",Math.random()*.5 + .5);
				},delay);
				board.popBubbleAt(this.getRow(),this.getCol());
				setTimeout(function(){
					bubble.getSprite().remove();
				},delay + 200);
				delay += 60;
			});
		};
		var dropBubbles = function(bubbles,delay){
			$.each(bubbles,function(){
				var bubble = this;
				board.popBubbleAt(bubble.getRow(),bubble.getCol());
				setTimeout(function(){
					bubble.setState(BubbleShoot.BubbleState.FALLING);
					bubble.getSprite().kaboom({
						callback : function(){
							bubble.getSprite().remove();
							bubble.setState(BubbleShoot.BubbleState.FALLEN);
						}
					})
				},delay);
			});
		};
		var renderFrame = function(){
			$.each(bubbles,function(){
				if(this.getSprite().updateFrame)
					this.getSprite().updateFrame();
			});
			BubbleShoot.Renderer.render(bubbles);
			requestAnimationID = requestAnimationFrame(renderFrame);
		};
		var endGame = function(hasWon){
			if(hasWon){
				gameData.COINS += 1;
			};
			if(score > gameData.highScore){
				gameData.highScore = score;
				$("#new_high_score").show();
				BubbleShoot.ui.drawHighScore(gameData.highScore);
				if(window.localStorage){
					if(player != "guest"){
						localStorage.setItem(player,JSON.stringify(gameData));
					}
				}
			}else{
				$("#new_high_score").hide();
			};
			if(hasWon){
				level++;
			}else{
				score = 0;
				level = 0;
			};
			$(".guest_start_game").click({param1: "guest"},startGame);
			$(".select_user").click("click",userSelect);
			$("#board .bubble").remove();
			BubbleShoot.ui.endGame(hasWon,score);
		};
	};
	window.requestAnimationFrame = Modernizr.prefixed("requestAnimationFrame",
		window) || function(callback){
		window.setTimeout(function(){
			callback();
		}, 40);
	};
	return Game;
})(jQuery);