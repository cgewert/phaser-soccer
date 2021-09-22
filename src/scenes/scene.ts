import * as PHASER from "phaser";
import * as DAT from "dat.gui";
//import { SoccerServer } from "../server/server"
import { Player, PlayerActions, PlayerAnimations } from "../player";
import { Ball } from "../ball";

export interface GameInput {
	name: PlayerActions,
	inputKey: Phaser.Input.Keyboard.Key
}

export class Scene extends PHASER.Scene {
	private static CONFIG: Phaser.Types.Scenes.SettingsConfig = {
		key: "scene",
		physics: {
			default: "arcade",
			arcade: {
				gravity: { x: 0, y: 0 },
				debug: true,
			},
		},
	};

	private camera!: PHASER.Cameras.Scene2D.Camera;
	private inputKeys: Array<GameInput> = [];
	private players: Player[];
	private ball!: Ball;
	private dat = new DAT.GUI({ name: "Soccer debug GUI" });
	private development = true ;

	constructor() {
		super(Scene.CONFIG);
		this.players = [];
	}

	public preload() {
		//const server = new SoccerServer();
		this.physics.world.setBounds(0, 0, 2048, 1024);
		this.load.image("tiles1", "assets/gfx/tiles/Grassland.png");
		this.load.image("ball", "assets/gfx/ball.png");
		this.load.tilemapTiledJSON("level", "assets/maps/soccer.json");
		this.load.spritesheet("character", "assets/gfx/character/character.png", {
			frameWidth: 48,
			frameHeight: 64,
		});
	}

	public create() {
		const map = this.make.tilemap({
			key: "level",
			tileWidth: 64,
			tileHeight: 64,
		});
		const tileSet = map.addTilesetImage("Grassland", "tiles1");
		const layerGras = map.createLayer("Gras", tileSet, 0, 0);
		const layerDecor = map.createLayer("Decor", tileSet, 0, 0);
		const layerGoals = map.createLayer("Goals", tileSet, 0, 0);
		layerGoals.setCollisionByExclusion([-1], true);
		layerGras.skipCull = false;
		layerDecor.skipCull = false;
		layerGoals.skipCull = false;

		this.createPlayerAnims();
		this.initializeBall();

		/*
		 *  Create player objects and configure layer collision behaviour.
		 */
		for(let i = 0; i < 2; i++){
			let xOffset = 50 * i;
			let newPlayerPhysics = this.physics.add.sprite(xOffset + 16 * 64, 7 * 64, "character", i*10);
			let newPlayer = new Player(this, newPlayerPhysics)
			newPlayerPhysics.setScale(1.5);
			newPlayerPhysics.setSize(newPlayerPhysics.width - 20, newPlayerPhysics.height - 10);
			newPlayerPhysics.setCollideWorldBounds(true);
			this.physics.add.collider(newPlayerPhysics, layerGoals);
			this.players.push(newPlayer);
			this.physics.add.overlap(newPlayerPhysics, this.ball.sprite, () =>{
				this.ball.setOwner(newPlayer);
			});
		}

		this.createDebugTexts();
		this.physics.add.collider(layerGoals, this.ball.sprite);
		this.camera = this.cameras.main;
		this.camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
		this.camera.startFollow(this.players[0].sprite);
		this.camera.setRoundPixels(true);
		this.initializeInput();
		this.createDatGUI();
	}

	initializeInput() {
		this.inputKeys.push({
			name: PlayerActions.special, inputKey: this.input.keyboard.addKey(
			Phaser.Input.Keyboard.KeyCodes.E,
		)});
		// Shoot action will become tackle, when player is not in ball possession
		this.inputKeys.push({
			name: PlayerActions.shoot, inputKey: this.input.keyboard.addKey(
			Phaser.Input.Keyboard.KeyCodes.SPACE,
		)});
		this.inputKeys.push({
			name: PlayerActions.move_up, inputKey: this.input.keyboard.addKey(
			Phaser.Input.Keyboard.KeyCodes.W,
		)});
		this.inputKeys.push({
			name: PlayerActions.move_right, inputKey: this.input.keyboard.addKey(
			Phaser.Input.Keyboard.KeyCodes.D,
		)});
		this.inputKeys.push({
			name: PlayerActions.move_down, inputKey: this.input.keyboard.addKey(
			Phaser.Input.Keyboard.KeyCodes.S,
		)});
		this.inputKeys.push({
			name: PlayerActions.move_left, inputKey: this.input.keyboard.addKey(
			Phaser.Input.Keyboard.KeyCodes.A,
		)});
	}

