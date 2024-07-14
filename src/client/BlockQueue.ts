import { Block } from "./Block.js";
import { Torrent } from "./types/Torrent.js";
import { Piece } from "./Piece.js";

// Класс BlockQueue
// Организует очередь для загрузки блоков, которые доступны пиру
export class BlockQueue {
    // Очередь из всех блоков, которые необходимо будет скачать
    private _peerBlocks: Block[] = [];
    // Объект с мета-информацией о загружаемом торренте
    private _torrent: Torrent;

    constructor(torrent: Torrent) {
        this._torrent = torrent;
    }

    // Добавление блоков части файла в очередь
    public enqueue(piece: Piece) {
        // Блоки добавляются сразу же пачкой, которая имеется в наличии у части файла
        this._peerBlocks.push(...piece.blocks);
    }

    // Вытаскивание блока для его дальнейшей отправки по сообщению request
    public deque(): Block {
        return this._peerBlocks.shift()!;
    } 

    // Просмотр первого элемента очереди
    public peek(): Block {
        return this._peerBlocks[0];
    }

    // "Перемешивание" элементов очереди.
    // Требуется доработка, т.к. правильнее будет пользоваться стратегией
    // Rarest First Order, при которой сначала запрашиваются редкие блоки
    // В данной версии (ver. 0.0.2) данная функция перемешивает элементы очереди
    // согласно методу Дурштенфельда
    public shuffle() {
        // Вроде как реализация метода Дурштенфельда
        for (let i = this._peerBlocks.length - 1; i > 0; i--) {
            const pickedElement = Math.floor(Math.random() * i);
            let temp = this._peerBlocks[pickedElement];
            this._peerBlocks[pickedElement] = this._peerBlocks[i];
            this._peerBlocks[i] = temp;
        }
    }

    private getBlockLength(piece: Piece): number {
        // 16384 - это размер блока
        return piece.index === this._torrent.pieceLength - 1 ? this._torrent.length % piece.length : 16384
    }

    get length() {
        return this._peerBlocks.length;
    }
}