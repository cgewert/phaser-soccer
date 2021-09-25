import * as PHASER from "phaser";
import { DebugGameObject } from "./base/debug-game-object";
import { GameInput } from "./models/input";
import { Scene } from "./scenes/scene";

/*
 *  Describing all possible player actions.
 */
export const enum PlayerActions {
	shoot = 'SHOOT',
	special = 'AKSCHN',
	move_up = 'MOVE_UP',
	move_down = 'MOVE_DOWN',
	move_left = 'MOVE_LEFT',
	move_right = 'MOVE_RIGHT',
    center = 'CENTER'
}

/*
 *  Describing all possible player animations.
 */
export const enum PlayerAnimations {
    right = "walk_right",
    left = "walk_left",
    up = "walk_up",
    down = "walk_down",
}

/**
 * Class representing individual player instances.
 */
export class Player extends DebugGameObject {
    public static readonly BALL_COLLIDER_TIMEOUT = 250;
    public static readonly BALL_SHOOT_POWER = 1800;
    private _name: string;
    private _speed = 25;    // Determines players velocity on all axis.
    private _ballCollider: PHASER.Physics.Arcade.Collider | null = null;
    private facingDirection: PHASER.Math.Vector2;
    private keyCenter?: Phaser.Input.Keyboard.Key;
    private keyAction?: Phaser.Input.Keyboard.Key;
    private keyShoot?: Phaser.Input.Keyboard.Key;
    private mouse!: Phaser.Input.Pointer;
    private destination!: Phaser.Math.Vector2 | null;
    private destination_sprite?: Phaser.GameObjects.Sprite;
    public sprite!: Phaser.Physics.Arcade.Sprite;
    public inputKeys: Array<GameInput> = [];

    public constructor(scene: Scene, name="Sir Knumskull") {
        super(scene);
        this.sprite = this.scene.physics.add.sprite(250, 450, "character", 12);
        this.sprite.setScale(1.5)
            .setSize(this.sprite.width - 20, this.sprite.height - 10)
            .setCollideWorldBounds(true);
        this.facingDirection = new PHASER.Math.Vector2(0,0);
        this._name = name;
        this.initializeInput();
        this.initializePlayerAnims();
    }

    public initializePlayerAnims(){
        const spriteSheetKey = 'character';

		this.scene.anims.create({
			key: PlayerAnimations.down,
			frames: this.scene.anims.generateFrameNumbers(spriteSheetKey, {
				frames: [0, 1, 2],
			}),
			frameRate: 8,
			repeat: -1,
		});

		this.scene.anims.create({
			key: PlayerAnimations.up,
			frames: this.scene.anims.generateFrameNumbers(spriteSheetKey, {
				frames: [18, 19, 20],
			}),
			frameRate: 8,
			repeat: -1,
		});

		this.scene.anims.create({
			key:  PlayerAnimations.left,
			frames: this.scene.anims.generateFrameNumbers(spriteSheetKey, {
				frames: [6, 7, 8],
			}),
			frameRate: 8,
			repeat: -1,
		});

		this.scene.anims.create({
			key: PlayerAnimations.right,
			frames: this.scene.anims.generateFrameNumbers(spriteSheetKey, {
				frames: [12, 13, 14],
			}),
			frameRate: 8,
			repeat: -1,
		});
	}

    initializeInput() {
		this.mouse = this.scene.input.activePointer;
		this.scene.input.on("pointerup", (ev: any) => {
			if(this.mouse.rightButtonReleased()){
                this.destination = new PHASER.Math.Vector2(this.mouse.worldX, this.mouse.worldY);
				this.scene.physics.moveTo(this.sprite, this.destination.x, 
                                          this.destination.y, 200);
                if(this.destination_sprite){
                    this.destination_sprite.destroy();
                }
                this.destination_sprite = this.scene.add.sprite(this.destination.x, this.destination.y, "cursor");
                this.destination_sprite.play("cursor_destination").setScale(2);
            }
		});

		this.inputKeys.push({
			name: PlayerActions.special, inputKey: this.scene.input.keyboard.addKey(
			Phaser.Input.Keyboard.KeyCodes.E,
		)});
		this.inputKeys.push({
			name: PlayerActions.center, inputKey: this.scene.input.keyboard.addKey(
			Phaser.Input.Keyboard.KeyCodes.SPACE,
		)});
		this.inputKeys.push({
			name: PlayerActions.move_up, inputKey: this.scene.input.keyboard.addKey(
			Phaser.Input.Keyboard.KeyCodes.W,
		)});
		this.inputKeys.push({
			name: PlayerActions.move_right, inputKey: this.scene.input.keyboard.addKey(
			Phaser.Input.Keyboard.KeyCodes.D,
		)});
		this.inputKeys.push({
			name: PlayerActions.move_down, inputKey: this.scene.input.keyboard.addKey(
			Phaser.Input.Keyboard.KeyCodes.S,
		)});
		this.inputKeys.push({
			name: PlayerActions.move_left, inputKey: this.scene.input.keyboard.addKey(
			Phaser.Input.Keyboard.KeyCodes.A,
		)});

        this.keyCenter = this.inputKeys.find((value, idx, obj) => {return value.name === PlayerActions.center})?.inputKey
		this.keyAction = this.inputKeys.find((value, idx, obj) => {return value.name === PlayerActions.special})?.inputKey
		this.keyShoot = this.inputKeys.find((value, idx, obj) => {return value.name === PlayerActions.shoot})?.inputKey
	}

