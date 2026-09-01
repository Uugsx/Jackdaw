<hbox class="graphic-selector" flex>
  <vbox class="type-selector">
    <RoundButton
      label={$t`Emoji`}
      onClick={() => showGraphicType = GraphicType.Emoji}
      selected={showGraphicType == GraphicType.Emoji}
      icon={EmojiIcon}
      border={false} classes="plain"
      />
    <RoundButton
      label={$t`GIF`}
      onClick={() => showGraphicType = GraphicType.GIF}
      selected={showGraphicType == GraphicType.GIF}
      icon={GIFIcon}
      border={false} classes="plain"
      >
      <hbox slot="icon font-smallest">GIF</hbox>
    </RoundButton>
    <RoundButton
      label={$t`Sticker`}
      onClick={() => showGraphicType = GraphicType.Sticker}
      selected={showGraphicType == GraphicType.Sticker}
      icon={StickerIcon}
      border={false} classes="plain"
      />
    <hbox flex />
    <RoundButton
      label={$t`Delete last`}
      icon={BackspaceIcon}
      border={false} classes="plain"
      onClick={() => dispatchEvent("backspace")}
      />
  </vbox>

  <vbox class="content" flex>
    <hbox class="search">
      <SearchField bind:searchTerm />
      <hbox flex />
      <RoundButton
        label={$t`Close`}
        icon={XIcon}
        border={false} classes="plain"
        onClick={() => isOpen = false}
        />
    </hbox>

    {#if showGraphicType == GraphicType.Emoji}
      <EmojiSelector {searchTerm} on:select />
    {:else if showGraphicType == GraphicType.GIF}
      <GIFPicker bind:searchTerm on:select={forwardSelection} />
    {:else if showGraphicType == GraphicType.Sticker}
      <StickerPicker bind:searchTerm on:select={forwardSelection} />
    {/if}
  </vbox>
</hbox>

<script lang="ts">
  import EmojiSelector from "./EmojiSelector.svelte";
  import GIFPicker from "./GIFPicker.svelte";
  import StickerPicker from "./StickerPicker.svelte";
  import SearchField from "../../Shared/SearchField.svelte";
  import RoundButton from "../../Shared/RoundButton.svelte";
  import type { GraphicSelection } from "./media";
  import EmojiIcon from "lucide-svelte/icons/smile";
  import GIFIcon from "lucide-svelte/icons/bird";
  import StickerIcon from "lucide-svelte/icons/heart";
  import BackspaceIcon from "lucide-svelte/icons/delete";
  import XIcon from "lucide-svelte/icons/x";
  import { t } from "../../../l10n/l10n";
  import { createEventDispatcher } from 'svelte';
  const dispatchEvent = createEventDispatcher<{ backspace: void, select: GraphicSelection }>();

  /** in/out */
  export let isOpen: boolean;

  let searchTerm: string | null;

  enum GraphicType {
    Emoji,
    GIF,
    Sticker,
  };
  let showGraphicType = GraphicType.Emoji;

  function forwardSelection(event: CustomEvent<GraphicSelection>) {
    dispatchEvent("select", event.detail);
  }
</script>

<style>
  .graphic-selector {
    flex: 1 1 0;
    min-height: 0;
    min-width: 0;
  }
  .content {
    min-height: 0;
    min-width: 0;
  }
  .search {
    margin: 4px 8px 8px 56px;
  }
</style>
