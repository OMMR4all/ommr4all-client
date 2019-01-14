export enum IdType {
  Page = 'page',
  Block = 'block',
  Line = 'line',
  TextEquiv = 'te',
  Word = 'word',
  Syllable = 'syl',
  StaffLine = 'sl',
  Note = 'note',
  Clef = 'clef',
  Accidential = 'accid',
}

export abstract class IdGenerator {
  private static idCounter = new Map<IdType, number>();

  public static newId(type: IdType) {
    if (!IdGenerator.idCounter.has(type)) {
      IdGenerator.idCounter.set(type, 0);
    } else {
      IdGenerator.idCounter.set(type, IdGenerator.idCounter.get(type) + 1);
    }
    return type + '_' + IdGenerator.idCounter.get(type);
  }

  public static reset() {
    IdGenerator.idCounter = new Map<IdType, number>();
  }

}
