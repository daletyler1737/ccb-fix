#!/usr/bin/env node
// ccb fix-gateway - OpenClaw one-click fix + Chinese localization

const { readFileSync, writeFileSync, existsSync, mkdirSync, cpSync, rmSync } = require('fs')
const { execSync } = require('child_process')
const { homedir } = require('os')

const HOME = homedir()
const WORKSPACE = '/vol1/@apphome/trim.openclaw/data/home/.openclaw/workspace-taizi'
const OPENCLAW_JSON = HOME + '/.openclaw/openclaw.json'
const BACKUP_DIR = HOME + '/.openclaw/backups'
const SKILLS_DIR = WORKSPACE + '/skills'
const LANG_FILE = HOME + '/.openclaw/fix-gateway-lang.json'

const C = { r:'\x1b[31m', g:'\x1b[32m', y:'\x1b[33m', b:'\x1b[34m', c:'\x1b[36m', w:'\x1b[37m', R:'\x1b[0m', B:'\x1b[1m' }
let LANG = 'zh'

const T = {
  zh: {
    title: 'OpenClaw 一键修复',
    m: {1:'基础诊断',2:'重启Gateway',3:'修复飞书',4:'屏蔽Skills',5:'API问题排查',6:'升级/降级',7:'完整恢复',8:'紧急模式',9:'OpenClaw汉化',0:'退出',L:'切换语言'},
    en: {1:'Diagnostics',2:'Restart',3:'Fix Feishu',4:'Block Skills',5:'API Check',6:'Upgrade/Downgrade',7:'Full Recovery',8:'Emergency',9:'OpenClaw CN',0:'Exit',L:'Switch Lang'},
    diag: {t:'基础诊断',run:'Gateway运行中 (PID {p})',down:'Gateway未运行',portOk:'30988端口正常',portDown:'30988未监听',feishuOn:'飞书插件已启用',feishuOff:'飞书插件已禁用',apiOk:'API Key: {n}个已配置',apiErr:'API Key配置异常',apiMiss:'API Key配置文件不存在',ccb:'ccb-skills: {n}个',err:'最近错误'},
    ver: {t:'升级/降级OpenClaw',cur:'当前版本',sel:'选择版本',sReg:'选择安装源',intl:'国际源',cn:'中国源',done:'安装完成'},
    restart: {t:'重启Gateway',done:'Gateway重启完成',desc:'重启Gateway服务'},
    feishu: {t:'修复飞书',done:'飞书修复完成'},
    blk: {t:'屏蔽Skills',a:'屏蔽所有ccb-skills',b:'屏蔽指定skill',c:'恢复已屏蔽的skills',sel:'选择(a/b/c)',no:'无ccb-skills'},
    api: {t:'API问题排查',ok:'已配置',miss:'配置文件不存在',done:'已复制'},
    full: {t:'完整恢复',desc:'备份+屏蔽ccb+修复飞书+重启'},
    em: {t:'紧急模式',desc:'最高优先级'},
    s: {c:'确认执行?',y:'已取消'},
    cn: {t:'OpenClaw终端汉化',desc:'翻译openclaw命令输出'},
  },
  en: {
    title: 'OpenClaw Fix Tool',
    m: {1:'Diagnostics',2:'Restart',3:'Fix Feishu',4:'Block Skills',5:'API Check',6:'Upgrade/Downgrade',7:'Full Recovery',8:'Emergency',9:'OpenClaw CN',0:'Exit',L:'Switch Lang'},
    diag: {t:'Diagnostics',run:'Gateway running (PID {p})',down:'Not running',portOk:'30988 OK',portDown:'30988 down',feishuOn:'Feishu enabled',feishuOff:'Feishu disabled',apiOk:'API Key: {n} configured',apiErr:'API Key error',apiMiss:'API Key missing',ccb:'ccb-skills: {n}',err:'Recent errors'},
    ver: {t:'Upgrade/Downgrade',cur:'Current version',sel:'Select version',sReg:'Select registry',intl:'International',cn:'China',done:'Done'},
    restart: {t:'Restart Gateway',done:'Restarted',desc:'Restart Gateway service'},
    feishu: {t:'Fix Feishu',done:'Feishu fixed'},
    blk: {t:'Block Skills',a:'Block all ccb-skills',b:'Block specific skill',c:'Restore blocked skills',sel:'Choice (a/b/c)',no:'No ccb-skills'},
    api: {t:'API Check',ok:'Configured',miss:'Missing',done:'Copied'},
    full: {t:'Full Recovery',desc:'Backup+block ccb+fix Feishu+restart'},
    em: {t:'Emergency Mode',desc:'Priority restore'},
    s: {c:'Confirm?',y:'Cancelled'},
    cn: {t:'OpenClaw CN',desc:'Translate openclaw output'},
  }
}

