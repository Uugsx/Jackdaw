<hbox class="about">
  <img class="app-icon" src={appIcon} width="96" height="96" alt="" />
  <vbox class="copy">
    <h1>{appName} {appVersion}</h1>

    <div>
      <T msg={$t`Copyright 2026 # and other contributors`}>
        <a href="{siteRoot}" target="_blank">Jackdaw</a>
      </T>
    </div>

    <vbox class="update">
      <Update />
    </vbox>
  </vbox>
</hbox>

<script lang="ts">
  import { appName, appVersion, siteRoot } from '../../../logic/build';
  import Update from './Update.svelte';
  import T from '../../../l10n/T.svelte';
  import appIcon from '../../asset/icon/general/app-icon.png';
  import { t } from '../../../l10n/l10n';
</script>

<style>
  .about {
    align-items: start;
    gap: 20px;
    max-width: 40em;
  }
  .app-icon {
    width: 96px;
    height: 96px;
    flex-shrink: 0;
    border-radius: 22px;
  }
  .copy {
    min-width: 0;
    padding-block-start: 4px;
  }
  h1 {
    margin: 0 0 12px;
    font-size: 28px;
    line-height: 1.2;
    letter-spacing: -0.03em;
  }
  .update {
    margin-block-start: 24px;
  }
</style>
