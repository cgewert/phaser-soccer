import * as PHASER from "phaser";
import { DebugGameObject } from "./base/debug-game-object";
import { Player } from "./player";
import { Scene } from "./scenes/scene";

export class Ball extends DebugGameObject {
    private _owner: Player | null;

    public constructor(scene: Scene, public sprite: PHASER.Types.Physics.Arcade.SpriteWithDynamicBody) {
        super(scene);
        this._owner =  null;
    }

    public set owner(player: Player | null) {
        this._owner = player;
    }

    public get owner() {
        return this._owner;
    }

    public updatePosition() {
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