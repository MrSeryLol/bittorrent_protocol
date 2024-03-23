import { readFile } from "fs/promises";
import bencode from "bencode";
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
    _info;
    _announce;
    //private _info: ISingleFileInfo;
    //private _announce: IAnnounce;
    constructor(info, announce) {
        //({ name: this.name, length: this.length, pieceLength: this.pieceLength, pieces: this.pieces } = info);
        //({ announce: this._announce }  = announce);
        this._info = info;
        this._announce = announce;
    }
    async open(filePath) {
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
//# sourceMappingURL=SingleFileMetainfo.js.map