import { JackdawApp } from "../AppsBar/JackdawApp";
import chatIcon from '../asset/icon/appBar/chat.svg?raw';
import { gt } from "../../l10n/l10n";

export class ChatJackdawApp extends JackdawApp {
  id = "chat";
  name = gt`Chat`;
  icon = chatIcon;
  appURL = "/chat";
}

export const chatApp = new ChatJackdawApp();
