import bencode from "bencode";
const { createHash } = await import("node:crypto");
export class Tracker {
    static buildTrackerURL(file, peerID, port) {
        const CORRECT_ESCAPED_SYMBOLS_CODES = [
            0x2D, 0x2E, 0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37,
            0x38, 0x39, 0x41, 0x42, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48,
            0x49, 0x4A, 0x4B, 0x4C, 0x4D, 0x4E, 0x4F, 0x50, 0x51, 0x52,
            0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59, 0x5A, 0x5F, 0x61,
            0x62, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6A, 0x6B,
            0x6C, 0x6D, 0x6E, 0x6F, 0x70, 0x71, 0x72, 0x73, 0x74, 0x75,
            0x76, 0x77, 0x78, 0x79, 0x7A, 0x7E
        ];
        let charPair = ""; // Переменная для пары байтов
        let decodedInfoHash = ""; // Строка, в которой будет храниться преобразованный info_hash
        let announce = file.announce; // Ссылка на торрент-файл
        if (announce === undefined) {
            return "";
        }
        const bencodedInfoHash = bencode.encode(file.info); // Берём info_hash из нашего проинициализированного файла
        const hash = createHash("sha1").update(bencodedInfoHash).digest("hex"); // Делаем из него sha1-хэш в hex-виде
        for (let i = 0; i <= hash.length; i++) {
            if (charPair.length === 2) { // Когда взяли пару символов, то проверяем 
                if (CORRECT_ESCAPED_SYMBOLS_CODES.includes(Number.parseInt(charPair, 16))) { // Если входит в массив допустимых ASCII-кодов, то просто парсим этот знак
                    decodedInfoHash += `${String.fromCharCode(Number.parseInt(charPair, 16))}`;
                    charPair = ""; // Делаем пару байтов пустыми, чтобы сюда вписать новые
                }
                else { // Если такого ASCII-кода нет в массиве допустимых ASCII-кодов, то оставляем как есть и добавляем в строку в виде "%nn"
                    decodedInfoHash += `%${charPair}`;
                    charPair = ""; // Делаем пару байтов пустыми, чтобы сюда вписать новые
                }
            }
            if (i < hash.length) { // Чтобы не было выхода за границы массива на последнем проходе, делаем эту проверку (i < 40)
                charPair += hash[i];
            }
        }
        // Необходимые параметры для GET-запроса для получения ответа от Tracker-сервера + info_hash, который записываем сами
        const requestParams = {
            "peer_id": "-TO0042-0ab8e8a31019",
            "port": 6881,
            "uploaded": "0",
            "downloaded": "0",
            "compact": "1",
            "left": file.info?.length.toString(),
        };
        announce += `?info_hash=${decodedInfoHash}`; // Вносим параметр info_hash без использования методов URL, т.к. неправильно преобразует символы UTF-16 в ASCII
        const base = new URL(announce); // Преобразуем строку с ссылкой файла в класс URL
        for (const [key, value] of Object.entries(requestParams)) {
            const urlEncodedValue = encodeURIComponent(value);
            base.searchParams.append(key, urlEncodedValue);
        }
        return base.href; // Возвращаем строку с полностью готовыми данными для отправки на Tracker-сервер
    }
}
//# sourceMappingURL=Tracker.js.map