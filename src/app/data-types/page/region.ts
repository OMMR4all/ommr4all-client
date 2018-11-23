import {Point, PolyLine, Rect} from '../../geometry/geometry';
import {IdGenerator, IdType} from './id-generator';
import {EventEmitter, Output} from '@angular/core';

export class Region {
  @Output() childAttached = new EventEmitter<Region>();
  @Output() childDetached = new EventEmitter<Region>();
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

  attachToParent(parent: Region, idx: number = -1): void {
    if (this._parent === parent) { return; }
    this.detachFromParent();
    this._parent = parent;
    if (parent) { parent.attachChild(this, idx); }
  }

  detachFromParent() {
    if (this._parent) {
      const oldParent = this._parent;
      this._parent = null;
      oldParent.detachChild(this);
    }
  }

  attachChild(child: Region, idx: number = -1) {
    if (!child) { return; }
    if (this._children.indexOf(child) < 0) {
      if (idx < 0) { this._children.push(child); } else { this._children.splice(idx, 0, child); }
      this._AABBupdateRequired = true;
      child.attachToParent(this, idx);
      this.childAttached.emit(child);
    }
  }

  detachChild(child: Region) {
    if (!child) { return; }
    const idx = this._children.indexOf(child);
    if (idx >= 0) {
      this._children.splice(idx, 1);
      this._AABBupdateRequired = true;
      child.detachFromParent();
      this.childDetached.emit(child);
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

  _updateAABB(force = false) {
    if (!this._AABBupdateRequired && !force) { return; }
    this._AABBupdateRequired = false;

    this._AABB = this.coords.aabb();
    this._children.forEach(c => {
      c._updateAABB(force);
      this._AABB = this._AABB.union(c._AABB);
    });
  }
}
