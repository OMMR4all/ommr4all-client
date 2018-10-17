import {Point, PolyLine, Rect} from '../../geometry/geometry';
import {IdGenerator, IdType} from './id-generator';

export class Region {
  private _parent: Region;
  protected _AABB = new Rect();
  protected _AABBupdateRequired = true;
  protected _children: Array<Region> = [];
  public coords = new PolyLine([]);

  constructor(
    private _idType: IdType,
    protected _id: string = '',
  ) {
    if (_id.length === 0) {
      this._id = IdGenerator.newId(this._idType)
    }
  }

  parentOfType(type) {
    let current: Region = this;
    while (current._parent && !(current instanceof type)) {
      current = current._parent;
    }
    if (current instanceof type) { return current; }
    return null;
  }

  get parent() { return this._parent; }

  root() {
    let current: Region = this;
    while (current._parent) { current = current._parent; }
    return current;
  }

  attachToParent(parent: Region): void {
    if (this._parent === parent) { return; }
    this.detachFromParent();
    this._parent = parent;
    if (parent) { parent.attachChild(this); }
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
      this._AABBupdateRequired = true;
      child.attachToParent(this);
    }
  }

  detachChild(child: Region) {
    if (!child) { return; }
    const idx = this._children.indexOf(child);
    if (idx >= 0) {
      this._children.splice(idx, 1);
      this._AABBupdateRequired = true;
      child.detachFromParent();
    }
  }

  get id() { return this._id; }
  get AABB() { this._updateAABB(); return this._AABB; }

  distanceSqrToPoint(p: Point): number {
    return this.AABB.distanceSqrToPoint(p);
  }

  refreshIds() {
    this._id = IdGenerator.newId(this._idType);
    if (this._parent) { this._id = this._parent.id + ':' + this._id; }
    this._children.forEach(c => c.refreshIds());
  }


  update() {
    this._updateAABB();
  }

  regionByCoords(coords: PolyLine): Region {
    if (this.coords === coords) { return this; }
    for (const c of this._children) {
      const r = c.regionByCoords(coords);
      if (r) { return r; }
    }
    return null;
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
