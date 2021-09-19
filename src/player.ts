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
    if(direction.x > 0){
        return PlayerAnimations.right;
    }
    else if(direction.x < 0){
        return PlayerAnimations.left;
    }
    if(direction.y < 0){
        return PlayerAnimations.up;
    }
    else if(direction.y > 0){
        return PlayerAnimations.down;
    }

    return PlayerAnimations.stop;
}


export class Player {
    private readonly speed: number = 10;
    private facingDirection: PHASER.Math.Vector2;

    public constructor(public sprite: PHASER.Types.Physics.Arcade.SpriteWithDynamicBody) {
        this.facingDirection = new PHASER.Math.Vector2(0,0);
    }

    public move(direction: PHASER.Math.Vector2){
        let speedDirection = direction.scale(this.speed);
        this.updateSpriteAnimation(speedDirection);
        this.sprite.setVelocity(speedDirection.x, speedDirection.y);
        if(speedDirection.length()>0){
            this.facingDirection = speedDirection;
        }
    }

    private updateSpriteAnimation(direction: PHASER.Math.Vector2){
        if(direction.length() <= 0){
            this.sprite.stop();
        }

        let currentAnimation = this.sprite.anims.getName();
        let newAnimation = animationFor(direction);

        if(currentAnimation!=newAnimation){
            this.sprite.play(newAnimation);
        }
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
        feetPos.y += this.sprite.height/2;
        let facing = this.direction();
        let ballPos = feetPos.add(facing.scale(ballOffset));
        return ballPos;
    }
}