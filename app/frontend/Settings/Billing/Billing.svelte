<vbox class="billing page">
  <PageHeader
    title={$t`Jackdaw Pro`}
    subtitle={$t`Reports and live SLA control for teams that need a clear response deadline.`}
    >
    <Button
      slot="buttons-top-right"
      label={$t`Open plans`}
      icon={ExternalLinkIcon}
      classes="large filled"
      onClick={openPlans}
      />
  </PageHeader>

  <section class="status-strip" aria-live="polite">
    <div class="status-mark" aria-hidden="true">
      <CreditCardIcon size="20px" />
    </div>
    <div class="status-copy">
      <strong>{$t`Payment connection is being prepared`}</strong>
      <p>
        {$t`The recommended provider is ${billingProvider}. The purchase page opens outside Jackdaw; mail passwords and message contents are never sent to the payment service.`}
      </p>
    </div>
    <span class="status-pill">{$t`Not connected`}</span>
  </section>

  <HeaderGroupBox>
    <hbox slot="header">{$t`What is included in Pro`}</hbox>
    <div class="feature-grid">
      {#each proFeatures as feature}
        <article class="feature">
          <div class="feature-icon" aria-hidden="true">
            <svelte:component this={feature.icon} size="18px" />
          </div>
          <div>
            <h2>{feature.title()}</h2>
            <p>{feature.description()}</p>
          </div>
        </article>
      {/each}
    </div>
  </HeaderGroupBox>

  <HeaderGroupBox>
    <hbox slot="header">{$t`Plans`}</hbox>
    <div class="plans">
      <article class="plan-card">
        <div class="plan-heading">
          <div>
            <span class="eyebrow">{$t`Flexible`}</span>
            <h2>{$t`Monthly Pro`}</h2>
          </div>
          <CalendarIcon size="22px" aria-hidden="true" />
        </div>
        <p>{$t`Pay month by month. The current price is shown on the secure checkout page.`}</p>
      </article>
      <article class="plan-card featured">
        <div class="plan-heading">
          <div>
            <span class="eyebrow">{$t`Best value`}</span>
            <h2>{$t`Yearly Pro`}</h2>
          </div>
          <SparklesIcon size="22px" aria-hidden="true" />
        </div>
        <p>{$t`One annual payment. The current price and renewal terms are shown before payment.`}</p>
      </article>
    </div>
    <p class="pricing-note">
      {$t`Prices, tax details, receipts and refunds are configured on the billing side and are not hard-coded in the desktop client.`}
    </p>
  </HeaderGroupBox>

  <HeaderGroupBox>
    <hbox slot="header">{$t`How activation will work`}</hbox>
    <ol class="steps">
      <li>{$t`Choose a Pro plan on the Jackdaw website.`}</li>
      <li>{$t`Complete the YooKassa checkout in the external browser.`}</li>
      <li>{$t`The license server confirms the payment and signs your Pro entitlement.`}</li>
      <li>{$t`Jackdaw checks the signed entitlement and unlocks reports and live SLA control.`}</li>
    </ol>
    <p class="privacy-note">
      <ShieldCheckIcon size="18px" aria-hidden="true" />
      <span>{$t`Only the product account and subscription state belong in the billing system. Mail accounts, passwords and local message data stay on this device.`}</span>
    </p>
  </HeaderGroupBox>

  {#if !billingServerConfigured}
    <p class="implementation-note">
      {$t`The app-side Pro screen is ready. The final checkout and entitlement verification will be enabled after the license server is deployed.`}
    </p>
  {/if}
</vbox>

<script lang="ts">
  import CalendarIcon from "lucide-svelte/icons/calendar-days";
  import ChartIcon from "lucide-svelte/icons/chart-column";
  import CreditCardIcon from "lucide-svelte/icons/credit-card";
  import ExternalLinkIcon from "lucide-svelte/icons/external-link";
  import ShieldCheckIcon from "lucide-svelte/icons/shield-check";
  import SparklesIcon from "lucide-svelte/icons/sparkles";
  import { t } from "../../../l10n/l10n";
  import {
    BILLING_PLANS_URL,
    BILLING_PROVIDER,
    BILLING_SERVER_CONFIGURED,
  } from "../../../logic/Billing/Billing";
  import ClockIcon from "lucide-svelte/icons/clock-3";
  import BellIcon from "lucide-svelte/icons/bell-ring";
  import Button from "../../Shared/Button.svelte";
  import HeaderGroupBox from "../../Shared/HeaderGroupBox.svelte";
  import PageHeader from "../Shared/PageHeader.svelte";
  import { openExternalURL } from "../../../logic/util/os-integration";

  const billingServerConfigured = BILLING_SERVER_CONFIGURED;
  const billingProvider = BILLING_PROVIDER;
  const proFeatures = [
    {
      icon: ChartIcon,
      title: () => $t`Interactive reports`,
      description: () => $t`Charts, dashboard widgets, filters, sorting and a full report view inside Jackdaw.`,
    },
    {
      icon: ClockIcon,
      title: () => $t`Live SLA control`,
      description: () => $t`A right-side queue with a working-time timer, deadline and overdue state for every open request.`,
    },
    {
      icon: CalendarIcon,
      title: () => $t`Working calendar`,
      description: () => $t`Different working hours for each weekday, with weekends and out-of-hours time excluded from SLA.`,
    },
    {
      icon: BellIcon,
      title: () => $t`Reminders`,
      description: () => $t`Configurable checkpoints such as 10, 20 and 25 working minutes before a reply.`,
    },
    {
      icon: ExternalLinkIcon,
      title: () => $t`HTML export`,
      description: () => $t`Save a checked, detailed report as an HTML copy after reviewing it inside the app.`,
    },
  ];

  async function openPlans(): Promise<void> {
    await openExternalURL(BILLING_PLANS_URL);
  }
</script>

<style>
  .page {
    max-width: 68em;
    padding-block-end: 48px;
  }

  .status-strip {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-block-start: 28px;
    padding: 16px;
    border: 1px solid color-mix(in srgb, var(--selected-bg) 38%, var(--border));
    border-radius: 10px;
    background: color-mix(in srgb, var(--selected-bg) 8%, var(--main-bg));
  }

  .status-mark,
  .feature-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    color: var(--selected-bg);
  }

  .status-copy {
    min-width: 0;
    flex: 1 1 auto;
  }

  .status-copy strong {
    display: block;
    font-size: 16px;
    line-height: 1.25;
  }

  p {
    margin: 6px 0 0;
    line-height: 1.45;
    color: color-mix(in srgb, var(--main-fg) 72%, transparent);
  }

  .status-pill,
  .eyebrow {
    color: color-mix(in srgb, var(--main-fg) 64%, transparent);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.04em;
    white-space: nowrap;
  }

  .status-pill {
    align-self: center;
    padding: 4px 8px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--main-fg) 10%, transparent);
  }

  .feature-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .feature {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    min-width: 0;
    padding: 14px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: color-mix(in srgb, var(--main-bg) 84%, var(--headerbar-bg));
  }

  h2 {
    margin: 0;
    font-size: 16px;
    line-height: 1.3;
  }

  .feature p {
    font-size: 14px;
  }

  .plans {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .plan-card {
    min-width: 0;
    padding: 16px;
    border: 1px solid var(--border);
    border-radius: 8px;
  }

  .plan-card.featured {
    border-color: color-mix(in srgb, var(--selected-bg) 48%, var(--border));
    background: color-mix(in srgb, var(--selected-bg) 7%, var(--main-bg));
  }

  .plan-heading {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  .plan-heading :global(svg) {
    flex: 0 0 auto;
    color: var(--selected-bg);
  }

  .plan-card p,
  .pricing-note,
  .implementation-note {
    font-size: 14px;
  }

  .pricing-note {
    margin-block-start: 16px;
  }

  .steps {
    display: grid;
    gap: 10px;
    margin: 0;
    padding-inline-start: 24px;
    line-height: 1.45;
  }

  .privacy-note {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin-block-start: 20px;
  }

  .privacy-note :global(svg) {
    flex: 0 0 auto;
    margin-block-start: 2px;
    color: var(--selected-bg);
  }

  .implementation-note {
    margin-block-start: 24px;
    padding-block-start: 16px;
    border-block-start: 1px solid var(--border);
  }

  @media (max-width: 720px) {
    .feature-grid,
    .plans {
      grid-template-columns: 1fr;
    }

    .status-strip {
      flex-wrap: wrap;
    }

    .status-pill {
      margin-inline-start: 32px;
    }
  }
</style>