const _ = (cat, key, v) => {
  let s = (T[LANG][cat] && T[LANG][cat][key]) ? T[LANG][cat][key] : key
  if (v) Object.keys(v).forEach(k => s = s.replace('{'+k+'}', v[k]))
  return s
}
const ln = (s, c) => console.log('  '+(C[c]||C.w)+s+C.R)
const info = s => ln('[i] '+s, 'c')
const warn = s => ln('[!] '+s, 'y')
const error = s => ln('[X] '+s, 'r')
const ok = s => ln('[OK] '+s, 'g')
const hr = t => console.log('\n'+C.B+'== '+t+' =='+C.R+'\n')

const run = c => { try { return execSync(c,{encoding:'utf-8',stdio:'pipe'}).trim() } catch(e) { return e.stderr?e.stderr.toString().trim():'' } }
const cfg = () => { try { return JSON.parse(readFileSync(OPENCLAW_JSON,'utf-8')) } catch { return null } }
const saveCfg = c => writeFileSync(OPENCLAW_JSON, JSON.stringify(c,null,2))
const killGw = () => { run('pkill -f openclaw-gateway 2>/dev/null||true'); run('killall openclaw-gateway 2>/dev/null||true') }
const startGw = () => { execSync('nohup openclaw gateway>/tmp/gw_fix.log 2>&1 &',{stdio:'pipe'}); return run('pgrep -f openclaw-gateway').split('\n')[0] }
const backup = n => { const d=BACKUP_DIR+'/'+n+'_'+Date.now(); mkdirSync(d,{recursive:true}); return d }
const sleep = ms => new Promise(r => setTimeout(r,ms))

function loadLang() { try { if (existsSync(LANG_FILE)) { const d=JSON.parse(readFileSync(LANG_FILE,'utf-8')); if (d.lang) LANG=d.lang; } } catch(e) {} }
function saveLang() { try { mkdirSync(HOME+'/.openclaw',{recursive:true}); writeFileSync(LANG_FILE,JSON.stringify({lang:LANG})); } catch(e) {} }
function toggleLang() { LANG=LANG==='zh'?'en':'zh'; saveLang(); ok(LANG==='zh'?'已切换到中文':'Switched to English') }

function prompt(q) {
  return new Promise(r => {
    const rl = require('readline').createInterface({input:process.stdin,output:process.stdout})
    rl.question('  '+C.c+q+C.R+'  '+C.g+'y'+C.R+'/'+C.y+'n'+C.R+': ', a => { rl.close(); r(a.toLowerCase()==='y'?'confirm':'cancel') })
  })
}
function askNum(max, q, allowL) {
  return new Promise(r => {
    const rl = require('readline').createInterface({input:process.stdin,output:process.stdout})
    rl.question('  '+C.c+q+C.R+' ('+C.c+'1-'+max+(allowL?'/L':'')+C.R+'): ', a => { rl.close(); const l=a.toLowerCase(); if(allowL&&(l==='l'||l==='L')){toggleLang();r(-1)} const n=parseInt(a); r(isNaN(n)?0:n) })
  })
}
function askStr(q) {
  return new Promise(r => {
    const rl = require('readline').createInterface({input:process.stdin,output:process.stdout})
    rl.question('  '+C.c+q+C.R+': ', a => { rl.close(); r(a.toLowerCase()) })
  })
}

