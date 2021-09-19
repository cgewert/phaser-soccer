import * as PHASER from "phaser";

const enum PlayerAnimations{
    right = "walk_right1",
    left = "walk_left1",
    up = "walk_up1",
    down = "walk_down1",
    stop = "walk_stop1",
}

/**
 * Returns an animation for a given direction.
 * direction: PHASER.Math.Vector2
 * retrun: PlayerAnimations
*/
function animationFor(direction: PHASER.Math.Vector2) {
    let xDeflection = Math.abs(direction.x);
    let yDeflection = Math.abs(direction.y);
    if (xDeflection>yDeflection){
        if(direction.x > 0){
            return PlayerAnimations.right;
        }
        else if(direction.x < 0){
            return PlayerAnimations.left;
        }
    }else if(xDeflection<yDeflection){
        if(direction.y < 0){
            return PlayerAnimations.up;
        }
        else if(direction.y > 0){
            return PlayerAnimations.down;
        }
    }
    return PlayerAnimations.stop;
}

export class Player {
    private readonly speed: number = 20;
    public constructor(public sprite: PHASER.Types.Physics.Arcade.SpriteWithDynamicBody) {
    }

    public move(direction: PHASER.Math.Vector2){
        let speedDirection = direction.scale(this.speed);
        this.updateSpriteAnimation(speedDirection);
        this.sprite.setVelocity(speedDirection.x, speedDirection.y);
    }

    private updateSpriteAnimation(direction: PHASER.Math.Vector2){
        if(direction.length() <= 0){
            this.sprite.stop();
        }

        let currentAnimation = this.sprite.anims.getName();
        let newAnimation = animationFor(direction);;

        if(currentAnimation!=newAnimation){
            this.sprite.play(newAnimation);
        }
    }

    public position(): PHASER.Math.Vector2 {
        return new PHASER.Math.Vector2(this.sprite.x, this.sprite.y);
    }
}