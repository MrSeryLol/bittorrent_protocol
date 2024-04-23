import { describe, expect, test } from "@jest/globals";
import { SingleFileMetainfo } from "../SingleFileMetainfo.js";

describe("SingleFileMetainfo", () => {

    test("should open torrent file with correct initialization property values", async () => {
        const metainfoFile = new SingleFileMetainfo();
        const filePath = "C:\\bittorrent_for_app\\debian-12.5.0-amd64-netinst.iso.torrent";

        await metainfoFile.open(filePath);

        const announceString = new TextDecoder().decode(metainfoFile.announce!);
        const nameString = new TextDecoder().decode(metainfoFile.info?.name);

        expect(announceString).toBe("http://bttracker.debian.org:6969/announce");
        expect(metainfoFile.info!.length).toBe(659554304);
        expect(nameString).toBe("debian-12.5.0-amd64-netinst.iso");
        expect(metainfoFile.info!["piece length"]).toBe(262144);
        expect(metainfoFile.info!.pieces.length / 20).toBe(
            Number.parseInt(metainfoFile.info!.length.toString()) /
            Number.parseInt(metainfoFile.info!["piece length"].toString()));
    })
})