async function diag() {
  hr(_('diag','t'))
  const pid = run('pgrep -f openclaw-gateway').split('\n')[0]
  if (pid) ok(_('diag','run',{p:pid})); else error(_('diag','down'))
  const port = run('ss -tlnp 2>/dev/null|grep 30988||netstat -tlnp 2>/dev/null|grep 30988')
  if (port) ok(_('diag','portOk')); else error(_('diag','portDown'))
  const c = cfg()
  const feishuOn = c && c.plugins && c.plugins.entries && c.plugins.entries.feishu && c.plugins.entries.feishu.enabled !== false
  if (feishuOn) ok(_('diag','feishuOn')); else warn(_('diag','feishuOff'))
  const authF = HOME+'/.openclaw/agents/taizi/agent/auth-profiles.json'
  if (existsSync(authF)) { try { const a=JSON.parse(readFileSync(authF,'utf-8')); ok(_('diag','apiOk',{n:Object.keys(a.profiles||{}).length})) } catch { warn(_('diag','apiErr')) } } else error(_('diag','apiMiss'))
  const ccb = run('ls '+SKILLS_DIR+' 2>/dev/null|grep "^ccb-"|wc -l').trim()
  if (ccb>0) warn(_('diag','ccb',{n:ccb}))
  const err = run('tail -30 /tmp/openclaw-0/openclaw-$(date +%Y-%m-%d).log 2>/dev/null|grep -i "error\\|failed"|tail -3')
  if (err) { warn(_('diag','err')); err.split('\n').forEach(l=>ln('  '+l.slice(0,100),'y')) }
}

async function restart() {
  hr(_('restart','t'))
  const cr = await prompt(_('s','c'))
  if (cr!=='confirm') return
  killGw(); await sleep(2000)
  const pid = startGw(); await sleep(3000)
  ok((LANG==='zh'?'Gateway重启完成':'Restarted')+' (PID '+pid+')')
}

async function fixFeishu() {
  hr(_('feishu','t'))
  const cr = await prompt(_('s','c'))
  if (cr!=='confirm') return
  info(LANG==='zh'?'检查依赖...':'Checking deps...')
  const deps = ['@larksuiteoapi/node-sdk','grammy','@grammyjs/runner']
  for (const d of deps) {
    const found = run('find /vol1/@appcenter -name "'+d+'" -type d 2>/dev/null|head -1')
    if (!found) { warn((LANG==='zh'?'缺失':'Missing')+': '+d); run('cd /vol1/@appcenter/nodejs_v22/lib/node_modules/openclaw && npm install '+d+' 2>&1|tail -1') }
    else info(d+': OK')
  }
  const c = cfg()
  if (c) { c.plugins=c.plugins||{}; c.plugins.entries=c.plugins.entries||{}; c.plugins.entries.feishu={enabled:true,config:{}}; saveCfg(c); ok(LANG==='zh'?'配置已修复':'Config fixed') }
  killGw(); await sleep(2000)
  const pid = startGw(); await sleep(3000)
  ok((LANG==='zh'?'Gateway重启完成':'Restarted')+' (PID '+pid+')')
}

async function blockSkills() {
  hr(_('blk','t'))
  console.log('  '+C.c+'a)'+C.R+' '+_('blk','a'))
  console.log('  '+C.c+'b)'+C.R+' '+_('blk','b'))
  console.log('  '+C.c+'c)'+C.R+' '+_('blk','c'))
  const ans = await askStr(_('blk','sel'))
  if (ans==='a') return await blockAll()
  if (ans==='b') return await blockOne()
  if (ans==='c') return await restoreAll()
}

