export class AddonError extends Error {
  constructor(code, params = {}) {
    super(code);
    this.name = "AddonError";
    this.code = code;
    this.params = params;
  }
}
