// Класс Block
// Входит в состав части файла (часть файла, Piece, состоит из нескольких блоков)
// Позволяет запрашивать необходимые части файла, а также хранить двоичную информацию
// о полученных от треккера данных
export class Block {
    // index - индекс части файла, к которой относится экземпляр класса Block
    private _index: number = 0;
    // begin - отступ от начала (0 байта) части файла 
    private _begin: number = 0;
    // blockLength - длина запрашиваемого блока (обычно 16384 байта)
    private _blockLength: number = 0;
    // data - полученная информация от сообщения piece, представленная в двоичном формате
    private _data?: Buffer;
    // isRequested - переменная, необходимая для отслеживания статуса отправки запроса на получение данных файла:
    // (true - отправлено сообщение request для получения блока, false - сообщение не отправлено получения данных)
    private _isRequested: boolean = false;
    // isReceived - переменная, необходимая для отслеживания статуса получения данных от пира:
    // (true - принято сообщение piece и данные установлены на ПК, false - сообщение piece не получено)
    private _isReceived: boolean = false;

    constructor(index: number, begin: number, blockLength: number);
    constructor(index: number, begin: number, blockLength: number, data: Buffer);
    constructor(index: number, begin: number, blockLength: number, data?: Buffer) {
        if (data === undefined) {
            this._index = index;
            this._begin = begin;
            this._blockLength = blockLength;
        }
        
        else {
            this._index = index;
            this._begin = begin;
            this._blockLength = blockLength;
            this._data = data;
        }
    }

    get index() {
        return this._index;
    }

    get beginOffset() {
        return this._begin;
    }

    get blockLength() {
        return this._blockLength;
    }

    get isNeeded() {
        return !this._isRequested;
    }

    get isRequested() {
        return this._isRequested;
    }

    set isRequested(value: boolean) {
        if (value === this._isRequested) {
            return;
        }

        this._isRequested = value;
    }

    get isReceived() {
        return this._isReceived;
    }

    set isReceived(value: boolean) {
        if (value === this._isReceived) {
            return;
        }

        this._isReceived = value;
    }

    // Экземпляры класса (интерфейса) Buffer не могут быть undefined, поэтому просто делаем пустой
    // буфер, чтобы определить, что данные не были получены 
    get data() {
        if (this._data === undefined) {
            return Buffer.alloc(0);
        }

        return this._data;
    }

    set data(buffer: Buffer) {
        this._data = buffer;
    }
}