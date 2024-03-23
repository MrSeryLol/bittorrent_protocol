import { Buffer } from "buffer"
import { readFile } from "fs/promises";
import bencode from "bencode";

// type SingleFileInfo = {
//     length: Number,
//     name: string,
//     pieceLength: Number,
//     pieces: Buffer
// }

type SingleFileInfo = {
    length: Buffer,
    name: Buffer,
    pieceLength: Buffer,
    pieces: Buffer
}


// type ISingleFileMetainfo {
//     info: {
//         name: string,
//         length: Number
//         pieceLength: Number,
//         pieces: Buffer
//     },
//     announce: string,
// }

export class SingleFileMetainfo {
    private _info?: SingleFileInfo;
    private _announce?: Buffer;
    
    //private _info: ISingleFileInfo;
    //private _announce: IAnnounce;


    constructor(info?: SingleFileInfo, announce?: Buffer) {
        //({ name: this.name, length: this.length, pieceLength: this.pieceLength, pieces: this.pieces } = info);
        //({ announce: this._announce }  = announce);
        this._info = info;
        this._announce = announce;
    }

    public async open(filePath: string) {
        try {
            const contents = await readFile(filePath);
            const metainfo = bencode.decode(contents);
            //console.log(metainfo);
            ({ announce: this._announce, info: this._info } = metainfo);
            //console.log(this._announce);
            //console.log(this._info);
            //console.log(this._announce?.announce);
            //console.log(this._info?.name);
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

