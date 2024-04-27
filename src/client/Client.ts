import * as net from "net";
import { Message, msgBitfield, msgCancel, msgChoke, msgHave, msgInterested, msgNotInterested, msgPiece, 
    msgPort, msgRequest, msgUnchoke } from "../message/Message.js";
import { Peer } from "../peer/Peer.js";
import { Handshake } from "../handshake/handshake.js";
import { Bitfield } from "./Bitfield.js";
import { TypedEmitter } from "tiny-typed-emitter";

interface IMessageEvents {
    msgChoke: (message: Message) => void;
    msgUnchoke: (message: Message) => void;
    msgInterested: (message: Message) => void;
    msgNotInterested: (message: Message) => void;
    msgHave: (message: Message) => void;
    msgBitfield: (message: Message) => void;
    msgRequest: (message: Message) => void;
    msgPiece: (message: Message) => void;
    msgCancel: (message: Message) => void;
    msgPort: (message: Message) => void;
}

export class Client extends TypedEmitter<IMessageEvents> {
    private _client: net.Socket;
    private _handshake: Handshake;
    private _bitfield?: Bitfield = undefined;
    private _peer?: Peer = undefined;
    // private _infoHash: string;
    // private _peerID: string; 

    constructor(client: net.Socket, handshake: Handshake) {
        super();
        this._client = client;
        this._handshake = handshake;
        this._client.on("error", (error) => {
            console.log(`Error: ${error}`);
        });
    }

    public startConnection(peer: Peer) {
        this._client.connect(peer.port, peer.IPv4, () => {
            console.log(`Попытка подключиться к пиру: ${peer.IPv4}:${peer.port}`);
            this._peer = peer;

            // Отправляем на сервер своё "рукопожатие"
            let info = this._client.write(this._handshake.serialize()); 
            console.log(info);
        });

        this.onWholeMsg((msgBuffer) => this.msgHandler(msgBuffer));
    }

    private onWholeMsg(callback: (msgBuffer: Buffer) => void) {
        let savedBuffer = Buffer.alloc(0);
        let isHandshake = true;

        this._client.on("data", (receivedBuffer) => {
            console.log(`Получили буфер с данными: ${receivedBuffer}`);
            // Длина сообщения формируется от того, является ли сообщение "рукопожатием" или обычным сообщением,
            // которое следует после фазы удачного соединения. Если это самое первое сообщение, т.е. "рукопожатие",
            // то необходимо сформировать первый вариант. В остальных случаях длина сообщения находится в буфере
            const msgLength = () => isHandshake ? savedBuffer.readUInt8() + 49 : savedBuffer.readUInt32BE();
            savedBuffer = Buffer.concat([savedBuffer, receivedBuffer]);

            while (savedBuffer.length >= 4 && savedBuffer.length >= msgLength()) {
                callback(savedBuffer.subarray(0, msgLength())); // Вызываем функцию msgHandler
                savedBuffer = savedBuffer.subarray(msgLength()); // Изменяем сохранённый буфер, так как сообщение было прочитано
                isHandshake = false; // Изменяем всегда isHandshake на false, потому что "рукопожатие" происходит только в 1 раз
            }
        })
    }

    private msgHandler(msgBuffer: Buffer) {
        if (Message.isHandshake(msgBuffer)) {
            this.readHandshake(msgBuffer, this._handshake);
            return;
        }

        const message = Message.read(msgBuffer);

        if (message === null) {
            return;
        }

        switch (message.ID) {
            case msgChoke:
                break;
            case msgUnchoke:
                break;
            case msgInterested:
                break;
            case msgNotInterested:
                break;
            case msgHave:
                break;
            case msgBitfield:
                this.emit("msgBitfield", message!);
                break;
            case msgRequest:
                break;
            case msgPiece:
                break;
            case msgCancel:
                break;
            case msgPort:
                break;
            default:
                break;
        }
    }

    private readHandshake(handshakeBuffer: Buffer, handshake: Handshake) {
        const response = handshake.read(handshakeBuffer); // Делаем handshake с треккером, чтобы сравнить info_hash
        if (response.infoHash.compare(handshake.infoHash) !== 0) {
            console.log(`Expected ${handshake.infoHash}, but get ${response.infoHash}`);
            this._client.destroy(new Error(`Expected ${handshake.infoHash}, but get ${response.infoHash} (Несовпадение info_hash)`));
            console.log(`Cannot handshake with peer: ${this._peer?.IPv4}`)
            return;
        }

        console.log(`Completed handshake with peer: ${this._peer?.IPv4}`);
    }

    public readBitfield(message: Message) {
        console.log(`Получили сообщение:\nID: ${message.ID}\nPayload: ${message.payload}`);

        if (message.ID !== msgBitfield) {
            this._client.destroy(new Error(`Expected bittfield ID = 5, but get ID = ${message.ID}`));
        }

        this._bitfield = Bitfield.create(message.payload!);
    }

    public readMsg(msgBuffer: Buffer) {
        console.log(msgBuffer);

        const message = Message.read(msgBuffer);

        if (message !== null) {
            //console.log(`Получили сообщение:\nID: ${message.ID}\nPayload: ${message.payload}`);
        }


        //const message = new Message()


        //console.log("Зашёл");

    }
}