// import { Peer } from "../peer/Peer.js";

// export type Torrent = {
//     // Все пиры с этим файлом
//     peers: Peer[],
//     // Айди клиента
//     peerID: string,
//     // инфохэш словаря info из SingleFileMetainfo
//     infoHash: Buffer,
//     // Все части файла (pieces = length / pieceLength * 20) p.s. 20 получается из-за того, что
//     // части состоят из 20-байтовых sha1-хэшей. Т.е. каждые 20 байт инфохэша = 1 часть файла
//     pieces: Buffer,
//     // Длина каждой части файла
//     pieceLength: number,
//     // Для всего скачиваемого файла
//     length: number,
//     // Имя файла
//     name: string,
// }