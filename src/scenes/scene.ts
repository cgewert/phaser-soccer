import * as PHASER from "phaser";
import * as DAT from "dat.gui";
import { Player, PlayerAnimations } from "../player";
import { Ball } from "../ball";
export class Scene extends PHASER.Scene {
	private static CONFIG: Phaser.Types.Scenes.SettingsConfig = {
		key: "scene",
		physics: {
			default: "arcade",
			arcade: {
				gravity: { x: 0, y: 0 },
				debug: true,
				fixedStep: true
			},
		},
	};

	public camera!: PHASER.Cameras.Scene2D.Camera;
	private player!: Player;
	public ball!: Ball;
	private dat = new DAT.GUI({ name: "Soccer debug GUI" });
	private development = true ;

	constructor() {
		super(Scene.CONFIG);
	}

	public preload() {
		this.physics.world.setBounds(0, 0, 6144, 2048);
		this.input.mouse.disableContextMenu();
		this.load.image("tiles1", "assets/gfx/tiles/Grassland.png");
		this.load.image("ball", "assets/gfx/ball.png");
		this.load.spritesheet("cursor", "assets/gfx/cursors/destination.png", {
			frameWidth: 18,
			frameHeight: 18,
		});
		this.load.tilemapTiledJSON("level", "assets/maps/playfield1.json");
		this.load.spritesheet("character", "assets/gfx/character/character.png", {
			frameWidth: 48,
			frameHeight: 64,
		});
		this.load.image("circle_marker", "assets/gfx/circle_marker.png");
	}

	public create() {
		const map = this.make.tilemap({
			key: "level",
			tileWidth: 64,
			tileHeight: 64,
		});
		const tileSet = map.addTilesetImage("Grassland", "tiles1");
		const layerGras = map.createLayer("Background", tileSet, 0, 0);
		const layerGoals = map.createLayer("Foreground", tileSet, 0, 0);
		layerGoals.setCollisionByExclusion([-1], true);
		layerGras.skipCull = true;
		layerGoals.skipCull = true;
		this.ball = new Ball(this);

		// Create spritesheet for cursor
		this.anims.create({
			key: 'cursor_destination',
			frames: this.anims.generateFrameNumbers("cursor", {
				frames: [0, 1, 2, 3, 4],
			}),
			frameRate: 8,
			repeat: -1,
		});
		// Create a player instance.
		this.player = new Player(this);
		// Register player collision handlers.
		this.physics.add.collider(this.player.sprite, layerGoals);
		this.player.ballCollider = this.physics.add.overlap(this.player.sprite, 
															this.ball.sprite, 
															() => {
				this.ball.owner = this.player;
				this.ball.sprite.setVelocity(0);
				this.ball.sprite.setAcceleration(0);
			});

		this.createDebugTexts();
		this.physics.add.collider(layerGoals, this.ball.sprite);
		this.camera = this.cameras.main;
		this.camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
		this.camera.setRoundPixels(true);
		this.createDatGUI();
	}

	/*
	 *	Iterates all DebugGameObjects and initializes 
	 *  GameOject instances.
	 */
	createDebugTexts() {
		this.player.name = "PLAYER1";
		const motion = this.player.sprite.body.velocity.clone().normalize();
		this.player.debugText = `Vector: ${motion}`;
	}

	/**
	 * Updates the scene logic.
	 * @param time - Overall time in ms since game started.
	 * @param delta - Time in ms since last update call.
	 */
	public update(_time: number, delta: number) {
		this.player.update();
		this.ball.update();

		// TODO: Scroll camera with acceleration
		const camScrollSpeed = 2000;
		if(this.input.activePointer.x >= this.camera.x + this.camera.width - 100){
			this.camera.scrollX += camScrollSpeed * delta / 1000;
		}
		if(this.input.activePointer.x <= this.camera.x + 100){
			this.camera.scrollX -= camScrollSpeed * delta / 1000;
		}
		if(this.input.activePointer.y >= this.camera.y + this.camera.height - 100){
			this.camera.scrollY += camScrollSpeed * delta / 1000;
		}
		if(this.input.activePointer.y <= this.camera.y + 100){
			this.camera.scrollY -= camScrollSpeed * delta / 1000;
		}

		if(this.development){
			this.player.textPositionX = this.player.sprite.x - this.player.textDimensions.width / 2;
			this.player.textPositionY = this.player.PositionY - this.player.sprite.body.halfHeight - this.player.textDimensions.height - 5;
			this.player.textColor = 'red';
			this.player.debugText = `X:${this.player.PositionX}, Y:${this.player.PositionY}`;
			const motion = this.player.sprite.body.velocity.clone().normalize();
			this.player.debugText = `Vector: ${motion.x.toFixed(2)}, ${motion.y.toFixed(2)}`;
			
			this.ball.textPositionX = this.ball.sprite.x - this.ball.textDimensions.width / 2;
			this.ball.textPositionY = this.ball.sprite.y - this.ball.sprite.body.halfHeight - this.ball.textDimensions.height - 5;
			this.ball.debugText = `X:${this.ball.PositionX}, Y:${this.ball.PositionY}`;
		}
	}

	createDatGUI() {
		const folderCamera = this.dat.addFolder("Camera");
		folderCamera.add(this.camera, "scrollX", 0, 6144, 1);
		folderCamera.add(this.camera, "scrollY", 0, 2048, 1);
		const folderPlayer = this.dat.addFolder("Player");
		const folderBall = this.dat.addFolder("Ball");
		const folderSettings = this.dat.addFolder("Settings");
		folderSettings.add(this, "development")
			.name("DevMode")
			.onChange((val: boolean) => {
				this.player.textVisible = val;
				this.physics.world.debugGraphic.clear();
				this.physics.world.drawDebug = val;
				this.ball.textVisible = val;
			})
			.setValue(this.development);
		folderSettings.add(this.physics.world, "fps", 10, 2000, 1)
			.name("World FPS")
		let counter = 0;

		const newPlayerFolder = folderPlayer.addFolder(`${this.player.name}${counter}`);

		newPlayerFolder.add(this.player.sprite, "x", 0, 2000, 1);
		newPlayerFolder.add(this.player.sprite, "y", 0, 2000, 1);
		newPlayerFolder.add(this.player, "speed", -1000, 2000, 1);

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
			0,  500, 0.1,
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
}
