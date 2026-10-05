<!-- Sifferfält med enhet, hjälptext och felmeddelande. -->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { Mode } from './model';

  interface Props {
    id: string;
    label: string;
    /** läsbart belopp bredvid etiketten; utelämna för fält utan */
    output?: string;
    unit: string;
    help?: string;
    error: string;
    min: number;
    max: number;
    step: number | 'any';
    inputmode: 'decimal' | 'numeric';
    /** fältet hör bara till det här läget */
    mode?: Mode;
    hidden?: boolean;
    value: number | null;
    children?: Snippet;
  }
  let { id, label, output, unit, help, error, min, max, step, inputmode, mode, hidden = false, value = $bindable(), children }: Props = $props();
</script>

<div class="field" data-mode={mode} {hidden}>
  {#if output === undefined}
    <label for={id}>{label}</label>
  {:else}
    <label for={id}><span>{label}</span> <output for={id} id="{id}-out">{output}</output></label>
  {/if}
  <div class="input-unit"><input {id} name={id} type="number" {inputmode} {min} {max} {step} bind:value aria-describedby={help ? `${id}-help ${id}-error` : `${id}-error`} aria-invalid={error ? 'true' : 'false'}><span class="unit">{unit}</span></div>
  {#if help}<p class="help" id="{id}-help">{help}</p>{/if}
  {@render children?.()}
  <p class="error" id="{id}-error">{error}</p>
</div>
