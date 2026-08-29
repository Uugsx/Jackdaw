import { JackdawApp } from "../AppsBar/JackdawApp";
import TopicIcon from "lucide-svelte/icons/share-2";
import { gt } from "../../l10n/l10n";

export class TopicJackdawApp extends JackdawApp {
  id = "topic";
  name = gt`Topic`;
  icon = TopicIcon;
  appURL = "/topic";
}

export const topicApp = new TopicJackdawApp();
