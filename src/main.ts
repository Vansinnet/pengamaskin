// Startpunkt i webbläsaren. Bygget förrenderar sidan (scripts/prerender.js),
// så i produktion tar Svelte över den färdiga HTML:en (hydrering).
// I utvecklingsläget (npm run dev) finns ingen förrenderad HTML.
import { hydrate, mount } from 'svelte';
import App from './App.svelte';
import './styles.css';

const target = document.getElementById('app')!;
export default import.meta.env.DEV ? mount(App, { target }) : hydrate(App, { target });
