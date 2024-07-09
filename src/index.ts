import { Handshake } from "./handshake/handshake.js";
import { SingleFileMetainfo } from "./metainfo_file/SingleFileMetainfo.js";
import { Tracker } from "./tracker/Tracker.js";
import * as net from "net";
import bencode from "bencode";
import { Message, msgBitfield } from "./message/Message.js";
import { Client } from "./client/Client.js";
import { DownloadingProcess } from "./client/DownloadingProcess.js";
import { Torrent } from "./client/types/Torrent.js";
const { createHash } = await import("node:crypto");

// Основная функция, в которой происходит беконечный цикл (в теории, пока этого нет)
async function main() {
    // Создаём экземпляр MetainfoFile для дальнейшей работы с ним
    const file = new SingleFileMetainfo();
    // Путь до .torrent файла
    const filePath = "C:\\bittorrent_for_app\\debian-12.5.0-amd64-netinst.iso.torrent";
    //const filePath = "C:\\bittorrent_for_app\\Ослепительная Грязная Парочка Dirty Pair Flash (Сунага Цукаса) [OVA] [16 из 16] [RUS(ext),JAP+Sub] [1994, приключения, комедия, [rutracker-3926442].torrent";
    //const filePath = "C:\\bittorrent_for_app\\sintel.torrent";
    //const filePath = "C:\\bittorrent_for_app\\Танимура К. - SQL для анализа данных [2024, DjVu, RUS] [rutracker-6396522].torrent";
    // Открываем .torrent файл
    await file.open(filePath);

    console.log(file.info);
    
    // Получаем список пиров
    const peers = await Tracker.requestPeers(file);

    // Создание клиента (подключение к пирам от торрент файла)
    const bencodedInfoHash = bencode.encode(file.info); // Берём info_hash из нашего проинициализированного файла

    // Создаём переменную, в котрой будем хранить все метаданные, связанные с торрентом
    const torrent: Torrent = {
        peers: peers,
        peerID: "-TO0042-0ab8e8a31019",
        infoHash: bencodedInfoHash,
        pieces: file.info!.pieces,
        pieceLength: Number.parseInt(file.info!["piece length"].toString()),
        length: Number.parseInt(file.info!.length.toString()),
        name: new TextDecoder().decode(file.info!.name),
    };

    // Начинаем процесс загрузки файла
    let downloadingProcess = new DownloadingProcess(torrent);
    downloadingProcess.startDownload();

    
}

await main()