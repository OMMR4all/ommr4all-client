export function mapToObj<T2>(map: Map<string, T2>) {
  const obj = {};
  map.forEach((v, k) => obj[k] = v);
  return obj;
}

export function objIntoMap<T2>(obj, m: Map<string, T2> = new Map<string, T2>()): Map<string, T2> {
  Object.keys(obj).forEach(k => m.set(k, obj[k]));
  return m;
}

export function enumMapToObj<T1, T2>(map: Map<T1, T2>, EnumType) {
  const obj = {};
  map.forEach((v, k) => obj[EnumType[k]] = v);
  return obj;
}

export function objIntoEnumMap<T1, T2>(obj, m: Map<T1, T2>, EnumType, fromString = true) {
  if (fromString) {
    Object.keys(obj).forEach(k => m.set(EnumType[k], obj[k]));
  } else {
    Object.keys(obj).forEach(k => m.set(EnumType[EnumType[k]], obj[k]));
  }
  return m;
}

