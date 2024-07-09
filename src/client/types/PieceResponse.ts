// Ответ от сообщения Response
export type PieceResponse = {
    // Индекс части, к которой относится блок
    index: number,
    // Начало отступа для блока
    begin: number,
    // Данные блока
    block: Buffer,
}