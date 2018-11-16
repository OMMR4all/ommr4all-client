export class DefaultMap<T1, T2> extends Map<T1, T2> {
  get(key) { return super.get(key) || this.defaultValue; }
  constructor(private defaultValue: T2) { super(); }
}
