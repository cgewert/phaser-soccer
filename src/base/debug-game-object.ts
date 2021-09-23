export interface ScrollFactor {
    x: number,
    y: number
}

export interface TextDimensions {
    width: number,
    height: number
}

export class DebugGameObject{
    private _gameobject: Phaser.GameObjects.Text;
    
    public constructor(private scene: Phaser.Scene) {
        this._gameobject = this.scene.add.text(
            this.textPosition.x, 
            this.textPosition.y, 
            this.debugText
        );
        this.textColor = "WHITE";
        this.debugText = `X:${this._gameobject.x}, Y:${this._gameobject.y}`;
        this.scrollFactor = {x:1, y:1};
    }

    public get textSize() {
        return {width: this._gameobject.width, height: this._gameobject.height};
    }

    public set textSize(value:{width: number, height: number}) {
        this._gameobject.setDisplaySize(value.width, value.height);
    }

    public get scrollFactor() {
        const x = this._gameobject.scrollFactorX;
        const y = this._gameobject.scrollFactorY;
        const retVal: ScrollFactor = {x, y};

        return retVal;
    }
    
    public set scrollFactor(value: ScrollFactor) {
        this._gameobject.setScrollFactor(value.x, value.y);
    }

    public get debugText() {
        return this._gameobject?.text;
    }

    public set debugText(text: string) {
        this._gameobject.setText(text);
    }

    public get textPosition() {
        return new Phaser.Math.Vector2(this._gameobject?.x, this._gameobject?.y);
    }

    public get textPositionX() {
        return this._gameobject.x;
    }

    public get textPositionY() {
        return this._gameobject.y;
    }

    public set textPosition(position: Phaser.Math.Vector2) {
        this._gameobject.x = position.x;
        this._gameobject.y = position.y;
    }

    public set textPositionX(position: number) {
        this._gameobject.x = position;
    }

    public set textPositionY(position: number) {
        this._gameobject.y = position;
    }

    public set textColor(value: string){
        this._gameobject.setColor(value);
    }

    public set textVisible(visible: boolean){
        this._gameobject.visible = visible;
    }

    public get textDimensions() : TextDimensions {
        return { width: this._gameobject.width, height: this._gameobject.height }
    }
}