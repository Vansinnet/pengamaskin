// Förrendering vid bygget: hela sidan som HTML med startvärdena (svenska, Sverige).
import { render as renderSvelte } from 'svelte/server';
import App from './App.svelte';

export const render = () => renderSvelte(App);