	/*
	 *	Iterates all DebugGameObjects and initializes 
	 *  GameOject instances.
	 */
	createDebugTexts() {
		this.players[0].name = "PLAYER1";
		this.players[1].name = "PLAYER2";
		
		// Initialize custom debug texts.	
		for (const player of this.players){
			player.debugText = player.name + ": " + player.debugText;
		}
	}

	/**
	 * Updates the scene logic.
	 * @param time - Overall time in ms since game started.
	 * @param delta - Time in ms since last update call.
	 */
	public update(_time: number, delta: number) {
		const right = this.inputKeys.find((value, idx, obj) => {return value.name === PlayerActions.move_right})?.inputKey
		const left = this.inputKeys.find((value, idx, obj) => {return value.name === PlayerActions.move_left})?.inputKey
		const up = this.inputKeys.find((value, idx, obj) => {return value.name === PlayerActions.move_up})?.inputKey
		const down = this.inputKeys.find((value, idx, obj) => {return value.name === PlayerActions.move_down})?.inputKey
		const shoot = this.inputKeys.find((value, idx, obj) => {return value.name === PlayerActions.shoot})?.inputKey
		let xMovement = Number(right!.isDown) - Number(left!.isDown);
		let yMovement = Number(down!.isDown) - Number(up!.isDown);
		let direction = new PHASER.Math.Vector2(xMovement, yMovement).normalize().scale(delta);
		
		this.players[0].move(direction);
		if(shoot?.isDown) {
			this.shoot(this.players[0], direction);
		}
		this.players.map((player: Player) => {
			player.update();
		});
		this.ball.updatePosition()

		if(this.development){
			this.players.map((player: Player) => {
				player.textPositionX = player.sprite.x - player.textDimensions.width / 2;
				player.textPositionY = player.PositionY - player.sprite.body.halfHeight - player.textDimensions.height - 5;
				player.debugText = `X:${player.PositionX}, Y:${player.PositionY}`;
			});
			
			this.ball.textPositionX = this.ball.sprite.x - this.ball.textDimensions.width / 2;
			this.ball.textPositionY = this.ball.sprite.y - this.ball.sprite.body.halfHeight - this.ball.textDimensions.height - 5;
			this.ball.debugText = `X:${this.ball.PositionX}, Y:${this.ball.PositionY}`;
		}
	}

	createDatGUI() {
		const folderPlayer = this.dat.addFolder("Player");
		const folderBall = this.dat.addFolder("Ball");
		const folderSettings = this.dat.addFolder("Settings");
		folderSettings.add(this, "development")
			.name("DevMode")
			.onChange((val: boolean) => {
				for(const player of this.players) {
					player.textVisible = val;
				}
				this.ball.textVisible = val;
			})
			.setValue(this.development);
		let counter = 0;

		for(let player of this.players){
			let newPlayerFolder = null;
			do{
				try{
					if(counter > 0){
						newPlayerFolder = folderPlayer.addFolder(`${player.name}${counter}`);
					}
					else{
						newPlayerFolder = folderPlayer.addFolder(`${player.name}`);
					}
					break;
				}
				catch(exc: unknown){
					counter++;
				}
			}
			while(true)

			newPlayerFolder.add(player.sprite, "x", 0, 2000, 1);
			newPlayerFolder.add(player.sprite, "y", 0, 2000, 1);
			newPlayerFolder.add(player, "speed", -1000, 2000, 1);
		}

		folderBall.add(this.ball.sprite, "x", 0, 3000, 1);
		folderBall.add(this.ball.sprite, "y", 0, 3000, 1);
		folderBall.add(this.ball.sprite, "scale", 0.0, 3.0, 0.01);
		this.createVectorGui(
			folderBall, "Acceleration", this.ball.sprite.body.acceleration,
			-600, 600, 10,
		);
		this.createVectorGui(
			folderBall, "Bounce", this.ball.sprite.body.bounce,
			0, 1, 0.1
		);
		this.createVectorGui(
			folderBall, "deltaMax", this.ball.sprite.body.deltaMax,
			0, 60, 1,
		);
		this.createVectorGui(
			folderBall, "drag", this.ball.sprite.body.drag,
			0, 60, 0.1,
		);
		this.createVectorGui(
			folderBall,
			"friction",
			this.ball.sprite.body.friction,
			0,
			1,
			0.05,
		);
		this.createVectorGui(folderBall, "gravity", this.ball.sprite.body.gravity,
			-600, 600, 10
		);
		this.createVectorGui(folderBall, "maxVelocity", this.ball.sprite.body.maxVelocity,
			0, 10000, 100
		);
		this.createVectorGui(folderBall, "velocity", this.ball.sprite.body.velocity,
			-600, 600, 10
		);
	}

