/** IndexedDB が開けない・書き込めないとき (プライベートモード、容量不足など)。 */
export class StorageUnavailableError extends Error {
  constructor(cause: unknown) {
    super("進み具合を保存できません。ブラウザのプライベートモードや、端末の空き容量を確かめてください。", { cause });
    this.name = "StorageUnavailableError";
  }
}

/** 窓口に渡した値が形に合わないとき。何も保存しない。 */
export class InvalidProgressInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidProgressInputError";
  }
}
