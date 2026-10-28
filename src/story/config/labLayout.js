// Classroom layout for the story. Everything here is data: change numbers, not code.
// Units: metres. Origin = centre of the floor. -z = front wall (display), +z = back wall,
// -x = left wall (windows), +x = right wall (door). Matches the supplied classroom reference
// photos when viewed from the back wall towards the interactive display.

export const ROOM = {
  width: 8.4,   // x extent
  depth: 10.4,  // z extent
  height: 3.1,
  wainscot: 1.05, // height of the beige lower wall band seen in the reference
};

const HALF_W = ROOM.width / 2;
const HALF_D = ROOM.depth / 2;
const DESK_D = 0.6;

/**
 * Student workstation runs. Each run is a straight counter of desks against one wall.
 * `count` desks are spread evenly between `from` and `to` along the wall.
 * The total of all counts must equal STUDENT_COUNT (checked by tests and by the final verification).
 */
export const STUDENT_COUNT = 25;
export const DESK_RUNS = [
  // left wall (windows) – students face the wall (starts after the front-left corner printer table)
  { id: 'L', wall: 'left', count: 9, from: -3.55, to: HALF_D - DESK_D - 0.5 },
  // back wall – under the network cabinet and the air conditioner
  { id: 'B', wall: 'back', count: 8, from: -HALF_W + DESK_D + 0.5, to: HALF_W - DESK_D - 0.5 },
  // right wall – starts after the door so the door can swing freely
  { id: 'R', wall: 'right', count: 8, from: -2.85, to: HALF_D - DESK_D - 0.5 },
];

/** fixed elements matching the real BTEC classroom photos */
export const FIXTURES = {
  display: { wall: 'front', x: 0, y: 1.55, w: 2.3, h: 1.32, label: 'interactive display' },
  door: { wall: 'right', z: -4.1, w: 0.95, h: 2.15, hinge: 'front', swing: 'in' },
  ups: [{ id: 'ups1', x: 2.75, z: -HALF_D + 0.34, rotY: 0, note: 'behind the door along the front-right wall' }],
  cabinet: { wall: 'back', x: -2.55, y: 1.78, mounted: true, note: 'inside the room, on the back wall, left side, above the desks' },
  ac: { wall: 'back', x: 0, y: 2.55, note: 'inside the room, middle of the back wall, above the desks' },
  windows: [{ z: -3.45, w: 1.72 }, { z: -1.15, w: 1.72 }, { z: 1.15, w: 1.72 }, { z: 3.45, w: 1.72 }],
  posters: [{ x: -2.3, text: 'Better Skills\nBrighter Future' }, { x: 2.2, text: 'Learn Create\nGrow Together' }],
  printer: { x: -3.45, z: -HALF_D + 0.44, rotY: 0, note: 'front-left corner next to the teacher workstation' },
  teacherDesk: { x: -2.25, z: -HALF_D + 1.22, w: 1.65, d: 0.72, note: 'front-left in front of the printer table; teacher faces the class' },
  bunting: { wall: 'back', y: 2.85 },
};

/** compute the desk/chair/PC transform for every student station from the runs */
export function computeStations(runs = DESK_RUNS) {
  const out = [];
  let n = 0;
  for (const r of runs) {
    const pitch = r.count > 1 ? (r.to - r.from) / (r.count - 1) : 0;
    for (let i = 0; i < r.count; i++) {
      const s = r.from + pitch * i;
      let x, z, rotY;
      // rotY = direction the student faces (towards the wall)
      if (r.wall === 'left') { x = -HALF_W + DESK_D / 2; z = s; rotY = Math.PI / 2; }
      else if (r.wall === 'right') { x = HALF_W - DESK_D / 2; z = s; rotY = -Math.PI / 2; }
      else if (r.wall === 'back') { x = s; z = HALF_D - DESK_D / 2; rotY = Math.PI; }
      else { x = s; z = -HALF_D + DESK_D / 2; rotY = 0; }
      n += 1;
      out.push({ id: `S${String(n).padStart(2, '0')}`, run: r.id, wall: r.wall, index: i, x, z, rotY, width: Math.min(0.95, Math.abs(pitch) || 0.95) });
    }
  }
  return out;
}

/** network outlet (wall jack) for a station: on the wall behind the desk at skirting height */
export function outletFor(st) {
  const y = 0.32;
  if (st.wall === 'left') return { x: -HALF_W + 0.02, y, z: st.z };
  if (st.wall === 'right') return { x: HALF_W - 0.02, y, z: st.z };
  if (st.wall === 'back') return { x: st.x, y, z: HALF_D - 0.02 };
  return { x: st.x, y, z: -HALF_D + 0.02 };
}

export const HALF = { w: HALF_W, d: HALF_D };
export const DESK_DEPTH = DESK_D;