async function blockAll() {
  const cr = await prompt(_('s','c'))
  if (cr!=='confirm') return
  const bp = backup('ccb-skills')
  const ccb = run('ls '+SKILLS_DIR+' 2>/dev/null|grep "^ccb-"').split('\n').filter(Boolean)
  if (!ccb.length) { info(_('blk','no')); return }
  mkdirSync(bp+'/skills',{recursive:true})
  for (const s of ccb) { cpSync(SKILLS_DIR+'/'+s, bp+'/skills/'+s, {recursive:true}); rmSync(SKILLS_DIR+'/'+s, {recursive:true,force:true}); info((LANG==='zh'?'移除':'Removed')+': '+s) }
  ok((LANG==='zh'?'已移走到':'Moved to')+': '+bp)
  await doRestart()
}

async function blockOne() {
  const all = run('ls '+SKILLS_DIR+' 2>/dev/null').split('\n').filter(Boolean)
  console.log('\n  '+(LANG==='zh'?'可用Skills':'Available')+':')
  all.forEach((s,i) => console.log('    '+(i+1)+'. '+s))
  const n = await askNum(all.length, '')
  const skill = n>=1&&n<=all.length ? all[n-1] : ''
  if (!skill) return
  const bp = backup('skill_'+skill)
  cpSync(SKILLS_DIR+'/'+skill, bp+'/'+skill, {recursive:true})
  rmSync(SKILLS_DIR+'/'+skill, {recursive:true,force:true})
  ok((LANG==='zh'?'屏蔽':'Blocked')+': '+skill)
  await doRestart()
}

async function restoreAll() {
  const backups = run('ls '+BACKUP_DIR+' 2>/dev/null|grep "^ccb-\\|^skill_"').split('\n').filter(Boolean)
  if (!backups.length) { info(LANG==='zh'?'无备份可恢复':'No backups'); return }
  const cr = await prompt(_('s','c'))
  if (cr!=='confirm') return
  for (const b of backups) {
    const src=BACKUP_DIR+'/'+b; const name=b.replace(/_\d+$/,'')
    if (existsSync(src)) { cpSync(src, SKILLS_DIR+'/'+name, {recursive:true}); ok((LANG==='zh'?'恢复':'Restored')+': '+name) }
  }
  await doRestart()
}

async function doRestart() {
  killGw(); await sleep(2000)
  const pid = startGw(); info((LANG==='zh'?'Gateway重启':'Restarted')+' (PID '+pid+')')
}

async function checkApi() {
  hr(_('api','t'))
  const authF = HOME+'/.openclaw/agents/taizi/agent/auth-profiles.json'
  if (!existsSync(authF)) {
    error(_('api','miss'))
    const bak = run('find '+HOME+'/.openclaw -name "auth-profiles.json.bak" 2>/dev/null|head -1')
    if (bak) { info('Backup: '+bak); const cr=await prompt('Restore?'); if (cr==='confirm') { cpSync(bak,authF); ok(_('api','done')) } }
    return
  }
  try {
    const a = JSON.parse(readFileSync(authF,'utf-8'))
    for (const [n,p] of Object.entries(a.profiles||{})) {
      const exp = p.expires?new Date(p.expires).toLocaleString():(LANG==='zh'?'永不过期':'Never')
      ln(n+': '+(p.type==='oauth'?'OAuth':'API Key')+' ('+exp+')','g')
    }
    const cr = await prompt(LANG==='zh'?'复制其他agent认证?':'Copy other agent auth?')
    if (cr!=='confirm') return
    const others = run('find '+HOME+'/.openclaw/agents -name "auth-profiles.json" -not -path "*taizi/agent*" 2>/dev/null').split('\n').filter(Boolean)
    if (others.length) { others.forEach(f=>info(f)); const cr2=await prompt('Copy?'); if (cr2==='confirm') { cpSync(others[0],authF); ok(_('api','done')) } }
  } catch(e) {
    error('Error: '+e.message)
    const bak = run('find '+HOME+'/.openclaw -name "auth-profiles.json.bak" 2>/dev/null|head -1')
    if (bak) { info('Backup: '+bak); const cr=await prompt('Restore?'); if (cr==='confirm') { cpSync(bak,authF); ok(_('api','done')) } }
  }
}

