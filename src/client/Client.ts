import * as net from "net";
import {
    Message, msgBitfield, msgCancel, msgChoke, msgHave, msgInterested, msgNotInterested, msgPiece,
    msgPort, msgRequest, msgUnchoke
} from "../message/Message.js";
import { IMessageEvents } from "../message/IMessageEvents.js";
import { Peer } from "../peer/Peer.js";
import { Handshake } from "../handshake/handshake.js";
import { Bitfield } from "./Bitfield.js";
import { TypedEmitter } from "tiny-typed-emitter";
import { Piece } from "./Piece.js";
import { PieceResponse } from "./types/PieceResponse.js";
import * as fs from "fs/promises";

// Класс Client
// Главный класс всего проекта
// 1) Хранит информацию о пирах, к которым присоединился клиент (IP, port, Bitfield)
// 2) Принимает все входящие сообщения от треккера и отправляет сообщения треккеру
// 3) Хранит данные о самом клиенте 
export class Client extends TypedEmitter<IMessageEvents> {
    // Непосредственно сокет, который обращается к треккеру 
    private _client: net.Socket;
    // Статус "задушенности" клиента. По умолчанию задушен. 
    private _amChoking: boolean =  true;
    // Статус "заинтересованности" клиента. По умолчанию не заинтересован
    private _amInterested: boolean = false;
    // "Рукопожатие", которое необходимо для подтерждения установления связи с пиром
    private _handshake: Handshake;

    private _requestidData: Buffer = Buffer.alloc(0);

    //private _fileHandle: fs.FileHandle;

    // Bitfield пира, к которому было произведено подключение
    private _peerBitfield?: Bitfield = undefined;
    private _peer?: Peer = undefined;
    // private _infoHash: string;
    // private _peerID: string; 

    constructor(client: net.Socket, handshake: Handshake) {
        super();
        this._client = client;
        this._handshake = handshake;
        //this._fileHandle = fileHandle;
        // Инициализация события возникающих ошибок, пока происходит передача данных по протоколу
        this._client.on("error", async (error) => {
            console.log(`Error: ${error}`);
            console.log(`Пир: ${this._peer?.IPv4}`);
            this._client.end();
            //await this._fileHandle.close();
        });
    }

    // Начать установление связи с пиром
    public startConnection(peer: Peer, pieces: Piece[]) {
        const a = this._client.connect(peer.port, peer.IPv4, () => {
            console.log(`Попытка подключиться к пиру: ${peer.IPv4}:${peer.port}`);
            this._peer = peer;

            // Отправляем на сервер своё "рукопожатие"
            let info = this._client.write(this._handshake.serialize());
            console.log(info);
        });

        console.log(a);

        // Вызываем функцию, которая считывает буфер входящих сообщений
        // Коллбэк позволяет считывать сообщения и определять их тип
        this.onWholeMsg((msgBuffer) => this.msgHandler(msgBuffer));
    }

    // Функция, которая считывает буфер входящих сообщений
    private onWholeMsg(callback: (msgBuffer: Buffer) => void) {
        let savedBuffer = Buffer.alloc(0);
        let isHandshake = true;

        this._client.on("data", (receivedBuffer) => {
            // Длина сообщения формируется от того, является ли сообщение "рукопожатием" или обычным сообщением,
            // которое следует после фазы удачного соединения. Если это самое первое сообщение, т.е. "рукопожатие",
            // то необходимо сформировать первый вариант. В остальных случаях длина сообщения находится в буфере
            // +4 байта оставляем для правильного сдвига байтов в массиве, потому что часть сообщения, которая
            // указывает на длину сообщения (первые 4 байта), не входит в общую длину сообщения
            const msgLength = () => isHandshake ? savedBuffer.readUInt8() + 49 : savedBuffer.readUInt32BE() + 4;
            savedBuffer = Buffer.concat([savedBuffer, receivedBuffer]);

            while (savedBuffer.length >= 4 && savedBuffer.length >= msgLength()) {
                callback(savedBuffer.subarray(0, msgLength())); // Вызываем функцию msgHandler
                savedBuffer = savedBuffer.subarray(msgLength()); // Изменяем сохранённый буфер, так как сообщение было прочитано
                isHandshake = false; // Изменяем всегда isHandshake на false, потому что "рукопожатие" происходит только в 1 раз
            }
        })
    }

