import { Buffer } from "buffer"
import { readFile } from "fs/promises";
import bencode from "bencode";

type SingleFileInfo = {
    length: Buffer,
    name: Buffer,
    pieceLength: Buffer,
    pieces: Buffer
}

export class SingleFileMetainfo {
    private _info?: SingleFileInfo;
    private _announce?: Buffer;
    
    constructor(info?: SingleFileInfo, announce?: Buffer) {
        this._info = info;
        this._announce = announce;
    }

    public async open(filePath: string) {
        try {
            const contents = await readFile(filePath);
            const metainfo = bencode.decode(contents);
            ({ announce: this._announce, info: this._info } = metainfo);
        }
        catch (err) {
            console.log(err);
        }
    }

    get info() {
        return this._info;
    }

    get announce() {
        return this._announce;
    }
}