const VERS = [
  {v:'2026.3.13',l:'3.13',nz:'老稳定版',ne:'Old stable'},
  {v:'2026.3.24',l:'3.24',nz:'较稳定',ne:'Stable'},
  {v:'2026.3.28',l:'3.28',nz:'稳定',ne:'More stable'},
  {v:'2026.3.31',l:'3.31',nz:'最新稳定',ne:'Latest stable'},
]
const REGS = [
  {nz:'国际源(npmjs.org)',ne:'International',u:'https://registry.npmjs.org'},
  {nz:'中国源(npmmirror)',ne:'China',u:'https://registry.npmmirror.com'},
]

async function version() {
  hr(_('ver','t'))
  const cur = run('openclaw --version 2>/dev/null')
  ln(_('ver','cur')+': '+cur,'y')
  console.log('\n  '+_('ver','sel')+':\n')
  VERS.forEach((v,i) => { const note=LANG==='zh'?v.nz:v.ne; const mark=cur.includes(v.v)?' <=' :''; console.log('    '+(i+1)+'. 2026.'+v.l+' ('+note+')'+mark) })
  const n1 = await askNum(4, '')
  if (n1<1||n1>4) return
  const selV=VERS[n1-1]
  console.log('\n  '+_('ver','sReg')+':\n')
  REGS.forEach((r,i) => { const n=LANG==='zh'?r.nz:r.ne; console.log('    '+(i+1)+'. '+n+' ('+r.u+')') })
  const n2 = await askNum(2, '')
  if (n2<1||n2>2) return
  const selR=REGS[n2-1]
  const regName=LANG==='zh'?selR.nz:selR.ne
  ln((LANG==='zh'?'将安装':'Installing')+': openclaw@'+selV.v+' ('+regName+')','y')
  const cr = await prompt(_('s','c'))
  if (cr!=='confirm') return
  killGw()
  run('rm -rf /vol1/@appcenter/nodejs_v22/lib/node_modules/.openclaw-* 2>/dev/null||true')
  info((LANG==='zh'?'安装中':'Installing')+': npm install...')
  const r = run('npm install -g openclaw@'+selV.v+' --registry '+selR.u+' 2>&1|tail -3')
  info(r)
  const newVer = run('openclaw --version 2>/dev/null')
  ok(_('ver','done')+': '+newVer)
  await sleep(2000)
  const pid = startGw(); info((LANG==='zh'?'Gateway重启':'Restarted')+' (PID '+pid+')')
}

async function full() {
  hr(_('full','t'))
  info(_('full','desc'))
  const cr = await prompt(_('s','c'))
  if (cr!=='confirm') return
  info('[1/4] '+(LANG==='zh'?'备份':'Backup')+'...')
  const bp = backup('full_recovery'); cpSync(OPENCLAW_JSON, bp+'/openclaw.json')
  ok((LANG==='zh'?'已备份':'Backed up')+': '+bp)
  info('[2/4] '+(LANG==='zh'?'屏蔽ccb':'Blocking ccb')+'...')
  const ccb = run('ls '+SKILLS_DIR+' 2>/dev/null|grep "^ccb-"').split('\n').filter(Boolean)
  mkdirSync(bp+'/skills',{recursive:true})
  for (const s of ccb) { cpSync(SKILLS_DIR+'/'+s, bp+'/skills/'+s, {recursive:true}); rmSync(SKILLS_DIR+'/'+s, {recursive:true,force:true}); info((LANG==='zh'?'移除':'Removed')+': '+s) }
  info('[3/4] '+(LANG==='zh'?'修复配置':'Fixing config')+'...')
  const c = cfg()
  if (c) { c.plugins={entries:{feishu:{enabled:true,config:{}}}}; c.gateway=c.gateway||{}; c.gateway.controlUi={allowedOrigins:['*'],allowInsecureAuth:true,dangerouslyDisableDeviceAuth:true}; saveCfg(c); ok(LANG==='zh'?'配置已优化':'Config optimized') }
  info('[4/4] '+(LANG==='zh'?'重启Gateway':'Restarting')+'...')
  killGw(); await sleep(2000)
  const pid = startGw(); await sleep(3000)
  ok(_('full','t')); ok((LANG==='zh'?'备份位置':'Backup')+': '+bp)
}

