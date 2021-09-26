import * as PHASER from "phaser";
import { DebugGameObject } from "./base/debug-game-object";
import { Player } from "./player";
import { Scene } from "./scenes/scene";

export class Ball extends DebugGameObject {
    private _owner: Player | null;
    public sprite: PHASER.Types.Physics.Arcade.SpriteWithDynamicBody;

    public constructor(scene: Scene) {
        super(scene);
        this.sprite = this.scene.physics.add.sprite(-50 + 16 * 64 - 10, 7 * 64, "ball", 0)
			.setScale(0.13);
		this.sprite.body
			.setFriction(1, 1)
			.setBounce(.5, .5)
			.setDrag(230, 230)
			.setCollideWorldBounds(true)
			.setCircle(117)
			.debugShowVelocity = true;
        this._owner =  null;
    }

    public set owner(player: Player | null) {
        this._owner = player;
    }

    public get owner() {
        return this._owner;
    }

    public update() {
        if(this.owner){
            let pos = this.owner.ballJugglePosition();
            this.sprite.x = pos.x;
            this.sprite.y = pos.y;
        }
    }

    public get PositionX(){
        return Number.parseInt(`${this.sprite.x}`);
    }

    public get PositionY(){
        return Number.parseInt(`${this.sprite.y}`);
    }
}