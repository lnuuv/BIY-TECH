import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { BUILDERS, buildPC, buildMotherboard } from '../src/three/models.js';
import { PARTS } from '../shared/content/parts.js';

for (const [name, build] of Object.entries(BUILDERS)) {
  test(`model "${name}" builds with sane bounds and documented parts`, () => {
    const m = build();
    const box = new THREE.Box3().setFromObject(m.group); const s = box.getSize(new THREE.Vector3());
    assert.ok(s.x > 1 && s.y > 0.5 && s.z > 1, JSON.stringify(s));
    assert.ok(s.x < 60 && s.y < 60 && s.z < 60);
    assert.ok(Object.keys(m.parts).length >= 4);
    for (const [id, p] of Object.entries(m.parts)) {
      assert.ok(p.group.userData.partId === id);
      if (p.pickable !== false && !['cables'].includes(id)) assert.ok(PARTS[id], `missing info for part ${id} in model ${name}`);
      let meshes = 0; p.group.traverse((o) => o.isMesh && meshes++);
      assert.ok(meshes > 0, `${id} has no geometry`);
    }
    m.update?.(1, 0.016); m.guides?.(m.parts);
  });
}
test('assembly mode builds and cable draw-range follows factor', () => {
  const m = buildPC({ mode: 'assembly', init: { cable24: 1, board: 1, psu: 1, gpu: 1, sidepanel: 1 } });
  assert.equal(m.parts.cable24.group.visible, false);
  m.parts.cable24.f = 0; m.parts.cable24.onFactor(0);
  assert.equal(m.parts.cable24.group.visible, true);
  assert.equal(m.parts.cpu.explode, undefined);
  assert.ok(m.parts.gpu.explode);
});
test('bench motherboard only explodes assembly parts', () => {
  const m = buildMotherboard({ bench: true, init: { cpu: 1, ram: 1, m2: 1, cooler: 1 } });
  assert.deepEqual(Object.keys(m.parts).filter((k) => m.parts[k].explode).sort(), ['cooler', 'cpu', 'm2', 'ram']);
  assert.equal(m.parts.cpu.f, 1);
});
import { buildNetDevice3D } from '../src/three/netModels.js';
import * as S from '../src/lab/sim.js';

test('every 3D network lab hardware device builds with realistic geometry and matching port anchors', () => {
  const m = S.emptyModel();
  for (const [type, meta] of Object.entries(S.DEVICE_TYPES)) {
    const dev = S.createDevice(m, type);
    const node = buildNetDevice3D(dev);
    const box = new THREE.Box3().setFromObject(node.group);
    const s = box.getSize(new THREE.Vector3());
    assert.ok(s.x > 0.3 && s.y > 0.15 && s.z > 0.3, `bounds too small for ${type}: ${JSON.stringify(s)}`);
    let meshCount = 0;
    node.group.traverse((o) => { if (o.isMesh) meshCount++; });
    assert.ok(meshCount >= 6, `expected detailed hardware geometry for ${type}, got ${meshCount} meshes`);
    for (const [portId] of meta.ports) {
      assert.ok(node.portAnchors[portId], `missing portAnchor ${portId} on ${type}`);
      assert.ok(node.portNormals[portId], `missing portNormal ${portId} on ${type}`);
      assert.ok(node.portSockets[portId], `missing portSocket ${portId} on ${type}`);
    }
    node.setState({ selected: true, on: true, portStates: { [meta.ports[0][0]]: { linked: true, up: true } } });
    node.setState({ selected: false, on: false, failed: true });
  }
});
