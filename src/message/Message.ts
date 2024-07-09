import { Buffer } from "buffer";
import { PieceResponse } from "../client/types/PieceResponse.js";

type MessageID = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export const msgChoke: MessageID = 0;
export const msgUnchoke: MessageID = 1;
export const msgInterested: MessageID = 2;
export const msgNotInterested: MessageID =  3;
export const msgHave: MessageID =  4;
export const msgBitfield: MessageID = 5;
export const msgRequest: MessageID = 6;
export const msgPiece: MessageID = 7;
export const msgCancel: MessageID =  8;
export const msgPort: MessageID = 9;

// Класс Message
// Отвечает за правильное создание сообщений для их дальнейшей отправки,
// а также за правильный парсинг полученных сообщений
export class Message {
    private _lengthBuffer: Buffer = Buffer.alloc(4); // Длина сообщения всегда 4 байта, т.е. 0xFFFFFFFF = 4.294.967.295 - максимальное значение
    // ID сообщения
    private _ID?: MessageID;
    // Данные, которые находятся в сообщении
    private _payload?: Buffer;

    constructor(ID?: MessageID, payload?: Buffer) {
        this._ID = ID;
        this._payload = payload;
    }

    // Функция, которая проверяет входящее сообщение на "рукопожатие"
    public static isHandshake(msgBuffer: Buffer): boolean {
        return (
            msgBuffer.length === msgBuffer.readUInt8() + 49 && // Сравниваем длину буфера с размером "рукопожатия"
            msgBuffer.toString("utf8", 1, 20) === "BitTorrent protocol" // Проверяем название протокола
        );
    }

    // Функция, которая формирует сообщение Request для треккера
    public formatRequest(index: number, begin: number, length: number) {
        // Выделяем 12 байт, а не 13, как это написано в спецификации, потому что 
        // Первый байт уже заполнен данными об ID сообщения 
        this._payload = Buffer.alloc(12);
        // Сначала записываем index части, которую мы хотим запросить
        let offset = this._payload.writeUint32BE(index);
        // Затем записываем необходимый отступ от начала части файла
        offset = this._payload.writeUInt32BE(begin, offset);
        // Затем записываем длину запрашиваемого блока
        this._payload.writeUInt32BE(length, offset);
        // Возвращаем готовый payload
        return this._payload;
    }

    // Функция для парсинга части файла (индекс, начало блока, блок)
    public parsePiece() {
        // Считываем индекс части файла
        const parsedIndex = this._payload!.readUInt32BE();
        // Считываем начало блока
        const begin = this._payload!.readUInt32BE(4);
        // Считываем данные блока
        const block = this._payload!.subarray(8);

        return { index: parsedIndex, begin: begin, block: block } as PieceResponse;
    }

    //message format is <length prefix><ID><payload> (length prefix = 4 bytes, ID = 1 byte, payload = n bytes) => 4 + 1 + n;
    // Сериализируем полученные сообщения в формате JS-объекта как двоичный буфер
    public serialize(): Buffer {
        if (this._ID === undefined && this._payload === undefined) {
            return Buffer.alloc(4);
        }

        const length = this._payload !== undefined ? this._payload!.length + 1 : 1; // +1 for id (length = n + id)
        const buffer = Buffer.alloc(length + 4); // (buffer = length + length prefix)
        let offset = 0; // Сдвиг байтов

        offset = buffer.writeUInt32BE(length); // Записать первые 4 байта в переменную buffer (длина сообщения)
        offset = buffer.writeUInt8(this._ID!, offset); // Записываем в 5 байт айдишник сообщения
        
        if (this._payload === undefined) {// Если payload пуст, то возвращаем буфер без заполненного payload
            return buffer;
        }

        this._payload!.copy(buffer, offset); // Записываем в 6+ байты полезные данные
        return buffer;
    }

    // Функция, которая правильно считывает входящее сообщение от треккера
    public static read(msgBuffer: Buffer) {
        const lengthBuffer = Buffer.alloc(4); // Буфер длины всегда 4 байта
        const offset = msgBuffer.copy(lengthBuffer, 0, 0, 4);

        const length = lengthBuffer.readUInt32BE();

        if (length === 0) {
            return null; // keep-alive message
        }

        const messageID = msgBuffer.readUInt8(offset) as MessageID; // Значение ID находится сразу после части длины
        const payload = msgBuffer.subarray(offset + 1); // payload находится сразу после ID

        return new Message(messageID, payload);
    }

    get ID() {
        return this._ID;
    }

    get payload() {
        return this._payload;
    }
    
}

 