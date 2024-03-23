export class Peer {
    private _IP: Buffer;
    private _port: Buffer;

    constructor(IP: Buffer, port: Buffer) {
        this._IP = IP;
        this._port = port;
    }

    public static unmarshal(rawPeers: Buffer): Peer[] {
        const peerSize = 6; // IP (4 байта) + port (2 байта)
        const IP_Bytes_Offset = 4; // Первые 4 байта - это айпи пользователя
        const portBytesOffset = peerSize - IP_Bytes_Offset; // Последние 2 байта - это порт пользователя

        let peers: Peer[] = []; // Массив для хранения пиров

        if (rawPeers.byteLength % peerSize != 0) {
            console.log("Битые пиры, так нельзя");
            return peers;
        }

        const peerCount = rawPeers.byteLength / peerSize; // Количество пиров в "сыром массиве"

        for (let i = 0; i < peerCount; i++) {
            let offset = i * peerSize;
            peers.push(new Peer(
                rawPeers.subarray(offset, offset + IP_Bytes_Offset),
                rawPeers.subarray(offset + IP_Bytes_Offset, offset + IP_Bytes_Offset + portBytesOffset)) // Последние 2 байта - это порт пользователя
            );
        }

        return peers;
    }

    get IP() {
        return this._IP;
    }

    get port() {
        return this._port;
    }

    // set IP(IP: Buffer) {
    //     this._IP = IP;
    // }

    // set port(port: Buffer) {
    //     this._port = port;
    // }
}
