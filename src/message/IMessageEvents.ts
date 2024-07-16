import { Message } from "../message/Message.js";

// События, на которые реагирует Client
export interface IMessageEvents {
    // Пришло сообщение Choke
    msgChoke: () => void;
    // Пришло сообщение Unchoke
    msgUnchoke: () => void;
    // Пришло сообщение Interested
    msgInterested: () => void;
    // Пришло сообщение Not Interested
    msgNotInterested: () => void;
    // Пришло сообщение Have
    msgHave: (message: Message) => void;
    // Пришло сообщение Bitfield
    msgBitfield: (message: Message) => void;
    // Пришло сообщение Request
    msgRequest: (message: Message) => void;
    // Пришло сообщение Piece
    msgPiece: (message: Message) => void;
    // Пришло сообщение Cancel
    msgCancel: (message: Message) => void;
    // Пришло сообщене Port
    msgPort: (message: Message) => void;
}