	createVectorGui(folder: dat.GUI, name: string, vector: PHASER.Math.Vector2,
					min: number, max: number, step: number) {
		const subFolder = folder.addFolder(name);
		subFolder.add(vector, "x", min, max, step);
		subFolder.add(vector, "y", min, max, step);
	}

	createPlayerAnims(){
		this.anims.create({
			key: PlayerAnimations.down,
			frames: this.anims.generateFrameNumbers("character", {
				frames: [0, 1, 2],
			}),
			frameRate: 8,
			repeat: -1,
		});

		this.anims.create({
			key: "walk_down2",
			frames: this.anims.generateFrameNumbers("character", {
				frames: [3, 4, 5],
			}),
			frameRate: 8,
			repeat: -1,
		});

		this.anims.create({
			key: PlayerAnimations.up,
			frames: this.anims.generateFrameNumbers("character", {
				frames: [18, 19, 20],
			}),
			frameRate: 8,
			repeat: -1,
		});

		this.anims.create({
			key: "walk_up2",
			frames: this.anims.generateFrameNumbers("character", {
				frames: [21, 22, 23],
			}),
			frameRate: 8,
			repeat: -1,
		});

		this.anims.create({
			key:  PlayerAnimations.left,
			frames: this.anims.generateFrameNumbers("character", {
				frames: [6, 7, 8],
			}),
			frameRate: 8,
			repeat: -1,
		});

		this.anims.create({
			key: "walk_left2",
			frames: this.anims.generateFrameNumbers("character", {
				frames: [9, 10, 11],
			}),
			frameRate: 8,
			repeat: -1,
		});

		this.anims.create({
			key: PlayerAnimations.right,
			frames: this.anims.generateFrameNumbers("character", {
				frames: [12, 13, 14],
			}),
			frameRate: 8,
			repeat: -1,
		});

		this.anims.create({
			key: "walk_right2",
			frames: this.anims.generateFrameNumbers("character", {
				frames: [15, 16, 17],
			}),
			frameRate: 8,
			repeat: -1,
		});
	}

	/* Initializes a physics body and its properties. */
	initializeBall() {
		let newBall = this.physics.add.sprite(-50 + 16 * 64 - 10, 7 * 64, "ball", 0)
			.setScale(0.13);
		newBall.body.setFriction(1, 1);
		newBall.body.setBounce(0.5, 0.5);
		newBall.body.setCollideWorldBounds(true);
		newBall.body.setCircle(117);
		newBall.body.debugShowVelocity = true;
		this.ball = new Ball(this, newBall);
	}

	shoot(player: Player, direction: PHASER.Math.Vector2) {
		this.ball.setOwner(null);
		// Shoot in player look direction please!?
		this.ball.sprite.setVelocity(25 * direction.x, 25 * direction.y);
		// How to move the ball !???!
		// Ball physics..can i haz pls?
	}
}
