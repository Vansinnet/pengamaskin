<!-- År för år som tabell. -->
<script lang="ts">
  import type { Model } from './model';

  let { model }: { model: Model } = $props();
  const { timeline, accounts, t, format: f } = $derived(model);
  const headers = $derived([t('thYear'), t('thInvested'), t('thReturnTotal'), t('thReturnYear'), t('thBeforeTax'),
    ...accounts.map((a) => t('thAfterTax', { account: a.label }))]);
</script>

<thead><tr>{#each headers as c}<th scope="col">{c}</th>{/each}</tr></thead>
<tbody>
  {#each timeline as r, i (r.year)}
    <tr>
      <th scope="row">{r.year}</th>
      <td>{f.money(r.invested)}</td>
      <td>{f.money(r.beforeTax - r.invested)}</td>
      <td>{i ? f.money(r.beforeTax - r.invested - (timeline[i - 1].beforeTax - timeline[i - 1].invested)) : '–'}</td>
      <td>{f.money(r.beforeTax)}</td>
      {#each r.net as v}<td>{f.money(v)}</td>{/each}
    </tr>
  {/each}
</tbody>
