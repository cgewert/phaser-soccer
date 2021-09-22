import * as PHASER from "phaser";
import { DebugGameObject } from "./base/debug-game-object";
import { Player } from "./player";

export class Ball extends DebugGameObject {
    private owner: Player | undefined;

    public constructor(scene: PHASER.Scene, public sprite: PHASER.Types.Physics.Arcade.SpriteWithDynamicBody) {
        super(scene);
    }

    public setOwner(owner: Player | undefined){
        this.owner = owner;
    }

    public updatePosition(){
        if(this.owner){
            let pos = this.owner.ballJugglePosition();
            this.sprite.x = pos.x;
            this.sprite.y = pos.y;
        }
    }

    public get PositionX(){
        return Number.parseInt(this.sprite.x.toFixed(0));
    }

    public get PositionY(){
        return Number.parseInt(this.sprite.y.toFixed(0));
    }
}