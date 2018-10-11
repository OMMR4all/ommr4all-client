import {PolyLine, Rect} from '../../geometry/geometry';

export class Region {
  private _parent: Region;
  protected _AABB = new Rect();
  protected _AABBupdateRequired = true;
  protected _children: Array<Region> = [];
  public coords = new PolyLine([]);

  constructor(
  ) {
  }

  attachToParent(parent: Region): void {
    if (this._parent === parent) { return; }
    this.detachFromParent();
    this._parent = parent;
    parent.attachChild(this);
  }

  detachFromParent() {
    if (this._parent) {
      this._parent.detachChild(this);
      this._parent = null;
    }
  }

  attachChild(child: Region) {
    if (!child) { return; }
    if (this._children.indexOf(child) < 0) {
      this._children.push(child);
      child.attachToParent(this);
    }
  }

  detachChild(child: Region) {
    if (!child) { return; }
    const idx = this._children.indexOf(child);
    if (idx >= 0) {
      this._children.splice(idx, 1);
      child.detachFromParent();
    }
  }

  get AABB() { return this._AABB; }

  update() {
    this._updateAABB();
  }

  _prepareRender() {
    this._AABBupdateRequired = true;
    this._children.forEach(c => c._prepareRender());
  }

  _updateAABB() {
    if (!this._AABBupdateRequired) { return; }
    this._AABBupdateRequired = false;

    this._AABB = this.coords.aabb();
    this._children.forEach(c => {
      c._updateAABB();
      this._AABB = this._AABB.union(c._AABB);
    });
  }
}
