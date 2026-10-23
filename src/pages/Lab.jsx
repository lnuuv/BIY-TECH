import React, { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/index.jsx';
import { Chip, Icon, PageHead } from '../components/ui.jsx';
import { usePageContext } from '../assistant/pageContext.js';

const DEVICE_TYPES = [
  { type: 'pc', labelAr: 'حاسوب (PC)', labelEn: 'PC', icon: '💻', color: '#3b82f6' },
  { type: 'laptop', labelAr: 'لابتوب (Laptop)', labelEn: 'Laptop', icon: '🧳', color: '#06b6d4' },
  { type: 'switch', labelAr: 'سويتش (Switch)', labelEn: 'Switch', icon: '🔀', color: '#10b981' },
  { type: 'router', labelAr: 'راوتر (Router)', labelEn: 'Router', icon: '🌐', color: '#6366f1' },
  { type: 'printer', labelAr: 'طابعة (Printer)', labelEn: 'Printer', icon: '🖨️', color: '#f59e0b' },
  { type: 'phone', labelAr: 'هاتف (Phone)', labelEn: 'Phone', icon: '📱', color: '#ec4899' },
  { type: 'server', labelAr: 'خادم (Server)', labelEn: 'Server', icon: '🗄️', color: '#14b8a6' },
  { type: 'ap', labelAr: 'نقطة وصول (AP)', labelEn: 'Access Point', icon: '📡', color: '#8b5cf6' },
];

const CABLE_TYPES = [
  { id: 'straight', labelAr: 'كابل مستقيم (Straight)', labelEn: 'Straight-Through', color: '#3b82f6', dash: '' },
  { id: 'cross', labelAr: 'كابل متقاطع (Cross-over)', labelEn: 'Cross-Over', color: '#f59e0b', dash: '6,4' },
  { id: 'fiber', labelAr: 'ألياف ضوئية (Fiber)', labelEn: 'Fiber Optic', color: '#ec4899', dash: '' },
  { id: 'console', labelAr: 'كابل تحكم (Console)', labelEn: 'Console', color: '#06b6d4', dash: '3,3' },
  { id: 'aux', labelAr: 'كابل مساعد (Aux)', labelEn: 'Aux', color: '#a855f7', dash: '8,3,2,3' },
];

function ipToInt(ip) {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec((ip || '').trim());
  if (!m) return null;
  const o = m.slice(1).map((x) => parseInt(x, 10));
  if (o.some((x) => Number.isNaN(x) || x < 0 || x > 255)) return null;
  return (((o[0] << 24) >>> 0) + (o[1] << 16) + (o[2] << 8) + o[3]) >>> 0;
}

function intToIp(int) {
  const x = int >>> 0;
  return [(x >>> 24) & 255, (x >>> 16) & 255, (x >>> 8) & 255, x & 255].join('.');
}

function sameSubnet(ipA, ipB, maskStr = '255.255.255.0') {
  const a = ipToInt(ipA);
  const b = ipToInt(ipB);
  const m = ipToInt(maskStr);
  if (a === null || b === null || m === null) return false;
  return ((a & m) >>> 0) === ((b & m) >>> 0);
}

function makePortsForType(type, idx) {
  const macBase = `001A.2B${String(idx).padStart(2, '0')}`;
  if (type === 'switch') {
    const p = {};
    for (let i = 1; i <= 4; i++) {
      p[`Fa0/${i}`] = { kind: 'eth', adminUp: true, vlan: 1, mode: 'access', mac: `${macBase}.010${i}` };
    }
    return p;
  }
  if (type === 'router') {
    return {
      'Gi0/0': { kind: 'eth', adminUp: false, ip: '', mask: '255.255.255.0', mac: `${macBase}.0200` },
      'Gi0/1': { kind: 'eth', adminUp: false, ip: '', mask: '255.255.255.0', mac: `${macBase}.0201` },
      Con0: { kind: 'console', adminUp: true },
      Aux0: { kind: 'aux', adminUp: true },
    };
  }
  if (type === 'ap') {
    return {
      'Fa0/0': { kind: 'eth', adminUp: true, mac: `${macBase}.0300` },
      WLAN0: { kind: 'wifi', adminUp: true, mac: `${macBase}.0301` },
    };
  }
  if (type === 'laptop' || type === 'phone') {
    return {
      'Fa0/0': { kind: 'eth', adminUp: true, mac: `${macBase}.0400` },
      WLAN0: { kind: 'wifi', adminUp: true, mac: `${macBase}.0401` },
    };
  }
  return {
    'Fa0/0': { kind: 'eth', adminUp: true, mac: `${macBase}.0500` },
    ...(type === 'pc' ? { Con0: { kind: 'console', adminUp: true } } : {}),
  };
}

function createDeviceNode(type, idNum, x, y) {
  const prefix = {
    pc: 'PC',
    laptop: 'Laptop',
    switch: 'Switch',
    router: 'Router',
    printer: 'Printer',
    phone: 'Phone',
    server: 'Server',
    ap: 'AP',
  }[type] || 'Node';
  const name = `${prefix}${idNum}`;
  const isEndHost = ['pc', 'laptop', 'printer', 'phone', 'server'].includes(type);
  const ip = isEndHost ? `192.168.1.${10 + idNum}` : type === 'switch' ? `192.168.1.${200 + idNum}` : '';
  return {
    id: idNum,
    type,
    name,
    hostname: name,
    x,
    y,
    ip,
    mask: '255.255.255.0',
    gw: isEndHost ? '192.168.1.1' : '',
    dns: isEndHost ? '192.168.1.50' : '',
    dhcp: false,
    wifiSsid: type === 'ap' ? 'CorpWiFi' : (type === 'laptop' || type === 'phone' ? 'CorpWiFi' : ''),
    wifiKey: '12345678',
    ports: makePortsForType(type, idNum),
    routes: [], // { dst, mask, nextHop }
    dhcpPools: type === 'router' || type === 'server'
      ? {
          LAN: {
            network: '192.168.1.0',
            mask: '255.255.255.0',
            defaultRouter: '192.168.1.1',
            dnsServer: '192.168.1.50',
            startIp: '192.168.1.100',
            endIp: '192.168.1.150',
          },
        }
      : {},
    services: type === 'server'
      ? {
          http: true,
          dns: true,
          dnsRecords: { 'intranet.local': ip || '192.168.1.50', 'printer.local': '192.168.1.30' },
          files: ['welcome.txt', 'network-plan.pdf'],
        }
      : type === 'printer'
      ? { jobs: [] }
      : {},
    cliMode: type === 'router' || type === 'switch' ? 'user' : 'host',
    cliIf: null,
    cliHistory: [
      type === 'router' || type === 'switch'
        ? `Cisco IOS Software, ${name} Ready. Type "help" or "?" for commands.`
        : `${name} Host OS Shell. Type "help" for commands (ipconfig, ping, dhcp, nslookup, curl, print, store).`,
    ],
  };
}

function buildDemoTopology() {
  const r1 = createDeviceNode('router', 1, 410, 95);
  r1.ports['Gi0/0'].adminUp = true;
  r1.ports['Gi0/0'].ip = '192.168.1.1';
  r1.ports['Gi0/0'].mask = '255.255.255.0';

  const sw1 = createDeviceNode('switch', 2, 410, 235);
  sw1.ip = '192.168.1.2';

  const pc1 = createDeviceNode('pc', 3, 165, 365);
  pc1.ip = '192.168.1.10';
  pc1.gw = '192.168.1.1';
  pc1.dns = '192.168.1.50';

  const srv1 = createDeviceNode('server', 4, 330, 385);
  srv1.ip = '192.168.1.50';
  srv1.gw = '192.168.1.1';
  srv1.services.dnsRecords = {
    'server.local': '192.168.1.50',
    'intranet.local': '192.168.1.50',
    'printer.local': '192.168.1.30',
  };

  const prn1 = createDeviceNode('printer', 5, 505, 385);
  prn1.ip = '192.168.1.30';
  prn1.gw = '192.168.1.1';

  const ap1 = createDeviceNode('ap', 6, 660, 235);
  ap1.wifiSsid = 'SchoolLabWiFi';

  const lap1 = createDeviceNode('laptop', 7, 700, 375);
  lap1.ip = '192.168.1.14';
  lap1.gw = '192.168.1.1';
  lap1.dns = '192.168.1.50';
  lap1.wifiSsid = 'SchoolLabWiFi';

  const links = [
    { id: 'l1', a: 1, portA: 'Gi0/0', b: 2, portB: 'Fa0/1', type: 'straight' },
    { id: 'l2', a: 2, portA: 'Fa0/2', b: 3, portB: 'Fa0/0', type: 'straight' },
    { id: 'l3', a: 2, portA: 'Fa0/3', b: 4, portB: 'Fa0/0', type: 'straight' },
    { id: 'l4', a: 2, portA: 'Fa0/4', b: 5, portB: 'Fa0/0', type: 'straight' },
    { id: 'l5', a: 2, portA: 'Fa0/5', b: 6, portB: 'Fa0/0', type: 'straight' },
  ];
  // Add Fa0/5 to switch for AP
  sw1.ports['Fa0/5'] = { kind: 'eth', adminUp: true, vlan: 1, mode: 'access', mac: '001A.2B02.0105' };

  return { nodes: [r1, sw1, pc1, srv1, prn1, ap1, lap1], links, nextId: 8 };
}

export default function Lab() {
  const { lang } = useI18n();
  const isAr = lang === 'ar';

  const [state, setState] = useState(() => buildDemoTopology());
  const [selectedId, setSelectedId] = useState(3); // PC3 selected by default
  const [activeTool, setActiveTool] = useState('select'); // select | cable | ping | delete
  const [cableType, setCableType] = useState('straight');
  const [cableSource, setCableSource] = useState(null);
  const [pingSource, setPingSource] = useState(null);
  const [statusMsg, setStatusMsg] = useState(
    isAr
      ? 'مرحباً بك في محاكي الشبكات التفاعلي (Packet Tracer Lite). اختر جهازاً لإعداد عناوين IP أو فتح طرفية الأوامر CLI أو اختبار الاتصال Ping.'
      : 'Welcome to Packet Tracer Lite. Select a device to configure IP settings, use the CLI terminal, or test connectivity with Ping.'
  );
  const [packets, setPackets] = useState([]); // animated packets [{ id, x1, y1, x2, y2, color }]
  const [cliInput, setCliInput] = useState('');
  const svgRef = useRef(null);
  const dragRef = useRef(null);
  const cliEndRef = useRef(null);

  const selectedNode = state.nodes.find((n) => n.id === selectedId) || null;

  usePageContext({
    page: 'lab',
    deviceCount: state.nodes.length,
    linkCount: state.links.length,
    selectedDevice: selectedNode ? { name: selectedNode.name, type: selectedNode.type, ip: selectedNode.ip } : null,
  });

  useEffect(() => {
    cliEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selectedNode?.cliHistory?.length, selectedId]);

  // Wireless links (virtual L2 links between laptops/phones and AP with matching SSID)
  const wifiLinks = [];
  const aps = state.nodes.filter((n) => n.type === 'ap' && n.wifiSsid);
  for (const host of state.nodes) {
    if ((host.type === 'laptop' || host.type === 'phone') && host.wifiSsid) {
      const matchAp = aps.find((ap) => ap.wifiSsid === host.wifiSsid && ap.wifiKey === host.wifiKey);
      if (matchAp) {
        wifiLinks.push({ id: `wifi-${host.id}-${matchAp.id}`, a: host.id, b: matchAp.id, type: 'wifi' });
      }
    }
  }

  // Adjacency & L2/L3 reachability engine
  const findPathAndCheckPing = (srcNode, dstIpRaw) => {
    const dstIp = (dstIpRaw || '').trim();
    if (!dstIp) return { ok: false, reason: isAr ? 'عنوان الهدف فارغ.' : 'Destination address is empty.' };

    // Resolve DNS if dstIp is hostname
    let resolvedIp = dstIp;
    if (!ipToInt(dstIp)) {
      const dnsSrv = state.nodes.find(
        (n) => n.type === 'server' && n.services?.dns && n.services?.dnsRecords?.[dstIp.toLowerCase()]
      );
      if (dnsSrv) {
        resolvedIp = dnsSrv.services.dnsRecords[dstIp.toLowerCase()];
      } else {
        const byName = state.nodes.find((n) => n.name.toLowerCase() === dstIp.toLowerCase());
        if (byName && byName.ip) resolvedIp = byName.ip;
        else return { ok: false, reason: isAr ? `فشل DNS: تعذر حل الاسم ${dstIp}` : `DNS failed: could not resolve ${dstIp}` };
      }
    }

    // Find target device or router interface owning resolvedIp
    const targetNode = state.nodes.find(
      (n) =>
        n.ip === resolvedIp ||
        Object.values(n.ports || {}).some((p) => p.ip === resolvedIp && p.adminUp !== false)
    );
    if (!targetNode) {
      return { ok: false, reason: isAr ? `لا يوجد جهاز يحمل العنوان ${resolvedIp}` : `No device owns IP ${resolvedIp}` };
    }

    // Build physical + Wi-Fi adjacency graph
    const adj = new Map();
    for (const n of state.nodes) adj.set(n.id, []);
    for (const l of state.links) {
      if (l.type === 'console' || l.type === 'aux') continue;
      const na = state.nodes.find((n) => n.id === l.a);
      const nb = state.nodes.find((n) => n.id === l.b);
      if (!na || !nb) continue;
      const pa = na.ports?.[l.portA];
      const pb = nb.ports?.[l.portB];
      if (pa && pa.adminUp === false) continue;
      if (pb && pb.adminUp === false) continue;
      adj.get(l.a)?.push(l.b);
      adj.get(l.b)?.push(l.a);
    }
    for (const wl of wifiLinks) {
      adj.get(wl.a)?.push(wl.b);
      adj.get(wl.b)?.push(wl.a);
    }

    // BFS path across physical/wireless topology
    const queue = [[srcNode.id]];
    const visited = new Set([srcNode.id]);
    let foundPath = null;
    while (queue.length > 0) {
      const path = queue.shift();
      const cur = path[path.length - 1];
      if (cur === targetNode.id) {
        foundPath = path;
        break;
      }
      for (const nxt of adj.get(cur) || []) {
        if (!visited.has(nxt)) {
          visited.add(nxt);
          queue.push([...path, nxt]);
        }
      }
    }

    if (!foundPath) {
      return {
        ok: false,
        reason: isAr
          ? `لا يوجد مسار فيزيائي/لاسلكي متصل بين ${srcNode.name} و ${targetNode.name} (تحقق من الكوابل وحالة المنافذ no shutdown).`
          : `No active physical/wireless path between ${srcNode.name} and ${targetNode.name}.`,
      };
    }

    // Check L3 subnet or gateway
    const srcIp =
      srcNode.ip ||
      Object.values(srcNode.ports || {}).find((p) => p.ip && p.adminUp !== false)?.ip ||
      '';
    if (!srcIp) {
      return { ok: false, reason: isAr ? `الجهاز ${srcNode.name} لا يملك عنوان IP.` : `${srcNode.name} has no IP address.` };
    }

    const mask = srcNode.mask || '255.255.255.0';
    const inSameSubnet = sameSubnet(srcIp, resolvedIp, mask);
    if (!inSameSubnet) {
      // Must have valid default gateway on srcNode or router in path
      const hasRouterInPath = foundPath.some((id) => state.nodes.find((n) => n.id === id)?.type === 'router');
      if (!srcNode.gw && srcNode.type !== 'router') {
        return {
          ok: false,
          reason: isAr
            ? `الهدف في شبكة فرعية مختلفة ولا توجد بوابة افتراضية (Default Gateway) مضبوطة على ${srcNode.name}.`
            : `Target is in a different subnet and no Default Gateway is configured on ${srcNode.name}.`,
        };
      }
      if (!hasRouterInPath) {
        return {
          ok: false,
          reason: isAr
            ? 'الهدف في شبكة أخرى ولا يمر المسار عبر راوتر (Layer 3).'
            : 'Target is in another subnet and path does not traverse a Router.',
        };
      }
    }

    return { ok: true, path: foundPath, resolvedIp, targetNode };
  };

  const animatePath = (nodeIds, color = '#10b981') => {
    if (!nodeIds || nodeIds.length < 2) return;
    const coords = nodeIds
      .map((id) => state.nodes.find((n) => n.id === id))
      .filter(Boolean);
    const anims = [];
    for (let i = 0; i < coords.length - 1; i++) {
      anims.push({
        id: `${Date.now()}-${i}`,
        x1: coords[i].x,
        y1: coords[i].y,
        x2: coords[i + 1].x,
        y2: coords[i + 1].y,
        color,
      });
    }
    setPackets(anims);
    setTimeout(() => setPackets([]), 1200);
  };

  const addDevice = (type) => {
    setState((prev) => {
      const id = prev.nextId;
      const col = (prev.nodes.length % 4) * 165 + 140;
      const row = Math.floor(prev.nodes.length / 4) * 130 + 130;
      const node = createDeviceNode(type, id, col, row);
      return { ...prev, nodes: [...prev.nodes, node], nextId: id + 1 };
    });
  };

  const pickFreePort = (node, cType) => {
    const usedPorts = new Set(
      state.links
        .filter((l) => l.a === node.id || l.b === node.id)
        .map((l) => (l.a === node.id ? l.portA : l.portB))
    );
    const entries = Object.entries(node.ports || {});
    if (cType === 'console') {
      const p = entries.find(([k, v]) => v.kind === 'console' && !usedPorts.has(k));
      return p ? p[0] : null;
    }
    if (cType === 'aux') {
      const p = entries.find(([k, v]) => v.kind === 'aux' && !usedPorts.has(k));
      return p ? p[0] : null;
    }
    const eth = entries.find(([k, v]) => v.kind === 'eth' && !usedPorts.has(k));
    if (eth) return eth[0];
    // Dynamically add another switch port if full
    if (node.type === 'switch') {
      const nextNum = entries.filter(([, v]) => v.kind === 'eth').length + 1;
      const newPort = `Fa0/${nextNum}`;
      node.ports[newPort] = { kind: 'eth', adminUp: true, vlan: 1, mode: 'access', mac: `001A.2B${node.id}.01${nextNum}` };
      return newPort;
    }
    return null;
  };

  const handleNodeClick = (node) => {
    if (activeTool === 'delete') {
      setState((prev) => ({
        ...prev,
        nodes: prev.nodes.filter((n) => n.id !== node.id),
        links: prev.links.filter((l) => l.a !== node.id && l.b !== node.id),
      }));
      if (selectedId === node.id) setSelectedId(null);
      setStatusMsg(isAr ? `تم حذف الجهاز ${node.name}.` : `Deleted device ${node.name}.`);
      return;
    }

    if (activeTool === 'cable') {
      if (!cableSource) {
        setCableSource(node);
        setStatusMsg(
          isAr
            ? `تم اختيار ${node.name} كطرف أول. اضغط على الجهاز الثاني لتوصيل الكابل (${cableType}).`
            : `Selected ${node.name}. Click target device to connect (${cableType}).`
        );
      } else if (cableSource.id === node.id) {
        setCableSource(null);
      } else {
        const portA = pickFreePort(cableSource, cableType);
        const portB = pickFreePort(node, cableType);
        if (!portA || !portB) {
          setStatusMsg(
            isAr
              ? `لا يوجد منفذ متاح من النوع المطلوب بين ${cableSource.name} و ${node.name}.`
              : `No available compatible port on ${cableSource.name} or ${node.name}.`
          );
          setCableSource(null);
          return;
        }
        const newLink = {
          id: `l-${Date.now()}`,
          a: cableSource.id,
          portA,
          b: node.id,
          portB,
          type: cableType,
        };
        setState((prev) => ({ ...prev, links: [...prev.links, newLink] }));
        setStatusMsg(
          isAr
            ? `تم توصيل ${cableSource.name} (${portA}) مع ${node.name} (${portB}) عبر كابل ${cableType}.`
            : `Connected ${cableSource.name} (${portA}) to ${node.name} (${portB}) via ${cableType}.`
        );
        setCableSource(null);
        setActiveTool('select');
      }
      return;
    }

    if (activeTool === 'ping') {
      if (!pingSource) {
        setPingSource(node);
        setStatusMsg(
          isAr
            ? `اختر الجهاز الهدف لإرسال حزمة Ping من ${node.name}...`
            : `Select destination device to ping from ${node.name}...`
        );
      } else {
        const targetIp =
          node.ip ||
          Object.values(node.ports || {}).find((p) => p.ip && p.adminUp !== false)?.ip ||
          '';
        const res = findPathAndCheckPing(pingSource, targetIp);
        if (res.ok) {
          animatePath(res.path, '#10b981');
          setStatusMsg(
            isAr
              ? `✅ نجح الاتصال (Ping) من ${pingSource.name} إلى ${node.name} (${targetIp}) — زمن الاستجابة < 1ms!`
              : `✅ Ping successful from ${pingSource.name} to ${node.name} (${targetIp}) — RTT < 1ms!`
          );
        } else {
          animatePath([pingSource.id, node.id], '#ef4444');
          setStatusMsg(`❌ ${res.reason}`);
        }
        setPingSource(null);
        setActiveTool('select');
      }
      return;
    }

    setSelectedId(node.id);
  };

  const requestDhcpForNode = (nodeId) => {
    const node = state.nodes.find((n) => n.id === nodeId);
    if (!node) return;
    // Find any reachable router or server with a DHCP pool
    const dhcpServers = state.nodes.filter(
      (n) => n.dhcpPools && Object.keys(n.dhcpPools).length > 0
    );
    let assigned = null;
    for (const srv of dhcpServers) {
      const pool = Object.values(srv.dhcpPools)[0];
      if (!pool) continue;
      const usedIps = new Set(state.nodes.map((n) => n.ip).filter(Boolean));
      const start = ipToInt(pool.startIp || '192.168.1.100');
      const end = ipToInt(pool.endIp || '192.168.1.150');
      for (let cur = start; cur <= end; cur++) {
        const candidate = intToIp(cur);
        if (!usedIps.has(candidate)) {
          assigned = {
            ip: candidate,
            mask: pool.mask || '255.255.255.0',
            gw: pool.defaultRouter || '192.168.1.1',
            dns: pool.dnsServer || '192.168.1.50',
            serverName: srv.name,
          };
          break;
        }
      }
      if (assigned) break;
    }

    if (assigned) {
      setState((prev) => ({
        ...prev,
        nodes: prev.nodes.map((n) =>
          n.id === nodeId
            ? {
                ...n,
                dhcp: true,
                ip: assigned.ip,
                mask: assigned.mask,
                gw: assigned.gw,
                dns: assigned.dns,
                cliHistory: [
                  ...n.cliHistory,
                  `DHCP DORA complete from ${assigned.serverName}: Assigned IP ${assigned.ip} / ${assigned.mask}, GW ${assigned.gw}, DNS ${assigned.dns}`,
                ],
              }
            : n
        ),
      }));
      setStatusMsg(
        isAr
          ? `✅ حصل ${node.name} على عنوان IP تلقائي من خادم DHCP (${assigned.ip})`
          : `✅ ${node.name} leased ${assigned.ip} via DHCP`
      );
    } else {
      setStatusMsg(
        isAr
          ? '⚠️ لم يتم العثور على خادم DHCP متاح في الشبكة.'
          : '⚠️ No active DHCP pool found on the network.'
      );
    }
  };

  const runCliCommand = (rawCmd) => {
    if (!selectedNode) return;
    const cmd = rawCmd.trim();
    if (!cmd) return;

    const appendLines = (lines, updater = (n) => n) => {
      setState((prev) => ({
        ...prev,
        nodes: prev.nodes.map((n) => {
          if (n.id !== selectedNode.id) return n;
          const updated = updater({ ...n, ports: { ...n.ports } });
          return {
            ...updated,
            cliHistory: [...updated.cliHistory, `${getPrompt(n)} ${cmd}`, ...lines],
          };
        }),
      }));
    };

    const low = cmd.toLowerCase();
    const parts = cmd.split(/\s+/);

    if (low === 'clear' || low === 'cls') {
      setState((prev) => ({
        ...prev,
        nodes: prev.nodes.map((n) => (n.id === selectedNode.id ? { ...n, cliHistory: [] } : n)),
      }));
      return;
    }

    // Cisco IOS CLI (Router / Switch)
    if (selectedNode.type === 'router' || selectedNode.type === 'switch') {
      if (low === 'help' || low === '?') {
        appendLines([
          'Available IOS Commands:',
          '  enable                        - Enter privileged EXEC mode',
          '  configure terminal (conf t)   - Enter global configuration mode',
          '  hostname <name>               - Set device hostname',
          '  interface <Gi0/0|Fa0/1>       - Select interface to configure',
          '  ip address <ip> <mask>        - Set interface IP address',
          '  no shutdown / shutdown        - Enable or disable interface',
          '  ip route <net> <mask> <nhop>  - Add static route',
          '  show ip interface brief       - Display interfaces status',
          '  show ip route                 - Display routing table',
          '  ping <ip/host>                - Send ICMP echo request',
          '  exit / end                    - Exit current mode',
        ]);
        return;
      }
      if (low === 'enable' || low === 'en') {
        appendLines([], (n) => ({ ...n, cliMode: 'priv' }));
        return;
      }
      if (low === 'configure terminal' || low === 'conf t') {
        appendLines(['Enter configuration commands, one per line. End with CNTL/Z.'], (n) => ({ ...n, cliMode: 'config', cliIf: null }));
        return;
      }
      if (low === 'exit') {
        appendLines([], (n) => ({
          ...n,
          cliMode: n.cliMode === 'if' ? 'config' : n.cliMode === 'config' ? 'priv' : 'user',
          cliIf: null,
        }));
        return;
      }
      if (low === 'end') {
        appendLines([], (n) => ({ ...n, cliMode: 'priv', cliIf: null }));
        return;
      }
      if (parts[0].toLowerCase() === 'hostname' && parts[1]) {
        appendLines([`Hostname updated to ${parts[1]}`], (n) => ({ ...n, hostname: parts[1], name: parts[1] }));
        return;
      }
      if ((parts[0].toLowerCase() === 'interface' || parts[0].toLowerCase() === 'int') && parts[1]) {
        const matchKey = Object.keys(selectedNode.ports).find(
          (k) => k.toLowerCase() === parts[1].toLowerCase()
        );
        if (!matchKey) {
          appendLines([`% Invalid interface "${parts[1]}". Available: ${Object.keys(selectedNode.ports).join(', ')}`]);
        } else {
          appendLines([], (n) => ({ ...n, cliMode: 'if', cliIf: matchKey }));
        }
        return;
      }
      if (low === 'no shutdown' || low === 'no shut') {
        if (selectedNode.cliIf) {
          const ifName = selectedNode.cliIf;
          appendLines([`%LINK-3-UPDOWN: Interface ${ifName}, changed state to up`], (n) => ({
            ...n,
            ports: { ...n.ports, [ifName]: { ...n.ports[ifName], adminUp: true } },
          }));
        } else {
          appendLines(['% Select an interface first using: interface Gi0/0']);
        }
        return;
      }
      if (low === 'shutdown' || low === 'shut') {
        if (selectedNode.cliIf) {
          const ifName = selectedNode.cliIf;
          appendLines([`%LINK-5-CHANGED: Interface ${ifName}, changed state to administratively down`], (n) => ({
            ...n,
            ports: { ...n.ports, [ifName]: { ...n.ports[ifName], adminUp: false } },
          }));
        } else {
          appendLines(['% Select an interface first.']);
        }
        return;
      }
      if (parts[0].toLowerCase() === 'ip' && parts[1]?.toLowerCase() === 'address' && parts[2] && parts[3]) {
        if (selectedNode.cliIf) {
          const ifName = selectedNode.cliIf;
          appendLines([`Configured ${ifName} with IP ${parts[2]} ${parts[3]}`], (n) => ({
            ...n,
            ports: { ...n.ports, [ifName]: { ...n.ports[ifName], ip: parts[2], mask: parts[3] } },
          }));
        } else {
          appendLines(['% Enter interface mode first (e.g. interface Gi0/0).']);
        }
        return;
      }
      if (parts[0].toLowerCase() === 'ip' && parts[1]?.toLowerCase() === 'route' && parts[2] && parts[3] && parts[4]) {
        appendLines([`Added static route: ${parts[2]} ${parts[3]} via ${parts[4]}`], (n) => ({
          ...n,
          routes: [...(n.routes || []), { dst: parts[2], mask: parts[3], nextHop: parts[4] }],
        }));
        return;
      }
      if (low.startsWith('show ip interface brief') || low === 'sh ip int br') {
        const rows = ['Interface       IP-Address      Status                Protocol'];
        for (const [k, v] of Object.entries(selectedNode.ports)) {
          rows.push(
            `${k.padEnd(15)} ${(v.ip || 'unassigned').padEnd(15)} ${(v.adminUp !== false ? 'up' : 'administratively down').padEnd(21)} ${v.adminUp !== false ? 'up' : 'down'}`
          );
        }
        appendLines(rows);
        return;
      }
      if (low.startsWith('show ip route') || low === 'sh ip route') {
        const rows = ['Codes: C - connected, S - static'];
        for (const [k, v] of Object.entries(selectedNode.ports)) {
          if (v.ip && v.adminUp !== false) {
            rows.push(`C    ${v.ip}/${v.mask || '255.255.255.0'} is directly connected, ${k}`);
          }
        }
        for (const r of selectedNode.routes || []) {
          rows.push(`S    ${r.dst} [${r.mask}] via ${r.nextHop}`);
        }
        appendLines(rows);
        return;
      }
      if (parts[0].toLowerCase() === 'ping' && parts[1]) {
        const res = findPathAndCheckPing(selectedNode, parts[1]);
        if (res.ok) {
          animatePath(res.path, '#10b981');
          appendLines([
            `Type escape sequence to abort.`,
            `Sending 5, 100-byte ICMP Echos to ${res.resolvedIp}, timeout is 2 seconds:`,
            `!!!!!`,
            `Success rate is 100 percent (5/5), round-trip min/avg/max = 1/1/2 ms`,
          ]);
        } else {
          appendLines([`Sending 5, 100-byte ICMP Echos to ${parts[1]}:`, `.....`, `Success rate is 0 percent (0/5) — ${res.reason}`]);
        }
        return;
      }
      appendLines([`% Unknown or incomplete IOS command: "${cmd}". Type "help" for commands.`]);
      return;
    }

    // Host OS Shell (PC, Laptop, Server, Phone, Printer)
    if (low === 'help' || low === '?') {
      appendLines([
        'Available Host Commands:',
        '  ipconfig                      - Show IP, Subnet Mask, Gateway, DNS & MAC',
        '  dhcp                          - Request dynamic IP lease via DHCP',
        '  ping <ip/hostname>            - Test network connectivity (ICMP)',
        '  nslookup <hostname>           - Resolve domain name via DNS server',
        '  curl <ip/hostname>            - Fetch HTTP web page from Server',
        '  store <filename>              - Upload file to network Server',
        '  print <document>              - Send print job to network Printer',
        '  clear                         - Clear terminal screen',
      ]);
      return;
    }
    if (low === 'ipconfig' || low === 'ifconfig') {
      const firstPort = Object.values(selectedNode.ports)[0] || {};
      appendLines([
        `Ethernet adapter Fa0/0:`,
        `   Physical Address. . . . . . : ${firstPort.mac || '001A.2B00.0100'}`,
        `   IPv4 Address. . . . . . . . : ${selectedNode.ip || '0.0.0.0'}`,
        `   Subnet Mask . . . . . . . . : ${selectedNode.mask || '255.255.255.0'}`,
        `   Default Gateway . . . . . . : ${selectedNode.gw || 'None'}`,
        `   DNS Server. . . . . . . . . : ${selectedNode.dns || 'None'}`,
      ]);
      return;
    }
    if (low === 'dhcp' || low === 'ipconfig /renew') {
      requestDhcpForNode(selectedNode.id);
      return;
    }
    if (parts[0].toLowerCase() === 'ping' && parts[1]) {
      const res = findPathAndCheckPing(selectedNode, parts[1]);
      if (res.ok) {
        animatePath(res.path, '#10b981');
        appendLines([
          `Pinging ${res.resolvedIp} with 32 bytes of data:`,
          `Reply from ${res.resolvedIp}: bytes=32 time<1ms TTL=64`,
          `Reply from ${res.resolvedIp}: bytes=32 time<1ms TTL=64`,
          `Ping statistics for ${res.resolvedIp}: Packets: Sent = 2, Received = 2, Lost = 0 (0% loss)`,
        ]);
      } else {
        appendLines([`Pinging ${parts[1]}:`, `Request timed out. (${res.reason})`]);
      }
      return;
    }
    if (parts[0].toLowerCase() === 'nslookup' && parts[1]) {
      const hostQuery = parts[1].toLowerCase();
      const srv = state.nodes.find((n) => n.type === 'server' && n.services?.dns);
      const addr = srv?.services?.dnsRecords?.[hostQuery];
      if (srv && addr) {
        appendLines([`Server:  ${srv.name} (${srv.ip})`, `Name:    ${hostQuery}`, `Address: ${addr}`]);
      } else {
        appendLines([`*** Can't find ${parts[1]}: Non-existent domain`]);
      }
      return;
    }
    if (parts[0].toLowerCase() === 'curl' && parts[1]) {
      const res = findPathAndCheckPing(selectedNode, parts[1]);
      if (res.ok && res.targetNode.type === 'server' && res.targetNode.services?.http) {
        animatePath(res.path, '#06b6d4');
        appendLines([
          `HTTP/1.1 200 OK`,
          `Server: ${res.targetNode.name} (${res.resolvedIp})`,
          `<html><body><h1>Welcome to ${res.targetNode.name} Intranet Portal</h1></body></html>`,
        ]);
      } else {
        appendLines([`curl: (7) Failed to connect to ${parts[1]}: ${res.reason || 'Not an HTTP server'}`]);
      }
      return;
    }
    if (parts[0].toLowerCase() === 'store' && parts[1]) {
      const srv = state.nodes.find((n) => n.type === 'server');
      if (!srv) {
        appendLines(['Error: No Server found on topology.']);
        return;
      }
      const res = findPathAndCheckPing(selectedNode, srv.ip);
      if (res.ok) {
        animatePath(res.path, '#14b8a6');
        appendLines([`Uploaded "${parts[1]}" to ${srv.name} (${srv.ip}) successfully.`]);
      } else {
        appendLines([`Failed to reach Server: ${res.reason}`]);
      }
      return;
    }
    if (parts[0].toLowerCase() === 'print' && parts[1]) {
      const prn = state.nodes.find((n) => n.type === 'printer');
      if (!prn) {
        appendLines(['Error: No Printer found on topology.']);
        return;
      }
      const res = findPathAndCheckPing(selectedNode, prn.ip);
      if (res.ok) {
        animatePath(res.path, '#f59e0b');
        appendLines([`Sent print job "${parts.slice(1).join(' ')}" to ${prn.name} (${prn.ip}) — Status: Printed OK.`]);
      } else {
        appendLines([`Printer unreachable: ${res.reason}`]);
      }
      return;
    }

    appendLines([`'${cmd}' is not recognized. Type "help" for available commands.`]);
  };

  const getPrompt = (node) => {
    if (!node) return '>';
    if (node.type === 'router' || node.type === 'switch') {
      const h = node.hostname || node.name;
      if (node.cliMode === 'if') return `${h}(config-if)#`;
      if (node.cliMode === 'config') return `${h}(config)#`;
      if (node.cliMode === 'priv') return `${h}#`;
      return `${h}>`;
    }
    return `C:\\${node.name}>`;
  };

  // Dragging devices on SVG canvas
  const onPointerDownNode = (e, node) => {
    e.stopPropagation();
    if (activeTool !== 'select') {
      handleNodeClick(node);
      return;
    }
    setSelectedId(node.id);
    const svg = svgRef.current;
    if (!svg) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const cursor = pt.matrixTransform(svg.getScreenCTM().inverse());
    dragRef.current = { id: node.id, offsetX: cursor.x - node.x, offsetY: cursor.y - node.y };
  };

  const onPointerMoveSvg = (e) => {
    if (!dragRef.current || !svgRef.current) return;
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const cursor = pt.matrixTransform(svg.getScreenCTM().inverse());
    const nx = Math.max(55, Math.min(795, Math.round(cursor.x - dragRef.current.offsetX)));
    const ny = Math.max(55, Math.min(445, Math.round(cursor.y - dragRef.current.offsetY)));
    const dragId = dragRef.current.id;
    setState((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === dragId ? { ...n, x: nx, y: ny } : n)),
    }));
  };

  const onPointerUpSvg = () => {
    dragRef.current = null;
  };

  const updateSelectedField = (field, val) => {
    if (!selectedNode) return;
    setState((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === selectedNode.id ? { ...n, [field]: val } : n)),
    }));
  };

  const toggleRouterPort = (portName) => {
    if (!selectedNode) return;
    setState((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => {
        if (n.id !== selectedNode.id) return n;
        const cur = n.ports[portName];
        return {
          ...n,
          ports: { ...n.ports, [portName]: { ...cur, adminUp: cur.adminUp === false } },
        };
      }),
    }));
  };

  const updateRouterPortIp = (portName, ipVal) => {
    if (!selectedNode) return;
    setState((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => {
        if (n.id !== selectedNode.id) return n;
        const cur = n.ports[portName];
        return {
          ...n,
          ports: { ...n.ports, [portName]: { ...cur, ip: ipVal } },
        };
      }),
    }));
  };

  return (
    <div className="content wide">
      <PageHead
        eyebrow={isAr ? 'مختبر الشبكات التفاعلي (NetSim v2)' : 'Interactive Network Lab (NetSim v2)'}
        title={isAr ? 'محاكي الشبكات — Packet Tracer Lite' : 'Network Simulator — Packet Tracer Lite'}
      >
        {isAr
          ? 'قم ببناء الشبكة، وتوصيل الكوابل (Straight / Cross / Fiber / Console)، وإعداد عناوين IPv4 وبروتوكول DHCP وDNS، وتنفيذ أوامر Cisco IOS واختبار Ping الحي.'
          : 'Build topologies, wire Straight/Cross/Fiber/Console cables, configure IPv4, DHCP, DNS, and run Cisco IOS & Host CLI commands with live Ping packets.'}
      </PageHead>

      <div className="stack lg">
        {/* Top Toolbar: Devices & Cables */}
        <div className="card tight stack">
          <div className="row between wrap" style={{ gap: 10 }}>
            <div className="row wrap" style={{ gap: 6 }}>
              <span className="small muted" style={{ fontWeight: 700 }}>
                {isAr ? 'إضافة جهاز:' : 'Add Device:'}
              </span>
              {DEVICE_TYPES.map((d) => (
                <button
                  key={d.type}
                  type="button"
                  className="btn sm"
                  onClick={() => addDevice(d.type)}
                  title={isAr ? d.labelAr : d.labelEn}
                >
                  <span>{d.icon}</span>
                  <span>{isAr ? d.labelAr : d.labelEn}</span>
                </button>
              ))}
            </div>

            <div className="row wrap" style={{ gap: 6 }}>
              <button
                type="button"
                className="btn sm primary"
                onClick={() => {
                  setState(buildDemoTopology());
                  setSelectedId(3);
                  setStatusMsg(isAr ? 'تم تحميل شبكة المدرسة النموذجية الجاهزة.' : 'Loaded Demo School Network Topology.');
                }}
              >
                <Icon name="rotate" size={15} />
                <span>{isAr ? 'تحميل شبكة نموذجية (Demo)' : 'Load Demo Topology'}</span>
              </button>
              <button
                type="button"
                className="btn sm ghost"
                onClick={() => {
                  setState({ nodes: [], links: [], nextId: 1 });
                  setSelectedId(null);
                  setStatusMsg(isAr ? 'تم مسح مساحة العمل.' : 'Workspace cleared.');
                }}
              >
                {isAr ? 'مسح الكل' : 'Clear All'}
              </button>
            </div>
          </div>

          <div className="row between wrap" style={{ gap: 10, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
            <div className="row wrap" style={{ gap: 6 }}>
              <span className="small muted" style={{ fontWeight: 700 }}>
                {isAr ? 'الأدوات:' : 'Tools:'}
              </span>
              <button
                type="button"
                className={`btn sm ${activeTool === 'select' ? 'primary' : ''}`}
                onClick={() => { setActiveTool('select'); setCableSource(null); setPingSource(null); }}
              >
                🖱️ {isAr ? 'تحديد / تحريك' : 'Select / Move'}
              </button>
              <button
                type="button"
                className={`btn sm ${activeTool === 'ping' ? 'primary' : ''}`}
                onClick={() => { setActiveTool('ping'); setPingSource(null); setCableSource(null); }}
              >
                📡 {isAr ? 'فحص اتصال (Ping)' : 'Ping Packet'}
              </button>
              <button
                type="button"
                className={`btn sm ${activeTool === 'delete' ? 'primary' : ''}`}
                onClick={() => { setActiveTool('delete'); setCableSource(null); setPingSource(null); }}
              >
                🗑️ {isAr ? 'حذف جهاز' : 'Delete'}
              </button>
            </div>

            <div className="row wrap" style={{ gap: 6 }}>
              <span className="small muted" style={{ fontWeight: 700 }}>
                {isAr ? 'توصيل كابل:' : 'Connect Cable:'}
              </span>
              {CABLE_TYPES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`btn sm ${activeTool === 'cable' && cableType === c.id ? 'primary' : ''}`}
                  onClick={() => {
                    setActiveTool('cable');
                    setCableType(c.id);
                    setCableSource(null);
                  }}
                >
                  <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: c.color }} />
                  <span>{isAr ? c.labelAr : c.labelEn}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Status Banner */}
        <div className="card tight" style={{ background: 'var(--surface-2)', borderInlineStart: '4px solid var(--accent)' }}>
          <div className="row between wrap" style={{ gap: 8 }}>
            <span style={{ fontWeight: 600 }}>{statusMsg}</span>
            <div className="row" style={{ gap: 6 }}>
              <Chip>{isAr ? `الأجهزة: ${state.nodes.length}` : `Devices: ${state.nodes.length}`}</Chip>
              <Chip tone="accent">{isAr ? `الكوابل: ${state.links.length}` : `Links: ${state.links.length}`}</Chip>
            </div>
          </div>
        </div>

        {/* Main Workspace Grid: Canvas + Inspector/CLI */}
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16, alignItems: 'start' }}>
          {/* SVG Interactive Topology Canvas */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <svg
              ref={svgRef}
              viewBox="0 0 850 490"
              style={{ width: '100%', height: 'auto', minHeight: 420, display: 'block', background: 'radial-gradient(circle at center, rgba(59,130,246,0.07), transparent 70%)', cursor: activeTool === 'select' ? 'grab' : 'crosshair', userSelect: 'none' }}
              onPointerMove={onPointerMoveSvg}
              onPointerUp={onPointerUpSvg}
              onPointerLeave={onPointerUpSvg}
            >
              <defs>
                <pattern id="lab-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="currentColor" strokeOpacity="0.07" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="850" height="490" fill="url(#lab-grid)" />

              {/* Wireless Wi-Fi Links */}
              {wifiLinks.map((wl) => {
                const na = state.nodes.find((n) => n.id === wl.a);
                const nb = state.nodes.find((n) => n.id === wl.b);
                if (!na || !nb) return null;
                return (
                  <g key={wl.id}>
                    <line
                      x1={na.x}
                      y1={na.y}
                      x2={nb.x}
                      y2={nb.y}
                      stroke="#8b5cf6"
                      strokeWidth="2"
                      strokeDasharray="4,6"
                      strokeOpacity="0.7"
                    />
                    <text
                      x={(na.x + nb.x) / 2}
                      y={(na.y + nb.y) / 2 - 6}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#8b5cf6"
                    >
                      Wi-Fi ({na.wifiSsid})
                    </text>
                  </g>
                );
              })}

              {/* Physical Cable Links */}
              {state.links.map((lk) => {
                const na = state.nodes.find((n) => n.id === lk.a);
                const nb = state.nodes.find((n) => n.id === lk.b);
                if (!na || !nb) return null;
                const cInfo = CABLE_TYPES.find((c) => c.id === lk.type) || CABLE_TYPES[0];
                const paUp = na.ports?.[lk.portA]?.adminUp !== false;
                const pbUp = nb.ports?.[lk.portB]?.adminUp !== false;
                const linkUp = paUp && pbUp;
                return (
                  <g key={lk.id}>
                    <line
                      x1={na.x}
                      y1={na.y}
                      x2={nb.x}
                      y2={nb.y}
                      stroke={linkUp ? cInfo.color : '#ef4444'}
                      strokeWidth="3"
                      strokeDasharray={cInfo.dash}
                    />
                    {/* Port Status LEDs */}
                    <circle
                      cx={na.x + (nb.x - na.x) * 0.22}
                      cy={na.y + (nb.y - na.y) * 0.22}
                      r="4.5"
                      fill={linkUp ? '#10b981' : '#ef4444'}
                    />
                    <circle
                      cx={na.x + (nb.x - na.x) * 0.78}
                      cy={na.y + (nb.y - na.y) * 0.78}
                      r="4.5"
                      fill={linkUp ? '#10b981' : '#ef4444'}
                    />
                    <text
                      x={na.x + (nb.x - na.x) * 0.27}
                      y={na.y + (nb.y - na.y) * 0.27 - 6}
                      fontSize="9.5"
                      fill="currentColor"
                      opacity="0.75"
                    >
                      {lk.portA}
                    </text>
                    <text
                      x={na.x + (nb.x - na.x) * 0.73}
                      y={na.y + (nb.y - na.y) * 0.73 - 6}
                      fontSize="9.5"
                      fill="currentColor"
                      opacity="0.75"
                    >
                      {lk.portB}
                    </text>
                  </g>
                );
              })}

              {/* Animated Ping / Traffic Packets */}
              {packets.map((pk) => (
                <circle key={pk.id} r="8" fill={pk.color}>
                  <animate attributeName="cx" from={pk.x1} to={pk.x2} dur="0.55s" fill="freeze" />
                  <animate attributeName="cy" from={pk.y1} to={pk.y2} dur="0.55s" fill="freeze" />
                </circle>
              ))}

              {/* Devices */}
              {state.nodes.map((node) => {
                const meta = DEVICE_TYPES.find((d) => d.type === node.type) || DEVICE_TYPES[0];
                const isSel = selectedId === node.id || cableSource?.id === node.id || pingSource?.id === node.id;
                const displayIp =
                  node.ip ||
                  Object.values(node.ports || {}).find((p) => p.ip)?.ip ||
                  '';
                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    onPointerDown={(e) => onPointerDownNode(e, node)}
                    style={{ cursor: 'pointer' }}
                  >
                    {isSel && (
                      <circle
                        r="34"
                        fill="none"
                        stroke={meta.color}
                        strokeWidth="2.5"
                        strokeDasharray="5,3"
                      />
                    )}
                    <rect
                      x="-26"
                      y="-26"
                      width="52"
                      height="52"
                      rx="14"
                      fill="var(--surface, #1e293b)"
                      stroke={meta.color}
                      strokeWidth={isSel ? '3' : '2'}
                    />
                    <text x="0" y="7" textAnchor="middle" fontSize="24">
                      {meta.icon}
                    </text>
                    <text
                      x="0"
                      y="40"
                      textAnchor="middle"
                      fontSize="12"
                      fontWeight="700"
                      fill="currentColor"
                    >
                      {node.name}
                    </text>
                    {displayIp && (
                      <text
                        x="0"
                        y="54"
                        textAnchor="middle"
                        fontSize="10.5"
                        fill="currentColor"
                        opacity="0.72"
                        dir="ltr"
                      >
                        {displayIp}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Device Configuration & CLI Terminal Panel */}
          <div className="stack">
            {selectedNode ? (
              <>
                <div className="card stack">
                  <div className="row between wrap">
                    <div className="row" style={{ gap: 8 }}>
                      <span style={{ fontSize: 24 }}>
                        {DEVICE_TYPES.find((d) => d.type === selectedNode.type)?.icon}
                      </span>
                      <div>
                        <h3 style={{ margin: 0 }}>{selectedNode.name}</h3>
                        <span className="small muted">{selectedNode.type.toUpperCase()}</span>
                      </div>
                    </div>
                    {['pc', 'laptop', 'phone', 'printer'].includes(selectedNode.type) && (
                      <button
                        type="button"
                        className="btn sm primary"
                        onClick={() => requestDhcpForNode(selectedNode.id)}
                      >
                        ⚡ {isAr ? 'طلب عنوان تلقائي (DHCP)' : 'Request DHCP Lease'}
                      </button>
                    )}
                  </div>

                  {/* Host IP Configuration */}
                  {selectedNode.type !== 'router' && (
                    <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <label className="stack" style={{ gap: 4 }}>
                        <span className="small muted">IPv4 Address</span>
                        <input
                          className="input"
                          dir="ltr"
                          value={selectedNode.ip || ''}
                          onChange={(e) => updateSelectedField('ip', e.target.value)}
                          placeholder="192.168.1.10"
                        />
                      </label>
                      <label className="stack" style={{ gap: 4 }}>
                        <span className="small muted">Subnet Mask</span>
                        <input
                          className="input"
                          dir="ltr"
                          value={selectedNode.mask || ''}
                          onChange={(e) => updateSelectedField('mask', e.target.value)}
                          placeholder="255.255.255.0"
                        />
                      </label>
                      <label className="stack" style={{ gap: 4 }}>
                        <span className="small muted">Default Gateway</span>
                        <input
                          className="input"
                          dir="ltr"
                          value={selectedNode.gw || ''}
                          onChange={(e) => updateSelectedField('gw', e.target.value)}
                          placeholder="192.168.1.1"
                        />
                      </label>
                      <label className="stack" style={{ gap: 4 }}>
                        <span className="small muted">DNS Server</span>
                        <input
                          className="input"
                          dir="ltr"
                          value={selectedNode.dns || ''}
                          onChange={(e) => updateSelectedField('dns', e.target.value)}
                          placeholder="192.168.1.50"
                        />
                      </label>
                    </div>
                  )}

                  {/* Wi-Fi SSID Config for AP / Laptop / Phone */}
                  {['ap', 'laptop', 'phone'].includes(selectedNode.type) && (
                    <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <label className="stack" style={{ gap: 4 }}>
                        <span className="small muted">Wi-Fi SSID</span>
                        <input
                          className="input"
                          dir="ltr"
                          value={selectedNode.wifiSsid || ''}
                          onChange={(e) => updateSelectedField('wifiSsid', e.target.value)}
                        />
                      </label>
                      <label className="stack" style={{ gap: 4 }}>
                        <span className="small muted">WPA2 Key</span>
                        <input
                          className="input"
                          dir="ltr"
                          value={selectedNode.wifiKey || ''}
                          onChange={(e) => updateSelectedField('wifiKey', e.target.value)}
                        />
                      </label>
                    </div>
                  )}

                  {/* Router Interface Table */}
                  {selectedNode.type === 'router' && (
                    <div className="stack" style={{ gap: 8 }}>
                      <b className="small">{isAr ? 'منافذ الراوتر (Interfaces):' : 'Router Interfaces:'}</b>
                      {Object.entries(selectedNode.ports)
                        .filter(([, v]) => v.kind === 'eth')
                        .map(([pName, pVal]) => (
                          <div key={pName} className="row between wrap" style={{ gap: 8 }}>
                            <span className="chip" dir="ltr">{pName}</span>
                            <input
                              className="input"
                              dir="ltr"
                              style={{ maxWidth: 160 }}
                              value={pVal.ip || ''}
                              onChange={(e) => updateRouterPortIp(pName, e.target.value)}
                              placeholder="192.168.1.1"
                            />
                            <button
                              type="button"
                              className={`btn sm ${pVal.adminUp !== false ? 'primary' : ''}`}
                              onClick={() => toggleRouterPort(pName)}
                            >
                              {pVal.adminUp !== false ? 'UP (no shut)' : 'DOWN (shut)'}
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Interactive CLI Terminal */}
                <div className="card stack" style={{ background: '#0f172a', color: '#e2e8f0', borderColor: '#334155' }}>
                  <div className="row between">
                    <b style={{ color: '#38bdf8', fontFamily: 'monospace' }}>
                      {selectedNode.type === 'router' || selectedNode.type === 'switch'
                        ? `Cisco IOS CLI — ${selectedNode.name}`
                        : `Terminal — ${selectedNode.name}`}
                    </b>
                    <span className="small" style={{ color: '#94a3b8' }} dir="ltr">
                      {getPrompt(selectedNode)}
                    </span>
                  </div>

                  <div
                    dir="ltr"
                    style={{
                      fontFamily: 'monospace',
                      fontSize: 12.5,
                      lineHeight: 1.55,
                      maxHeight: 220,
                      overflowY: 'auto',
                      padding: 10,
                      background: '#020617',
                      borderRadius: 8,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {(selectedNode.cliHistory || []).map((line, idx) => (
                      <div key={idx}>{line}</div>
                    ))}
                    <div ref={cliEndRef} />
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      runCliCommand(cliInput);
                      setCliInput('');
                    }}
                    className="row"
                    dir="ltr"
                    style={{ gap: 8 }}
                  >
                    <input
                      className="input"
                      dir="ltr"
                      style={{ fontFamily: 'monospace', background: '#1e293b', color: '#f8fafc', borderColor: '#475569' }}
                      value={cliInput}
                      onChange={(e) => setCliInput(e.target.value)}
                      placeholder={
                        selectedNode.type === 'router' || selectedNode.type === 'switch'
                          ? 'enable | conf t | int Gi0/0 | no shut | sh ip int br | ping 192.168.1.10'
                          : 'ipconfig | dhcp | ping 192.168.1.1 | nslookup intranet.local | curl 192.168.1.50'
                      }
                    />
                    <button type="submit" className="btn sm primary">
                      Run
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="card center" style={{ padding: 32 }}>
                <p className="muted">
                  {isAr ? 'اضغط على أي جهاز في الشبكة لعرض إعداداته وطرفية الأوامر CLI.' : 'Click any device on the canvas to inspect and open its CLI.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
