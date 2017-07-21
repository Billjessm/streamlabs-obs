// This class is used for simplifying math that deals
// with rectangles that can be scaled, including
// negative scales.

export enum AnchorPoint {
  North,
  NorthEast,
  East,
  SouthEast,
  South,
  SouthWest,
  West,
  NorthWest,
  Center
}


// Positions on a positive unit grid
const AnchorPositions = {
  [AnchorPoint.North]: { x: 0.5, y: 0 },
  [AnchorPoint.NorthEast]: { x: 1, y: 0 },
  [AnchorPoint.East]: { x: 1, y: 0.5 },
  [AnchorPoint.SouthEast]: { x: 1, y: 1 },
  [AnchorPoint.South]: { x: 0.5, y: 1 },
  [AnchorPoint.SouthWest]: { x: 0, y: 1 },
  [AnchorPoint.West]: { x: 0, y: 0.5 },
  [AnchorPoint.NorthWest]: { x: 0, y: 0 },
  [AnchorPoint.Center]: { x: 0.5, y: 0.5 }
};


export class ScalableRectangle implements IScalableRectangle {

  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  width: number;
  height: number;
  crop: ICrop;

  private anchor: AnchorPoint;


  constructor(options: IScalableRectangle) {
    this.x = options.x;
    this.y = options.y;
    this.width = options.width;
    this.height = options.height;
    this.scaleX = options.scaleX || 1.0;
    this.scaleY = options.scaleY || 1.0;

    this.crop = {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      ...options.crop
    };

    this.anchor = AnchorPoint.NorthWest;
  }


  get croppedWidth() {
    return this.width - this.crop.left - this.crop.right;
  }


  get croppedHeight() {
    return this.height - this.crop.top - this.crop.bottom;
  }


  get scaledWidth() {
    return this.scaleX * this.croppedWidth;
  }


  get scaledHeight() {
    return this.scaleY * this.croppedHeight;
  }


  get aspectRatio() {
    return this.width / this.height;
  }


  get scaledAspectRatio() {
    return this.scaledWidth / this.scaledHeight;
  }


  setAnchor(anchor: AnchorPoint) {
    // We need to calculate the distance to the new anchor point
    const currentPosition = AnchorPositions[this.anchor];
    const newPosition = AnchorPositions[anchor];

    const deltaX = newPosition.x - currentPosition.x;
    const deltaY = newPosition.y - currentPosition.y;

    this.x += deltaX * this.scaledWidth;
    this.y += deltaY * this.scaledHeight;

    this.anchor = anchor;
  }


  // Executes the function with a specific anchor point, after
  // which it is returned to its original anchor point.
  withAnchor(anchor: AnchorPoint, fun: Function) {
    const oldAnchor = this.anchor;
    this.setAnchor(anchor);

    fun();

    this.setAnchor(oldAnchor);
  }


  // Normalizes this rectangle into a rectangle that does not
  // have any negative scales.  It returns a function that
  // can be used to undo the operation.
  normalize(): () => void {
    const xFlipped = this.scaleX < 0;
    const yFlipped = this.scaleY < 0;

    if (xFlipped) this.flipX();
    if (yFlipped) this.flipY();

    return () => {
      if (xFlipped) this.flipX();
      if (yFlipped) this.flipY();
    };
  }


  // This is a convenience method that will run the passed
  // function in a normalized environment, and then return
  // it back to its original state afterwards.
  normalized(fun: Function) {
    const denormalize = this.normalize();

    fun();

    denormalize();
  }


  flipX() {
    this.scaleX *= -1;
    this.x -= this.scaledWidth;

    const leftCrop = this.crop.left;
    this.crop.left = this.crop.right;
    this.crop.right = leftCrop;
  }


  flipY() {
    this.scaleY *= -1;
    this.y -= this.scaledHeight;

    const topCrop = this.crop.top;
    this.crop.top = this.crop.bottom;
    this.crop.bottom = topCrop;
  }


  // Stretches this rectangle across the provided
  // rectangle.  Aspect ratio may not be preserved.
  stretchAcross(rect: ScalableRectangle) {
    // Normalize both rectangles for this operation
    this.normalized(() => rect.normalized(() => {
      this.x = rect.x;
      this.y = rect.y;
      this.scaleX = rect.scaledWidth / this.width;
      this.scaleY = rect.scaledHeight / this.height;
    }));
  }


  // Fits this rectangle inside the provided rectangle
  // while preserving the aspect ratio of this rectangle.
  fitTo(rect: ScalableRectangle) {
    // Normalize both rectangles for this operation
    this.normalized(() => rect.normalized(() => {
      if (this.aspectRatio > rect.scaledAspectRatio) {
        this.scaleX = rect.scaledWidth / this.width;
        this.scaleY = this.scaleX;
      } else {
        this.scaleY = rect.scaledHeight / this.height;
        this.scaleX = this.scaleY;
      }

      this.centerOn(rect);
    }));
  }


  // Centers this rectangle on the provided rectangle
  // without changing the scale.
  centerOn(rect: ScalableRectangle) {
    // Anchor both rectangles in the center
    this.withAnchor(AnchorPoint.Center, () => {
      rect.withAnchor(AnchorPoint.Center, () => {
        this.x = rect.x;
        this.y = rect.y;
      });
    });
  }

}
