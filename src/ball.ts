import * as PHASER from "phaser";
import { Player } from "./player";

export class Ball {
    private owner: Player|undefined;

    public constructor(public sprite: PHASER.Types.Physics.Arcade.SpriteWithDynamicBody) {
    }

    public setOwner(owner: Player|undefined){
        this.owner = owner;
    }

    public updatePosition(){
        if(this.owner){
            let pos = this.owner.ballJugglePosition();
            this.sprite.x = pos.x;
            this.sprite.y = pos.y;
        }
    }
}