    public get ballCollider(): PHASER.Physics.Arcade.Collider | null {
        return this._ballCollider;
    }

    public set ballCollider(value: PHASER.Physics.Arcade.Collider | null) {
        this._ballCollider = value;
    }

    public get speed(){
        return this._speed;
    }

    public set speed(value: number){
        this._speed = value;
    }

    public get name(){
        return this._name;
    }

    public set name(value: string){
        this._name = value;
    }

    // Calculate player walking animation based on his facing direction.
    public move() {
        const motionVector = this.sprite.body.velocity.clone().normalize();
        const currentAnimation = this.sprite.anims.getName();
        let newAnimation: PlayerAnimations = PlayerAnimations.up;
        
        if(motionVector.x >= 0) {
            newAnimation = PlayerAnimations.right;
        }
        if(motionVector.x < 0) {
            newAnimation = PlayerAnimations.left;
        }

        // If movement on horizontal axis decreases check if we switch to up or down animations.
        if(motionVector.x < 0.4 && motionVector.x > -0.4 && motionVector.y <= 0) {
            newAnimation = PlayerAnimations.up;
        }
        if(motionVector.x < 0.4 && motionVector.x > -0.4 &&  motionVector.y >= 0) {
            newAnimation = PlayerAnimations.down;
        }

        if(currentAnimation === newAnimation){
            this.sprite.play(newAnimation, true);
        } else {
            this.sprite.play(newAnimation);
        }
        
    }

    public get PositionX(){
        return Number.parseInt(`${this.sprite.x}`);
    }

    public get PositionY(){
        return Number.parseInt(`${this.sprite.y}`);
    }

    public position(): PHASER.Math.Vector2 {
        return new PHASER.Math.Vector2(this.sprite.x, this.sprite.y);
    }

    public direction(): PHASER.Math.Vector2 {
        return this.facingDirection.normalize();
    }

    /**
     * ballJugglePosition
     */
    public ballJugglePosition(): PHASER.Math.Vector2 {
        const ballOffset = 30;
        let feetPos = this.position();
        feetPos.y += this.sprite.body.halfHeight;
        let facing = this.direction();
        let ballPos = feetPos.add(facing.scale(ballOffset));
        return ballPos;
    }

    public setBallCollider(active: boolean) {
        if(this.ballCollider) {
            this.ballCollider.active = active;
        }
    }

    // Centers cam on this player.
    public center(){
        this.scene.camera.centerOn(this.PositionX, this.PositionY);
    }

    shoot() {
		if(this.scene.ball.owner === this){
			const playerDirection = this.scene.ball.owner.direction();
			this.scene.ball.owner.setBallCollider(false);
			const lastOwnerRef = this.scene.ball.owner;
			setTimeout(() => {
				lastOwnerRef?.setBallCollider(true);
			}, Player.BALL_COLLIDER_TIMEOUT);
			this.scene.ball.sprite.setVelocity(Player.BALL_SHOOT_POWER * playerDirection.x, 
										 Player.BALL_SHOOT_POWER * playerDirection.y);

			// Let player lose ball possession.
			this.scene.ball.owner = null;
		}	
	}

    public update() {
        if(this.keyCenter?.isDown) {
            this.center();
		}

        // if(direction.length() <= 0){
        //     this.sprite.stop();
        //     return; // Stop animation instead of play new or update.
        // }

        // const newAnimation = Player.animationFor(direction);
        // if(this.sprite.anims.getName() != newAnimation && newAnimation){
        //     this.sprite.play(newAnimation);
        // }

        // TODO: Stop player movement when destination is reached.
        if(this.destination){
            // Update player animation
            this.move();

            // if(this.destination.x <= this.sprite.body.x){
            //     /*this.sprite
            //         .setVelocityX(0)
            //         .setAccelerationX(0);*/
            //     //this.destination = null;
            //     this.sprite.stop();
            //     this.destination = null;
            // }
            // if(this.destination.y <= this.sprite.body.y){
            //     /*this.sprite
            //         .setVelocityY(0)
            //         .setAccelerationY(0);*/
            //     this.sprite.stop();
            //     this.destination = null;
            // }
        }
    }
}