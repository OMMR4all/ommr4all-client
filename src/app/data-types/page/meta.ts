export class Meta {
  constructor(
    public creator = '',
    public created = new Date().toLocaleString(),
    public lastChange = new Date().toLocaleString(),
  ) {}

  static fromJson(json) {
    return new Meta(
      json.creator,
      json.created,
      json.lastChange,
    );
  }

  toJson() {
    return {
      creator: this.creator,
      created: this.created,
      lastChange: this.lastChange,
    };
  }
}
