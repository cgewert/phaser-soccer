import * as PHASER from "phaser";
import { DebugGameObject } from "./base/debug-game-object";
import { GameInput } from "./models/input";
import { Scene } from "./scenes/scene";

/*
 *  Describing all possible player actions.
 */
export const enum PlayerActions {
	shoot = 'SHOOT',
	push = 'PUSH',
	special_a = 'SPECIAL_A',
	special_b = 'SPECIAL_B',
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
    public static readonly BALL_SHOOT_POWER = 1000;
    public static readonly SHOOT_CIRCLE_ELEMENTS = 32;
    public static readonly SHOOT_CIRCLE_RADIUS = 300;
    private _name: string;
    private _speed = 200;    // Determines players velocity on all axis.
    private _ballCollider: PHASER.Physics.Arcade.Collider | null = null;
    private facingDirection: PHASER.Math.Vector2;
    private keyCenter?: Phaser.Input.Keyboard.Key;
    private keySpecialA?: Phaser.Input.Keyboard.Key;
    private keySpecialB?: Phaser.Input.Keyboard.Key;
    private keyShoot?: Phaser.Input.Keyboard.Key;
    private keyPush?: Phaser.Input.Keyboard.Key;
    private mouse!: Phaser.Input.Pointer;
    private destination!: Phaser.Math.Vector2 | null;
    private destinationSprite: Phaser.GameObjects.Sprite;
    private destinationSpriteTween!: Phaser.Tweens.Tween;
    // private shootCircleTween!: Phaser.Tweens.Tween;
    public sprite!: Phaser.Physics.Arcade.Sprite;
    public inputKeys: Array<GameInput> = [];
    public ballOffset: number = 30;
    private isShotState =  true;
    private shot_circle = new PHASER.Geom.Circle(0, 0, Player.SHOOT_CIRCLE_RADIUS);
    private circleElements = this.scene.physics.add.group({
        key: "circle_marker", 
        repeat: Player.SHOOT_CIRCLE_ELEMENTS,
        setAlpha: {value: 0.8},
        setRotation: {value: Math.PI / 2, step: Math.PI * 2 / Player.SHOOT_CIRCLE_ELEMENTS}
    });

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
        Phaser.Actions.PlaceOnCircle(this.circleElements.getChildren(), this.shot_circle);
        // this.shootCircleTween = this.scene.tweens.addCounter({
        //     from: 220,
        //     to: 100,
        //     duration: 3000,
        //     delay: 2000,
        //     ease: 'Sine.easeInOut',
        //     repeat: -1,
        //     yoyo: false
        // });
        this.destination = null;
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
			name: PlayerActions.special_a, inputKey: this.scene.input.keyboard.addKey(
			Phaser.Input.Keyboard.KeyCodes.Y,
		)});
		this.inputKeys.push({
			name: PlayerActions.special_b, inputKey: this.scene.input.keyboard.addKey(
			Phaser.Input.Keyboard.KeyCodes.X,
		)});
        this.inputKeys.push({
			name: PlayerActions.push, inputKey: this.scene.input.keyboard.addKey(
			Phaser.Input.Keyboard.KeyCodes.C,
		)});
        this.inputKeys.push({
            name: PlayerActions.shoot, inputKey: this.scene.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.V,
        )});
		this.inputKeys.push({
			name: PlayerActions.center, inputKey: this.scene.input.keyboard.addKey(
			Phaser.Input.Keyboard.KeyCodes.SPACE,
		)});

        this.keyCenter = this.inputKeys.find((value, idx, obj) => {return value.name === PlayerActions.center})?.inputKey
		this.keySpecialA = this.inputKeys.find((value, idx, obj) => {return value.name === PlayerActions.special_a})?.inputKey
		this.keySpecialB = this.inputKeys.find((value, idx, obj) => {return value.name === PlayerActions.special_b})?.inputKey
		this.keyShoot = this.inputKeys.find((value, idx, obj) => {return value.name === PlayerActions.shoot})?.inputKey
		this.keyPush = this.inputKeys.find((value, idx, obj) => {return value.name === PlayerActions.push})?.inputKey
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
			const playerDirection = this.direction();
			this.setBallCollider(false);
			const lastOwnerRef = this;
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
        const pointerPosition = new Phaser.Math.Vector2(
            this.scene.input.activePointer.worldX,
            this.scene.input.activePointer.worldY
        );
        const playerPosition = this.position;
        this.shot_circle.setPosition(playerPosition.x, playerPosition.y);
        
        if(this.isShotState){
            this.circleElements.setActive(true);
            this.circleElements.setVisible(true);
            Phaser.Actions.PlaceOnCircle(this.circleElements.getChildren(), this.shot_circle);
            // this.circleElements.rotateAround(this.position, 0.02);
        }

        if(this.keyCenter?.isDown) {
            this.center();
		}

        // Update player animation and move sprite.
        this.move();

        // If not moving look in mouse pointer direction
        if(this.destination === null){
            if(playerPosition.x < pointerPosition.x) {
                this.sprite.setFrame(13); // Look right
                this.shootWhileStillstanding(false);
            }
            if(playerPosition.x > pointerPosition.x) {
                this.sprite.setFrame(7); // Look left
                this.shootWhileStillstanding(true);
            }
        } else {
            if(this.keyShoot?.isDown) {
                this.shoot();
            }
        }
    }

    private shootWhileStillstanding(left: boolean){
        if(this.keyShoot?.isDown && this.scene.ball.owner === this) {
            this.scene.ball.sprite.setVelocityX(Player.BALL_SHOOT_POWER * (left ? -1 : 1));
            // Let player lose ball possession.
			this.scene.ball.owner = null;
        }
    }
}