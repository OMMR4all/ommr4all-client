export class DefaultMap<T1, T2> extends Map<T1, T2> {
  get(key) { return super.get(key) || this.defaultValue; }
  constructor(private defaultValue: T2) { super(); }
}

export function equalMaps(map1, map2) {
  let testVal;
  if (map1.size !== map2.size) {
    return false;
  }
  for (const [key, val] of map1) {
    testVal = map2.get(key);
    // in cases of an undefined value, make sure the key
    // actually exists on the object so there are no false positives
    if (testVal !== val || (testVal === undefined && !map2.has(key))) {
      return false;
    }
  }
  return true;
}