    //Функция, которая обрабатывает входящие сообщения из открытого потока
    private msgHandler(msgBuffer: Buffer) {
        // Проверка на "рукопожатие", потому что это единственное сообщение,
        // которое отличается по своей структуре от других
        if (Message.isHandshake(msgBuffer)) {
            this.readHandshake(msgBuffer, this._handshake);
            return;
        }

        const message = Message.read(msgBuffer);

        // Если ссылка сообщения пустая, то это keep-alive сообщение
        if (message === null) {
            console.log("keep-alive");
            return;
        }

        // Своего рода машина состояний, которая обрабатываем всевозможные сообщения
        // в протоколе Bittorrent (в ver 0.0.2 реализованы не все сообщения)
        switch (message.ID) {
            case msgChoke:
                this.emit("msgChoke");
                break;
            case msgUnchoke:
                this.emit("msgUnchoke");
                break;
            case msgInterested:
                this.emit("msgInterested");
                break;
            case msgNotInterested:
                this.emit("msgNotInterested");
                break;
            case msgHave:
                this.emit("msgHave", message!);
                break;
            case msgBitfield:
                this.emit("msgBitfield", message!);
                break;
            case msgRequest:
                this.emit("msgRequest", message!);
                break;
            case msgPiece:
                this.emit("msgPiece", message!);
                break;
            case msgCancel:
                break;
            case msgPort:
                break;
            default:
                break;
        }
    }

    // Функция, которая считывает буфер с рукопожатием
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

    // Функция, которая считывает Bitfield
    public readBitfield(message: Message) {
        console.log(`Получили сообщение:\nID: ${message.ID}\nPayload: ${message.payload}`);

        if (message.ID !== msgBitfield) {
            this._client.destroy(new Error(`Expected bittfield ID = 5, but get ID = ${message.ID}`));
        }

        //Битфилд пира!!! Наш собственный битфилд (клиента) никак не фиксируется
        this._peerBitfield = Bitfield.create(message.payload!);
    }

    // Функция, которая душит клиента (закрывает сокет)
    public readChoke() {
        //this._client.end();
        this._amChoking = true;
        console.log("Пир задушил нас");
    }

    // Функция, которая "открывает" клиента (открывает сокет)
    public readUnchoke() {
        this._amChoking = false;
        console.log("Пир восстановил связь");
    }

    //Функция, которая меняет статус на "интересует"
    public readInterested() {
        this._amInterested = true;
        console.log("Пир заинтересован в файле");
    }

    //Функция, которая меняет статус на "не интересует"
    public readNotInterested() {
        this._amInterested = false;
        console.log("Пир больше не заинтересован в файле");
    }

    // Функция, которая меняет битовое поле при получении сообщения "have"
    public readHave(message: Message) {
        // Парсим сообщение
        const parsedIndex = message.parseHave();

        // Обновляем данные битового поля
        this._peerBitfield?.setPiece(parsedIndex);
    }

    // Считываем входящее сообщение с блоком от куска
    public readPiece(message: Message): PieceResponse | null {
        //console.log("Зашли в получение куска!");
        if (message.ID !== msgPiece) {
            console.log(`Expected msgPiece ID [${msgPiece}], but got ID [${message.ID}]`);
            return null;
        }

        if (message.payload!.length < 8) {
            console.log(`Payload too short. ${message.payload!.length} < 8`);
            return null;
        }

        // Парсим сообщение с блоком
        const parsedPiece = message.parsePiece();

        return parsedPiece;
    }

    // Функция для отправки сообщения Unchoke
    public sendUnchoke() {
        const message = new Message(msgUnchoke);
        this._client.write(message.serialize());
    }

    // Функция для отправки сообщения Interested
    public sendInterested() {
        const message = new Message(msgInterested);
        this._client.write(message.serialize());
    }

    // Функция для отправки сообщения Have
    public sendHave(index: number) {
        const message = new Message(msgHave);
        message.formatHave(index);
        this._client.write(message.serialize());
    }

    // Функция для отправки сообщения Request
    public sendRequest(index: number, begin: number, length: number) {
        const message = new Message(msgRequest);
        message.formatRequest(index, begin, length);
        this._client.write(message.serialize());
    }

    // Закрытие сокета
    public endConnection() {
        this._client.end();
    }

    get PeerBitfield() {
        return this._peerBitfield;
    }

    get Choked() {
        return this._amChoking;
    }
}