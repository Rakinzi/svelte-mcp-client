export type Handler<T> = (payload: T) => void;

export class Emitter<T> {
  private handlers = new Set<Handler<T>>();

  on(handler: Handler<T>): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  emit(payload: T): void {
    for (const handler of this.handlers) {
      handler(payload);
    }
  }

  clear(): void {
    this.handlers.clear();
  }
}
