export function mapOnSet<T>(s: Set<T>, lambda: (T) => T): Set<T> {
  const out = new Set<T>();
  s.forEach(e => out.add(lambda(e)));
  return out;
}

export function identicalSets<T>(a: Set<T>, b: Set<T>): boolean {
  if (a.size !== b.size) { return false; }
  for (const v of Array.from(a.values())) {
    if (!b.has(v)) { return false; }
  }
  return true;
}

export function arrayFromSet<T>(set: Set<T>): T[] {
  return Array.from(set.values());
}

export function setFromList<T>(array: T[]): Set<T> {
  const s = new Set<T>();
  array.forEach(a => s.add(a));
  return s;
}

export function copyFromSet<T>(set: Set<T>, from: Set<T>): void {
  set.clear();
  from.forEach(e => set.add(e));
}

export function copySet<T>(set: Set<T>): Set<T> {
  const copy = new Set<T>();
  set.forEach(e => copy.add(e));
  return copy;
}

export function identicalLists<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) { return false; }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) { return false; }
  }

  return true;
}

export function copyFromList<T>(array: T[], from: T[]): void {
  array.length = 0;
  array.push(...from);
}

export function copyList<T>(array: T[]): T[] {
  return array.map(t => t);
}
