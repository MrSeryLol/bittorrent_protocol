export class Peer {
    private _IPv4: Buffer;
    private _port: Buffer;

    constructor(IPv4: Buffer, port: Buffer) {
        this._IPv4 = IPv4;
        this._port = port;
    }

    public static unmarshal(rawPeers: Buffer): Peer[] {
        const peerSize = 6; // IPv4 (4 байта) + port (2 байта)
        const IPv4_Bytes_Offset = 4; // Первые 4 байта - это айпи пользователя
        const portBytesOffset = peerSize - IPv4_Bytes_Offset; // Последние 2 байта - это порт пользователя

        let peers: Peer[] = []; // Массив для хранения пиров

        if (rawPeers.byteLength % peerSize != 0) {
            console.log("Битые пиры, так нельзя");
            return peers;
        }

        const peerCount = rawPeers.byteLength / peerSize; // Количество пиров в "сыром массиве"

        for (let i = 0; i < peerCount; i++) {
            let offset = i * peerSize;
            peers.push(new Peer(
                rawPeers.subarray(offset, offset + IPv4_Bytes_Offset),
                rawPeers.subarray(offset + IPv4_Bytes_Offset, offset + IPv4_Bytes_Offset + portBytesOffset)) // Последние 2 байта - это порт пользователя
            );
        }

        return peers;
    }

    get IPv4() {
        return `${this._IPv4[0]}.${this._IPv4[1]}.${this._IPv4[2]}.${this._IPv4[3]}`;
    }

    get port() {
        return Number.parseInt(this._port.toString("hex"), 16);
    }
}

