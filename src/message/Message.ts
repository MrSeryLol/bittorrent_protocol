import { Buffer } from "buffer";
import { Readable } from "stream";


type messageID = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export const msgChoke: messageID = 0;
export const msgUnchoke: messageID = 1;
export const msgInterested: messageID = 2;
export const msgNotInterested: messageID =  3;
export const msgHave: messageID =  4;
export const msgBitfield: messageID = 5;
export const msgRequest: messageID = 6;
export const msgPiece: messageID = 7;
export const msgCancel: messageID =  8;
export const msgPort: messageID = 9;

export class Message {
    private _lengthBuffer: Buffer = Buffer.alloc(4); // Длина сообщения всегда 4 байта, т.е. 0xFFFFFFFF = 4.294.967.295 - максимальное значение
    private _ID?: messageID;
    private _payload?: Buffer;

    constructor(ID?: messageID, payload?: Buffer) {
        this._ID = ID;
        this._payload = payload;
    }

    public static isHandshake(msgBuffer: Buffer): boolean {
        return (
            msgBuffer.length === msgBuffer.readUInt8() + 49 && // Сравниваем длину буфера с размером "рукопожатия"
            msgBuffer.toString("utf8", 1, 20) === "BitTorrent protocol" // Проверяем название протокола
        );
    }

    //message format is <length prefix><ID><payload> (length prefix = 4 bytes, ID = 1 byte, payload = n bytes) => 4 + 1 + n;
    public serialize(): Buffer {
        if (this._ID === undefined && this._payload === undefined) {
            return Buffer.alloc(4);
        }

        const length = this._payload!.length + 1; // +1 for id (length = n + id)
        const buffer = Buffer.alloc(length + 4); // (buffer = length + length prefix)
        let offset = 0; // Сдвиг байтов

        offset = buffer.writeUInt32BE(length); // Записать первые 4 байта в переменную buffer (длина сообщения)
        offset = buffer.writeUInt8(this._ID!, offset); // Записываем в 5 байт айдишник сообщения
        this._payload!.copy(buffer, offset); // Записываем в 6+ байты полезные данные
        return buffer;
    }

    public static read(msgBuffer: Buffer) {
        const lengthBuffer = Buffer.alloc(4); // Буфер длины всегда 4 байта
        const offset = msgBuffer.copy(lengthBuffer, 0, 0, 4);

        const length = lengthBuffer.readUInt32BE();

        if (length === 0) {
            return null; // keep-alive message
        }

        const messageID = msgBuffer.readUInt8(offset) as messageID; // Значение ID находится сразу после части длины
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

 