async function emergency() {
  hr(_('em','t'))
  warn(_('em','desc'))
  const cr = await prompt(_('s','c'))
  if (cr!=='confirm') return
  info('[1/3] Kill...'); killGw(); killGw()
  info('[2/3] Clear logs...'); run('rm -rf /tmp/openclaw-0/*.log /tmp/gw*.log 2>/dev/null||true')
  info('[3/3] Minimal start...')
  const c = cfg()||{}; c.plugins={entries:{feishu:{enabled:true,config:{}}}}; c.gateway={controlUi:{allowedOrigins:['*'],allowInsecureAuth:true}}; saveCfg(c)
  const pid = startGw(); await sleep(3000)
  ok((LANG==='zh'?'紧急恢复完成':'Emergency done')+' (PID '+pid+')')
}

async function openClangLocale() {
  hr(_('cn','t'))
  info(_('cn','desc'))
  warn(LANG==='zh'?'汉化只翻译输出，不修改程序':'Chinese only translates output')
  console.log('\n  '+(LANG==='zh'?'汉化对照表':'CN Mapping')+':\n')
  const pairs = [
    ['help','帮助'],['version','版本'],['status','状态'],['start','启动'],['stop','停止'],
    ['restart','重启'],['reload','重载'],['logs','日志'],['config','配置'],['token','令牌'],
    ['device','设备'],['plugin','插件'],['skill','技能'],['session','会话'],['task','任务'],
    ['Running','运行中'],['Stopped','已停止'],['Error','错误'],['Success','成功'],['Failed','失败'],
    ['Warning','警告'],['Connected','已连接'],['Disconnected','已断开'],
  ]
  pairs.forEach(([en,zh]) => console.log('    '+C.c+en+C.R+' = '+C.g+zh+C.R))
  console.log('\n  '+(LANG==='zh'?'sed命令示例':'sed example')+':\n')
  console.log('\n  '+(LANG==='zh'?'添加到~/.bashrc即可使用':'Add to ~/.bashrc to use')+':')
  console.log('')
}

async function main() {
  loadLang()
  const args = process.argv.slice(2)
  
  if (args.includes('--lang')) {
    const idx = args.indexOf('--lang')
    if (args[idx+1]==='en') { LANG='en'; saveLang() }
    else if (args[idx+1]==='zh') { LANG='zh'; saveLang() }
  }
  
  const numMap = {1:diag,2:restart,3:fixFeishu,4:blockSkills,5:checkApi,6:version,7:full,8:emergency,9:openClangLocale}
  
  // Direct run: ccb fix 1 / ccb fix --yes 7 etc
  if (args.length > 0) {
    const n = parseInt(args.find(a=>!isNaN(parseInt(a))&&parseInt(a)>=1&&parseInt(a)<=9)||0)
    if (numMap[n]) { await numMap[n](); return }
  }
  
  // Interactive
  while (1) {
    const m = LANG==='zh'?T.zh.m:T.en.m
    hr(LANG==='zh'?T.zh.title:T.en.title)
    for (const [k,v] of Object.entries(m)) console.log('  '+C.c+k+'.'+C.R+'  '+v)
    console.log('  '+C.c+'L.'+C.R+' '+(LANG==='zh'?'切换语言':'Switch Lang'))
    const ans = await askNum(11, '', true)
    if (ans===-1) continue  // L pressed, language toggled, redraw menu
    if (ans===0) { console.log('\n'); return }
    if (numMap[ans]) await numMap[ans]()
    else warn(LANG==='zh'?'无效选择':'Invalid choice')
  }
}

main().catch(e => { error(e.message); process.exit(1) })
