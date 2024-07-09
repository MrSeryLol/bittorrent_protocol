import { Block } from "../client/Block.js"

// Класс Piece
// Определяет структуру части файла. Все части файла записаны в bencode коде внутри .torrent файла
export class Piece {
    // Индекс части
    private _index: number = 0;
    // Закодированные данные в видел 20-байтового sha1 хэша
    private _hash: Buffer = Buffer.alloc(20);
    // Длина одной части файла
    private _length: number = 0;
    // Блоки, входящие в часть файла
    private _blocks: Block[] = [];

    constructor(index: number, hash: Buffer, length: number) {
        this._index = index;
        this._hash = hash.subarray(0, hash.length);
        this._length = length;
    }

    // Добавление блока в часть файла
    public addBlock(block: Block) {
        this._blocks.push(block);
    }

    get index() {
        return this._index;
    }

    get length() {
        return this._length;
    }

    get blocks() {
        return this._blocks;
    }

    get hash() {
        return this._hash;
    }
}