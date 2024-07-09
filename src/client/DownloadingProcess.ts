import * as net from "net";
import { Peer } from "../peer/Peer.js"
import { Client } from "./Client.js"
import { createHash } from "node:crypto";
import { Handshake } from "../handshake/handshake.js";
import { Buffer } from "buffer";
import * as fs from "fs/promises";
import { Piece } from "./Piece.js";
import { BlockQueue } from "./BlockQueue.js";
import { Block } from "./Block.js";
import { Utils } from "../utils/Utils.js";
import { Torrent } from "./types/Torrent.js";

// Класс DownloadingProcess
// Следит за состоянием скачиваемого файла
export class DownloadingProcess {
    // Поле, в котором хранятся метаданные торрента
    private _torrent: Torrent;

    public constructor(torrent: Torrent) {
        this._torrent = torrent;
    }

    // Функция, которая открывает соединение с пирами и считывает входящие сообщения от пиров, 
    // а также скачивает файл на компьютер клиента
    public async download(peer: Peer, pieces: Piece[], handshake: Handshake) {
        const client: Client = new Client(new net.Socket(), handshake); // Создаём сокет
        const file = await fs.open(`C:\\bittorrent_for_app\\${this._torrent.name}`, "w"); // Открываем файл на чтение
        const queue = new BlockQueue(this._torrent); // Для каждого пира собственная очередь
        client.startConnection(peer, pieces); // Связь устанавливаем с каждым из пиров

        client.on("msgChoke", () => {
            client.readChoke();
        })

        client.on("msgUnchoke", () => {
            client.readUnchoke();

            // Отправляем запрос на получение целого куска файла
            this.requestPiece(client, pieces, queue, peer);
        })

        client.on("msgBitfield", (message) => {
            client.readBitfield(message);
            client.sendUnchoke();
            client.sendInterested();

            // Добавляем все части, которые есть у пира, в очередь на закачку
            for (const piece of pieces) {
                if (client.PeerBitfield!.hasPiece(piece.index)) {
                    queue.enqueue(piece);
                }
            }

            // "Перемешиваем" элементы внутри очереди
            queue.shuffle();
        })

        client.on("msgPiece", async (message) => {
            // При получении куска файла необходимо правильно его спарсить
            const requestedData = client.readPiece(message);
            // Кусок, индекс которого был в сообщении
            let piece: Piece | undefined;

            console.log(`Пришёл кусок: ${requestedData?.index}`);


            if (requestedData !== null) { // Если в requestedData пустой буфер, значит данные не пришли и закачивать ничего не нужно
                // offset необходим по той причине, что блоки приходят в случайном порядке, и нужно
                // правильно находить область выделенной памяти для загрузки файла
                const offset = requestedData.index * this._torrent.pieceLength + requestedData.begin;
                file.write(requestedData.block, 0, requestedData.block.length, offset)
                    //.then(value => console.log(`Записано ${value.bytesWritten} байт`))
                    .catch(e => console.log(`Ошибка!!! ${e}`));
                
                // Находим часть файла, чтобы пометить блок как полученный
                piece = pieces.find(piece => piece.index === requestedData.index);
                
                if (piece === undefined) {
                    console.log(`Ошибка при получении части файла: ${piece}`);
                    return;
                }

                // Ищем блок, который был получен
                const block = piece.blocks.find(block => block.beginOffset == requestedData.begin);
                block!.isReceived = true;
                block!.data = requestedData.block;

                console.log(`Скачано ${Utils.percentDone(this._torrent, pieces)}%`);
            }

            // Если у части файла все блоки имеют не пустые буферы
            // (При нескачанных блоках, они имеют нулевую длину)
            // значит мы скачали часть целиком
            if (piece!.blocks.every(block => block.data.length !== 0)) {
                console.log("Скачали весь кусок!!!");
                console.log(`Скачан #${piece?.index} кусок - ${Utils.percentDone(this._torrent, pieces)}\nPeer: ${peer.IPv4}`)
            }

            // Если все куски были скачан, значит мы скачали файл целиком
            if (Utils.percentDone(this._torrent, pieces) === 100) {
                console.log("Скачивние завершено!");
                client.endConnection();

                try {
                    await file.close();
                } 
                catch (err) {
                    console.log(`Ошибка закрытия: ${err}`);
                }

                return;
            }

            this.requestPiece(client, pieces, queue, peer);
        })
    }

    // Функция для запроса части файла
    private requestPiece(client: Client, pieces: Piece[], queue: BlockQueue, peer: Peer) {
        // Если пир "придушен", то ничего не делаем
        //console.log(`Клиент задушен: ${client.Choked}`);
        if (client.Choked) {
            return;   
        }

        // Пока очередь из кусков не пуста, крутим этот цикл (очередь сокращается на 1 кусок каждый проход)
        while (queue.length) {
            const downloadingPiece = queue.deque();
            // Проверяем, не был ли уже запрошен у другого пира данный кусок файла
            if (downloadingPiece!.isNeeded) {
                client.sendRequest(downloadingPiece.index, downloadingPiece.beginOffset, downloadingPiece.blockLength);
                downloadingPiece.isRequested = true;
                break;
            }
        }
    }

    // Функция, которая правильным образом делит все части файла
    public async startDownload() {
        console.log(`Starting download for ${this._torrent.name}`);

        // Поток для скачивания
        const pieces: Piece[] = [];

        //Сдвиг для байтов каждой части файла (+20 байт каждый проход цикла)
        let offset = 0;

        // Добавляем индекс, байты и длину каждой части файла в поток для скачивания
        for (let index = 0; index < Math.ceil(this._torrent.length / this._torrent.pieceLength); index++) {
            let begin = index * this._torrent.pieceLength;
            let end = begin + this._torrent.pieceLength;

            if (end > this._torrent.length) {
                end = this._torrent.length;
            }

            // Сначала создаём часть
            const piece = new Piece(index, this._torrent.pieces.subarray(offset, offset + 20), end - begin);
            // Потом определяем длину блоков внутри части файла
            const blockLength = piece.index === this._torrent.pieceLength - 1 ? this._torrent.length % piece.length : 16384;
            // Считаем число блоко в части файла
            const blockCount = Math.ceil(piece.length / blockLength);

            // Настраиваем блоки правильно
            for (let j = 0; j < blockCount; j++) {
                piece.addBlock(new Block(piece.index, j * blockLength, blockLength));
            }

            pieces.push(piece);
            // offset = 20, поскольку все части файла хэшируются 20-байтовой строкой sha1
            offset += 20;
        }

        // Создание "рукопожатия" (подключение к пирам от торрент файла)
        const hash = createHash("sha1").update(this._torrent.infoHash).digest("hex"); // Делаем из него sha1-хэш в hex-виде
        const hexHash = Buffer.from(hash, "hex");
        const handshake = Handshake.create(hexHash, Buffer.from("-TO0042-0ab8e8a31019"));

        // Запускаем процесс закачивания файла у каждого пира по отдельности
        for (const peer of this._torrent.peers) {
            this.download(peer, pieces, handshake);
        }
    }
}