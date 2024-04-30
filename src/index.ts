import { Handshake } from "./handshake/handshake.js";
import { SingleFileMetainfo } from "./metainfo_file/SingleFileMetainfo.js";
import { Tracker } from "./tracker/Tracker.js";
import * as net from "net";
import bencode from "bencode";
import { Message, msgBitfield } from "./message/Message.js";
import { Client } from "./client/Client.js";
const { createHash } = await import("node:crypto");

async function main() {
    const file = new SingleFileMetainfo();
    const filePath = "C:\\bittorrent_for_app\\debian-12.5.0-amd64-netinst.iso.torrent";
    //const filePath = "C:\\bittorrent_for_app\\Ослепительная Грязная Парочка Dirty Pair Flash (Сунага Цукаса) [OVA] [16 из 16] [RUS(ext),JAP+Sub] [1994, приключения, комедия, [rutracker-3926442].torrent";
    //const filePath = "C:\\bittorrent_for_app\\sintel.torrent";
    await file.open(filePath);

    console.log(file.info);
    const peers = await Tracker.requestPeers(file);

    // Создание клиента (подключение к пирам от торрент файла)
    const bencodedInfoHash = bencode.encode(file.info); // Берём info_hash из нашего проинициализированного файла

    const hash = createHash("sha1").update(bencodedInfoHash).digest("hex"); // Делаем из него sha1-хэш в hex-виде
    const hexHash = Buffer.from(hash, "hex");
    const handshake = Handshake.create(hexHash, Buffer.from("-TO0042-0ab8e8a31019"));

    for (const peer of peers) {
        const client: Client = new Client(new net.Socket(), handshake);
        client.startConnection(peer);

        // client.readBitfield() 

        // client.once("msgBitfield", (message) => {
        //     client.readBitfield(message!);
        //     client.sendUnchoke();
        // })

        client.on("msgBitfield", (message) => {
            client.readBitfield(message);
            client.sendUnchoke();
            client.sendInterested();
        })

        
    }
}

await main()