export class HttpError extends Error {
  public status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    // Set the prototype explicitly to avoid issues with instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
