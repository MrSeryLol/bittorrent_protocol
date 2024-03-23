import { SingleFileMetainfo } from "./metainfo_file/SingleFileMetainfo.js";
import { Tracker } from "./tracker/Tracker.js";
async function main() {
    const file = new SingleFileMetainfo();
    //console.log(await file.open());
    const filePath = "C:\\bittorrent_for_app\\debian-12.5.0-amd64-netinst.iso.torrent";
    //const filePath = "C:\\bittorrent_for_app\\Ослепительная Грязная Парочка Dirty Pair Flash (Сунага Цукаса) [OVA] [16 из 16] [RUS(ext),JAP+Sub] [1994, приключения, комедия, [rutracker-3926442].torrent";
    //const filePath = "C:\\bittorrent_for_app\\sintel.torrent";
    await file.open(filePath);
    //console.log(file.info);
    //console.log(file.announce);
    //Tracker.buildTrackerURL(file);
    await Tracker.requestPeers(file);
    //console.log("hi");
}
await main();
//# sourceMappingURL=index.js.map