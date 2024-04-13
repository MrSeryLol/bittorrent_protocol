import { Buffer } from "buffer";

export class Handshake {
    private _pstrlen: number;
    private _pstr: string;
    private readonly _reserved: Buffer = Buffer.alloc(8);
    private _infoHash: Buffer;
    private _peerID: Buffer;

    private constructor(pstrlen: number, pstr: string, infoHash: Buffer, peerID: Buffer) {
        this._pstrlen = pstrlen;
        this._pstr = pstr;
        this._infoHash = infoHash;
        this._peerID = peerID;
    }

    public static create(infoHash: Buffer, peerID: Buffer): Handshake {
        const pstr = "BitTorrent protocol";
        return new Handshake(
            pstr.length,
            pstr,
            infoHash,
            peerID
        );
    }

    public serialize(): Buffer {
        let buffer: Buffer = Buffer.alloc(this._pstr.length + 49); // Создаём пустой буффер

        let offset = 0; // Сдвиг для байтов

        Buffer.from([this._pstrlen]).copy(buffer, offset); 
        offset += Buffer.from([this._pstrlen]).length;
        
        Buffer.from(this._pstr).copy(buffer, offset);
        offset += Buffer.from(this._pstr).length;

        this._reserved.copy(buffer, offset);
        offset += this._reserved.length;

        this._infoHash.copy(buffer, offset);
        offset += this._infoHash.length;

        this._peerID.copy(buffer, offset);
        offset += this._peerID.length;

        return buffer;
    }

    public read(data: Buffer): Handshake {
        const pstrlen = data[0]; // Получаем длину протокола =19
        const pstr = data.subarray(1, pstrlen + 1).toString(); // Получаем название протокола (Bittorrent protocol)
        let infoHash = data.subarray(pstrlen + this._reserved.length + 1, pstrlen + this._reserved.length + 21); // Получаем info_hash по нужному смещению
        let peerID = data.subarray(pstrlen + this._reserved.length + 21, pstrlen + this._reserved.length + 41); // Получаем peer_id по нужному смещению

        return Handshake.create(
            infoHash,
            peerID
        );
    }

    get infoHash() {
        return this._infoHash;
    }
}