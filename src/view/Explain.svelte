<!-- "Så räknade vi": landets formel med användarens egna siffror. -->
<script lang="ts">
  import type { Model } from './model';

  let { model }: { model: Model } = $props();
</script>

<div class="explain-group"><ul>{#each model.general as line}<li>{line}</li>{/each}</ul></div>
{#each model.accounts as acc (acc.key)}
  <div class="explain-group">
    <h3>{acc.label}</h3>
    <ul>
      {#each acc.explain as line}<li>{line}</li>{/each}
      {#if acc.overflowText}<li>{acc.overflowText}</li>{/if}
    </ul>
  </div>
{/each}
