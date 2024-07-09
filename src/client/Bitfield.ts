// Класс Bitfield
// Позволяет хранить данные о скачанных частях файла у пира
export class Bitfield {
    private _bitfield: Buffer;

    private constructor(bitfield: Buffer) {
        this._bitfield = bitfield;
    }

    public static create(bitfield: Buffer): Bitfield {
        return new Bitfield(bitfield);
    }

    // Проверка на наличие части файла у пира
    public hasPiece(index: number): boolean {
        const byteIndex = Math.floor(index / 8);// В 1 байте 8 бит, поэтому делим на 8, если вышло за пределы 8, то это уже 2 байта
        const offset = index % 8;// offset - какой бит внутри байта проверяется (от 0 до 7), т.е. 8
        
        if (byteIndex < 0 || byteIndex > this._bitfield.length) {
            return false;
        }

        // (7 - offset, потому что 0 разряд для нас слева)
        return (this._bitfield[byteIndex] >> (7 - offset) & 1) !== 0;
    }

    // Будет вызываться при получении сообщения have, чтобы обновлять данные о
    // скачанных частях файла
    public setPiece(index: number) {
        const byteIndex = index / 8;// В 1 байте 8 бит, поэтому делим на 8, если вышло за пределы 8, то это уже 2 байта
        const offset = index % 8;// offset - какой бит внутри байта проверяется (от 0 до 7), т.е. 8

        if (byteIndex < 0 || byteIndex > this._bitfield.length) {
            return;
        }

        this._bitfield[byteIndex] |= 1 << (7 - offset); // устанавливаем необходимый бит в 1
    }
}