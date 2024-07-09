import { Block } from "../client/Block.js";
import { Piece } from "../client/Piece.js";
import { Torrent } from "../client/types/Torrent.js";

// Класс Utils
// Хранит в себе общие данные для всего проекта
// (Спорный класс, возможно, буду удалять/дорабатывать)
export class Utils {

    public static pieceLength(torrent: Torrent) {
        return torrent.pieceLength;
    }

    public static percentDone(torrent: Torrent, pieces: Piece[]) {
        let blockCount = 0;
        let blocks: Block[] = [];
        
        for (const piece of pieces) {
            blockCount += piece.blocks.length;
            blocks.push(...piece.blocks);
        }

        const receivedBlocks = blocks.filter(block => block.isReceived);

        return (receivedBlocks.length / blocks.length) * 100;
    }
}