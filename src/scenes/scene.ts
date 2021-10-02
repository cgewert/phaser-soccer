import * as PHASER from "phaser";
import * as DAT from "dat.gui";
import { Player, PlayerAnimations } from "../player";
import { Ball } from "../ball";
export class Scene extends PHASER.Scene {
	public static CAMERA_ZOOM_VELOCITY = 0.080;
	public static CAMERA_ZOOM_MAXIMUM = 1.25;
	public static CAMERA_ZOOM_MINIMUM = 0.5;

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
	private miniCam!: PHASER.Cameras.Scene2D.Camera;
	public camera!: PHASER.Cameras.Scene2D.Camera;
	private player!: Player;
	public ball!: Ball;
	private dat = new DAT.GUI({ name: "Soccer debug GUI" });
	private development = true ;
	private isNotDefaultCursor = false;
	private roundTime = 1000 * 60 * 5;
	private textRoundTime!: Phaser.GameObjects.Text;
	private scoreLeft = 0;
	private scoreRight = 0;
	private miniCamGraphics!: Phaser.GameObjects.Graphics;

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
		this.load.image("ui_shoot", "assets/gfx/ui/boot1.png");
		this.load.image("ui_skills", "assets/gfx/ui/skills.png");
	}

	public create() {
		const map = this.make.tilemap({
			key: "level",
			tileWidth: 64,
			tileHeight: 64,
		});
		const tileSet = map.addTilesetImage("Grassland", "tiles1");
		const layerGras = map.createLayer("Background", tileSet, 0, 0)//.setPipeline('Light2D');
		const layerGoalColliderLeft = map.createLayer("goalColliderLeft", tileSet, 0, 0);
		const layerGoalColliderRight = map.createLayer("goalColliderRight", tileSet, 0, 0);
		const layerGoals = map.createLayer("Foreground", tileSet, 0, 0)//.setPipeline('Light2D');
		layerGoals.setCollisionByExclusion([-1], true);
		layerGoalColliderLeft.setCollisionByExclusion([-1], true);
		layerGoalColliderRight.setCollisionByExclusion([-1], true);
		layerGras.skipCull = true;
		layerGoals.skipCull = true;
		this.ball = new Ball(this);
		this.ball.sprite.setName("Ball");
		// this.lights.enable();
    	// this.lights.setAmbientColor(0xffffff);

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
		//this.player.light = this.lights.addLight(0, 0, 150, 0x00ff00);
		// Register player collision handlers.
		this.physics.add.collider(this.player.sprite, layerGoals);
		this.player.ballCollider = this.physics.add.overlap(this.player.sprite, 
															this.ball.sprite, 
															() => {
				this.ball.owner = this.player;
				this.ball.sprite.setVelocity(0);
				this.ball.sprite.setAcceleration(0);
			});
		
		this.physics.add.collider(this.ball.sprite, layerGoalColliderRight, () => {			
			this.scoreLeft++;
		});
		this.physics.add.collider(this.ball.sprite, layerGoalColliderLeft, () => {			
			this.scoreRight++;
		});

		this.createDebugTexts();
		this.physics.add.collider(layerGoals, this.ball.sprite);
		this.camera = this.cameras.main;
		this.camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
		this.camera.setRoundPixels(true);
		this.input.mouse.preventDefaultWheel = true; 
		this.input.on('wheel', (pointer: any, over: any, deltaX: number, deltaY: number, deltaZ: number) => {
			this.camera.setZoom(this.camera.zoom - Scene.CAMERA_ZOOM_VELOCITY * Math.sign(deltaY));
			this.camera.zoom = Phaser.Math.Clamp(
				this.camera.zoom, Scene.CAMERA_ZOOM_MINIMUM, Scene.CAMERA_ZOOM_MAXIMUM
			);
		});
		this.createMiniMap();
		this.createDatGUI();
		this.input.setDefaultCursor("url(assets/gfx/cursors/default.png), pointer");
		this.textRoundTime = this.add.text(
			this.camera.width / 2, 
			20,
			"1st 0:0 19:39", 
			{ fontFamily: 'WorkSans', fontSize: "42px", stroke: 'black', strokeThickness: 2}
		).setScrollFactor(0);
		this.initializeUI();
	}

	createMiniMap() {
		this.miniCam = this.cameras.add(0, this.camera.displayHeight - 200)
			.setName('Minicam')
			.setSize(300, 200)
			.setZoom(0.1);

		this.miniCamGraphics = this.add.graphics().setScrollFactor(0);
		this.miniCamGraphics.x = this.miniCam.x;
		this.miniCamGraphics.y = this.miniCam.y;

		this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
			this.miniCam.setScroll(pointer.worldX, pointer.worldY);
		});
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
		this.roundTime -= delta;
		this.roundTime = Math.max(0, this.roundTime);
		let secs = this.roundTime / 1000;
		const mins = secs / 60;
		secs = secs % 60;
		const formattedTime = `${mins.toFixed().padStart(2, "0")}:${secs.toFixed().padStart(2, "0")}`;

		this.textRoundTime.setText(`1st ${this.scoreLeft}:${this.scoreRight} ${formattedTime}`);
		this.player.update();
		this.ball.update();

		const camScrollSpeed = 2000;
		const camOffset = 10;
		
		if(this.isNotDefaultCursor){
			this.input.setDefaultCursor("url(assets/gfx/cursors/default.png), pointer");
		}
		// Right Bounds
		if(this.input.activePointer.x >= this.camera.x + this.camera.width - 40){
			this.camera.scrollX += camScrollSpeed * delta / 1000;
			this.input.setDefaultCursor("url(assets/gfx/cursors/scroll_indicator_right.png), pointer");
			this.updateCursorState();
		}
		// Left Bounds
		if(this.input.activePointer.x <= this.camera.x + camOffset){
			this.camera.scrollX -= camScrollSpeed * delta / 1000;
			this.input.setDefaultCursor("url(assets/gfx/cursors/scroll_indicator_left.png), pointer");
			this.updateCursorState();
		}
		// Bottom Bounds
		if(this.input.activePointer.y >= this.camera.y + this.camera.height - 40){
			this.camera.scrollY += camScrollSpeed * delta / 1000;
			this.input.setDefaultCursor("url(assets/gfx/cursors/scroll_indicator_down.png), pointer");
			this.updateCursorState();
		}
		// Top Bounds
		if(this.input.activePointer.y <= this.camera.y + camOffset){
			this.camera.scrollY -= camScrollSpeed * delta / 1000;
			this.input.setDefaultCursor("url(assets/gfx/cursors/scroll_indicator_up.png), pointer");
			this.updateCursorState();
		}

		this.miniCamGraphics.clear();
		this.miniCamGraphics.fillStyle(0x333333, 0.8);
		let boundsRectWithOffset = this.miniCam.getBounds()
		boundsRectWithOffset.width = this.miniCam.width + 1;
		boundsRectWithOffset.height = this.miniCam.height + 1;
		this.miniCamGraphics.fillRectShape(boundsRectWithOffset);

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

	private updateCursorState(){
		if(!this.isNotDefaultCursor){
			this.isNotDefaultCursor = true;
		}
	}

	private initializeUI() {
		const ui_skills = this.add.image(this.camera.width / 2, this.camera.height, "ui_skills")
			.setScrollFactor(0)
			.setScale(1,1)
			.setAlpha(1.0);
		const width = ui_skills.width;
		const height = ui_skills.height;
		ui_skills.setPosition(this.camera.width / 2, this.camera.height - ui_skills.displayHeight / 2 + 12);
		const boots = this.add.image(0, 0, "ui_shoot").setScrollFactor(0).setScale(2).setTint(0x00ff00);
		//boots.setPosition(ui_skills.x, ui_skills.y + 76);
		Phaser.Display.Align.In.Center(boots, ui_skills);
		const labelShootKey = this.add.text(0,0,"V", { fontFamily: 'WorkSans', fontSize: "32px", stroke: 'black', strokeThickness: 2, color: "white"});
		labelShootKey.setScrollFactor(0);
		Phaser.Display.Align.In.BottomCenter(labelShootKey, boots);
	}
}

