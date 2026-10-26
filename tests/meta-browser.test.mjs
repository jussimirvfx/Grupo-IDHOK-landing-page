import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

for (const target of [
  { name: 'production', url: 'https://lp2.idhok.com.br/', production: true },
  { name: 'localhost', url: 'http://localhost:3000/', production: false },
]) {
test(`real scoretrack provider tracks PageView, leads and scroll milestones once on ${target.name}`, async () => {
  const bundle = await build({
    stdin: { contents: `
      import React, {useEffect} from 'react';
      import {createRoot} from 'react-dom/client';
      import {TrackingProvider} from './src/MetaTrackingProvider.tsx';
      import {useLeadTracking, updateAdvancedMatching} from './src/metaTracking.tsx';
      import {trackAcceptedLead} from './lib/meta-lead.js';
      function Probe() {
        const tracking = useLeadTracking();
        useEffect(() => {
          window.testAcceptedLead = () => trackAcceptedLead(tracking,
            {ownerName:'Teste Isolado', email:'teste@example.invalid', phone:'(47) 99999-9999'},
            {accepted:true,lead_score:100,isQualifiedLead:true,score_status:'qualified',disqualification_reasons:[],tracking_data:{city:'Teste',state:'SC'}},
            updateAdvancedMatching);
        }, [tracking]);
        return <div>Teste do provider</div>;
      }
      createRoot(document.getElementById('root')).render(<TrackingProvider><Probe /></TrackingProvider>);
    `, resolveDir: process.cwd(), loader: 'tsx' },
    bundle: true, write: false, platform: 'browser', format: 'iife', logLevel: 'silent',
    define: { 'import.meta.env': JSON.stringify({ PROD: target.production, DEV: !target.production, VITE_META_PIXEL_ID: '2372940856574782' }), 'process.env.NODE_ENV': '"production"' },
  });
  const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: target.url, runScripts: 'outside-only', pretendToBeVisual: true });
  const pixel = [], requests = [], errors = [];
  let scrollY = 0;
  Object.defineProperty(dom.window.document.documentElement, 'scrollHeight', { value: 1800 });
  Object.defineProperty(dom.window, 'innerHeight', { value: 800 });
  Object.defineProperty(dom.window, 'scrollY', { get: () => scrollY });
  const scrollTo = async (position) => {
    scrollY = position;
    dom.window.dispatchEvent(new dom.window.Event('scroll'));
    await new Promise((resolve) => setTimeout(resolve, 50));
  };
  const depths = () => requests.filter((event) => event.event_name === 'Scroll').map((event) => event.custom_data.scroll_depth);
  dom.window._fbPixelScriptLoaded = true;
  dom.window.fbq = (...args) => pixel.push(args);
  dom.window.fetch = async (url, options) => {
    assert.equal(url, '/api/meta/conversions');
    requests.push(JSON.parse(options.body));
    return { ok: true, json: async () => ({ success: true, events_received: 1 }) };
  };
  dom.window.console = { ...console, log() {}, info() {}, debug() {}, warn() {}, group() {}, groupCollapsed() {}, groupEnd() {}, error: (...args) => errors.push(args) };
  try {
    dom.window.eval(bundle.outputFiles[0].text);
    const deadline = Date.now() + 6000;
    while (!requests.some((event) => event.event_name === 'PageView') && Date.now() < deadline) await new Promise((resolve) => setTimeout(resolve, 50));
    assert.equal(requests.filter((event) => event.event_name === 'PageView').length, 1);
    await dom.window.testAcceptedLead();
    assert.deepEqual(requests.filter((event) => event.event_name !== 'Scroll').map((event) => event.event_name), ['PageView', 'Lead', 'LeadQualificado']);
    assert.deepEqual(depths(), [0]);
    await scrollTo(249);
    assert.deepEqual(depths(), [0]);
    await scrollTo(250);
    await scrollTo(500);
    await scrollTo(750);
    await scrollTo(998.9);
    assert.deepEqual(depths(), [0, 25, 50, 75]);
    await scrollTo(999);
    await scrollTo(0);
    await scrollTo(1000);
    assert.deepEqual(depths(), [0, 25, 50, 75, 100]);
    for (const event of requests) {
      const browser = pixel.find((args) => ['track', 'trackCustom'].includes(args[0]) && args[1] === event.event_name && args[3]?.eventID === event.event_id);
      assert.ok(browser, event.event_name);
      assert.equal(browser[3].eventID, event.event_id);
      if (['Lead', 'LeadQualificado'].includes(event.event_name)) {
        assert.match([event.user_data.em].flat()[0], /^[a-f\d]{64}$/);
        assert.match([event.user_data.ph].flat()[0], /^[a-f\d]{64}$/);
        assert.equal(event.custom_data.value, event.custom_data.lead_score);
      }
      if (event.event_name === 'Scroll') {
        assert.equal(browser[0], 'trackCustom');
        assert.equal(event.custom_data.scroll_percentage, event.custom_data.scroll_depth);
        assert.equal(event.custom_data.page_path, '/');
      }
    }
    assert.equal(errors.length, 0);
  } finally { dom.window.close(); }
});
}
