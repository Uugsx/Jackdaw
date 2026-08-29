{#if $selectedPerson}
  <CombinedButton
    icon1={chatApp.icon}
    icon2={$selectedPerson.picture ?? PersonIcon}
    page={URLPart`/chat/person/${$selectedPerson.id}`}
    params={{ person: $selectedPerson}} />
{:else}
  <hbox class="empty" />
{/if}
<AccountButton account={appGlobal.chatAccounts.get(0)} page={acc => `/chat/account/${acc.id}/persons`} defaultIcon={AccountIcon} />
<AppButton app={chatApp} page="/chat/" />
<BasicButton icon={SearchIcon} page="/chat/search" />
<BasicButton icon={PencilIcon} page="/chat/" />

<script lang="ts">
  import { chatApp } from "../../../Chat/ChatJackdawApp";
  import { selectedPerson } from "../../../Contacts/Person/Selected";
  import { appGlobal } from "../../../../logic/app";
  import AccountButton from "../AccountButton.svelte";
  import AppButton from "../AppButton.svelte";
  import CombinedButton from "../CombinedButton.svelte";
  import BasicButton from "../BasicButton.svelte";
  import SearchIcon from "lucide-svelte/icons/search";
  import PersonIcon from "lucide-svelte/icons/user";
  import PencilIcon from "lucide-svelte/icons/pencil";
  import AccountIcon from "lucide-svelte/icons/message-square";
  import { URLPart } from "../../../Util/util";
</script>
