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
    private _speed = 200;    // Determines players velocity on all axis.
    private _ballCollider: PHASER.Physics.Arcade.Collider | null = null;
    private facingDirection: PHASER.Math.Vector2;
    private keyCenter?: Phaser.Input.Keyboard.Key;
    private keyAction?: Phaser.Input.Keyboard.Key;
    private keyShoot?: Phaser.Input.Keyboard.Key;
    private mouse!: Phaser.Input.Pointer;
    private destination!: Phaser.Math.Vector2 | null;
    private destinationSprite: Phaser.GameObjects.Sprite;
    private destinationSpriteTween!: Phaser.Tweens.Tween;
    public sprite!: Phaser.Physics.Arcade.Sprite;
    public inputKeys: Array<GameInput> = [];
    public ballOffset: number = 30;

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
        this.destinationSprite = this.scene.add.sprite(0, 0, "cursor");
        this.destinationSprite.setActive(false);
        this.destinationSpriteTween = this.scene.tweens.add({
            targets: this.destinationSprite,
            alpha: {from: 1, to: 0},
            loop: 0,
            duration: 2000,
            ease: Phaser.Math.Easing.Linear,
            onComplete: () => {
                this.destinationSprite
                    .setActive(false)
                    .setPosition(0, 0);
            }
        });
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
                                          this.destination.y, this._speed);
                this.destinationSprite.setActive(true);
                this.destinationSprite.setPosition(this.destination.x, this.destination.y);
                this.destinationSprite
                    .play("cursor_destination")
                    .setScale(2)
                    .setAlpha(1);
                
                this.destinationSpriteTween.restart();
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
        this.facingDirection = motionVector;
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

        // Stop player movement when target destination is reached.
        if(!this.destination){
            this.sprite.stop();
            this.sprite
                 .setVelocity(0)
                 .setAcceleration(0);
        } else {
            // Delete destination vector when reached.
            this.destination = this.position.distance(this.destination) <= 20 
            ? null 
            : this.destination;
        }
    }

    public get PositionX(){
        return Number.parseInt(`${this.sprite.x}`);
    }

    public get PositionY(){
        return Number.parseInt(`${this.sprite.y}`);
    }

    public get position(): PHASER.Math.Vector2 {
        return new PHASER.Math.Vector2(this.sprite.x, this.sprite.y);
    }

    public direction(): PHASER.Math.Vector2 {
        return this.facingDirection.normalize();
    }

    /**
     * Calculate ball position, when in players possession.
     */
    public ballJugglePosition(): PHASER.Math.Vector2 {
        let feetPos = new Phaser.Math.Vector2(this.position.x, 
                                              this.position.y + this.sprite.body.halfHeight);
        let facing = this.direction().scale(this.ballOffset);

        return feetPos.add(facing);
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

        // Update player animation and move sprite.
        this.move();
    }
}