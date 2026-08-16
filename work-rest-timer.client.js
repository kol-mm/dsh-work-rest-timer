// Work-Rest Timer（工作/休息计时器）— 动态 Cordis 插件（Client 端）
//
// 用法：把下面 `return { ... }` 的整块代码作为 `code.client` 传入 cordis_define，
// 然后 cordis_run。运行环境提供以下 Builtins（无需自己 import）：
//   ctx, React, styles, console, host
// 以及 Client Service：timer（通过 inject: ['timer'] 使用 ctx.interval / ctx.timeout）。

return {
  inject: ['timer'],
  apply(ctx) {
    const slots = ctx.get('slots')
    if (slots === undefined) return

    const disposeStyles = styles.insert(
      '.wrt-root{position:fixed;right:16px;bottom:16px;z-index:10000;pointer-events:auto;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"PingFang SC","Microsoft YaHei",sans-serif;user-select:none}' +
      '.wrt-card{width:236px;background:var(--dsw-alias-bg-overlay,#1e1f24);color:var(--dsw-alias-label-primary,#e8e8ea);border:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.14));border-radius:14px;box-shadow:0 10px 34px rgba(0,0,0,.32);padding:14px 14px 12px;box-sizing:border-box;transition:border-color .25s ease}' +
      '.wrt-card[data-phase="work"]{border-color:var(--dsw-alias-state-success-primary,#2ecc71)}' +
      '.wrt-card[data-phase="rest"]{border-color:var(--dsw-alias-state-warn-primary,#f5a623)}' +
      '.wrt-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}' +
      '.wrt-phase{font-size:12px;font-weight:600;letter-spacing:.4px;color:var(--dsw-alias-label-secondary,#9aa0a6)}' +
      '.wrt-phase.work{color:var(--dsw-alias-state-success-primary,#2ecc71)}' +
      '.wrt-phase.rest{color:var(--dsw-alias-state-warn-primary,#f5a623)}' +
      '.wrt-iconbtn{background:none;border:none;cursor:pointer;color:var(--dsw-alias-label-secondary,#9aa0a6);font-size:14px;padding:2px 5px;border-radius:6px;line-height:1}' +
      '.wrt-iconbtn:hover{background:var(--dsw-alias-bg-layer-2,rgba(255,255,255,.08));color:var(--dsw-alias-label-primary,#e8e8ea)}' +
      '.wrt-time{font-size:40px;font-weight:700;line-height:1;text-align:center;font-variant-numeric:tabular-nums;letter-spacing:1px;margin:4px 0 10px}' +
      '.wrt-bar{height:6px;border-radius:999px;background:var(--dsw-alias-bg-layer-2,rgba(255,255,255,.1));overflow:hidden;margin-bottom:12px}' +
      '.wrt-fill{height:100%;border-radius:999px;background:var(--dsw-alias-state-success-primary,#2ecc71);transition:width .5s linear}' +
      '.wrt-card[data-phase="rest"] .wrt-fill{background:var(--dsw-alias-state-warn-primary,#f5a623)}' +
      '.wrt-controls{display:flex;gap:6px}' +
      '.wrt-btn{flex:1;border:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,.18));background:var(--dsw-alias-bg-layer-1,rgba(255,255,255,.05));color:var(--dsw-alias-label-primary,#e8e8ea);border-radius:8px;padding:7px 0;font-size:12px;cursor:pointer;transition:background .15s}' +
      '.wrt-btn:hover{background:var(--dsw-alias-bg-layer-2,rgba(255,255,255,.1))}' +
      '.wrt-btn.primary{background:var(--dsw-alias-brand-primary,#4f8cff);border-color:transparent;color:#fff;font-weight:600}' +
      '.wrt-btn.primary:hover{filter:brightness(1.08)}' +
      '.wrt-settings{margin-top:10px;border-top:1px dashed var(--dsw-alias-border-l1,rgba(255,255,255,.14));padding-top:10px;display:flex;flex-direction:column;gap:8px}' +
      '.wrt-row{display:flex;align-items:center;justify-content:space-between;font-size:12px;color:var(--dsw-alias-label-secondary,#9aa0a6)}' +
      '.wrt-num{width:56px;background:var(--dsw-alias-bg-layer-2,rgba(255,255,255,.08));border:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,.18));border-radius:6px;color:var(--dsw-alias-label-primary,#e8e8ea);padding:4px 6px;font-size:12px;text-align:center}' +
      '.wrt-toggle{appearance:none;width:34px;height:18px;background:var(--dsw-alias-bg-layer-2,rgba(255,255,255,.14));border-radius:999px;position:relative;cursor:pointer;transition:background .2s;border:none;flex:none}' +
      '.wrt-toggle:checked{background:var(--dsw-alias-brand-primary,#4f8cff)}' +
      '.wrt-toggle::after{content:"";position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:#fff;transition:left .2s}' +
      '.wrt-toggle:checked::after{left:18px}' +
      '.wrt-pill{display:flex;align-items:center;gap:8px;padding:8px 14px;background:var(--dsw-alias-bg-overlay,#1e1f24);color:var(--dsw-alias-label-primary,#e8e8ea);border:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.14));border-radius:999px;box-shadow:0 6px 20px rgba(0,0,0,.28);cursor:pointer;font-size:13px;font-variant-numeric:tabular-nums}' +
      '.wrt-pill-dot{width:8px;height:8px;border-radius:50%;background:var(--dsw-alias-state-success-primary,#2ecc71);flex:none}' +
      '.wrt-pill[data-phase="rest"] .wrt-pill-dot{background:var(--dsw-alias-state-warn-primary,#f5a623)}'
    )

    let audioCtx = null

    function unlockAudio() {
      try {
        const w = (typeof window !== 'undefined') ? window : null
        const AC = (w && (w.AudioContext || w.webkitAudioContext)) ? (w.AudioContext || w.webkitAudioContext) : (typeof AudioContext !== 'undefined' ? AudioContext : (typeof webkitAudioContext !== 'undefined' ? webkitAudioContext : null))
        if (AC) {
          if (!audioCtx) audioCtx = new AC()
          if (audioCtx.state === 'suspended' && typeof audioCtx.resume === 'function') audioCtx.resume()
        }
        const synth = (w && w.speechSynthesis) ? w.speechSynthesis : (typeof speechSynthesis !== 'undefined' ? speechSynthesis : null)
        if (synth) {
          try { synth.cancel(); synth.getVoices() } catch (e) {}
        }
      } catch (err) {}
    }

    function beep(times) {
      try {
        const ac = audioCtx
        if (!ac) return
        const n = times > 0 ? times : 3
        const now = ac.currentTime
        for (let i = 0; i < n; i++) {
          const osc = ac.createOscillator()
          const gain = ac.createGain()
          osc.connect(gain)
          gain.connect(ac.destination)
          osc.type = 'sine'
          osc.frequency.value = 880
          const t0 = now + i * 0.4
          gain.gain.setValueAtTime(0.0001, t0)
          gain.gain.exponentialRampToValueAtTime(0.25, t0 + 0.02)
          gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.2)
          osc.start(t0)
          osc.stop(t0 + 0.24)
        }
      } catch (err) {}
    }

    function speak(text) {
      try {
        const w = (typeof window !== 'undefined') ? window : null
        const synth = (w && w.speechSynthesis) ? w.speechSynthesis : (typeof speechSynthesis !== 'undefined' ? speechSynthesis : null)
        if (!synth) return
        const U = (w && w.SpeechSynthesisUtterance) ? w.SpeechSynthesisUtterance : (typeof SpeechSynthesisUtterance !== 'undefined' ? SpeechSynthesisUtterance : null)
        if (!U) return
        synth.cancel()
        const u = new U(text)
        u.lang = 'zh-CN'
        u.rate = 1
        u.pitch = 1
        u.volume = 1
        synth.speak(u)
      } catch (err) {
        try { console.error('语音播放失败', err) } catch (e2) {}
      }
    }

    function App() {
      const [phase, setPhase] = React.useState('work')
      const [running, setRunning] = React.useState(false)
      const [remaining, setRemaining] = React.useState(25 * 60)
      const [workMin, setWorkMin] = React.useState(25)
      const [restMin, setRestMin] = React.useState(5)
      const [voiceOn, setVoiceOn] = React.useState(true)
      const [autoLoop, setAutoLoop] = React.useState(true)
      const [collapsed, setCollapsed] = React.useState(false)
      const [showSettings, setShowSettings] = React.useState(false)

      const total = (phase === 'work' ? workMin : restMin) * 60
      const denom = total > 0 ? total : 1
      const mm = Math.floor(remaining / 60)
      const ss = remaining % 60
      const timeText = (mm < 10 ? '0' : '') + mm + ':' + (ss < 10 ? '0' : '') + ss
      const progress = remaining / denom

      React.useEffect(() => {
        if (!running) return
        return ctx.interval(() => {
          setRemaining(prev => (prev > 0 ? prev - 1 : 0))
        }, 1000)
      }, [running])

      React.useEffect(() => {
        if (!running || remaining !== 0) return
        const isWorkEnd = phase === 'work'
        const nextPhase = isWorkEnd ? 'rest' : 'work'
        const nextTotal = (nextPhase === 'work' ? workMin : restMin) * 60
        if (voiceOn) {
          speak(isWorkEnd ? '工作时间结束，该休息一下啦' : '休息结束，开始工作吧')
          beep(3)
        }
        setPhase(nextPhase)
        setRemaining(nextTotal > 0 ? nextTotal : 1)
        if (!autoLoop) setRunning(false)
      }, [remaining, running, phase, workMin, restMin, autoLoop, voiceOn])

      function startPause() {
        if (running) { setRunning(false); return }
        unlockAudio()
        if (remaining <= 0) {
          const t = (phase === 'work' ? workMin : restMin) * 60
          setRemaining(t > 0 ? t : 1)
        }
        setRunning(true)
      }

      function reset() {
        setRunning(false)
        setPhase('work')
        setRemaining((workMin > 0 ? workMin : 1) * 60)
      }

      function skip() {
        const nextPhase = phase === 'work' ? 'rest' : 'work'
        const t = (nextPhase === 'work' ? workMin : restMin) * 60
        setPhase(nextPhase)
        setRemaining(t > 0 ? t : 1)
        setRunning(false)
      }

      function changeWork(v) {
        const n = Math.max(1, Math.min(600, parseInt(v, 10) || 1))
        setWorkMin(n)
        if (!running && phase === 'work') setRemaining(n * 60)
      }

      function changeRest(v) {
        const n = Math.max(1, Math.min(600, parseInt(v, 10) || 1))
        setRestMin(n)
        if (!running && phase === 'rest') setRemaining(n * 60)
      }

      if (collapsed) {
        return React.createElement('div', { className: 'wrt-root' },
          React.createElement('button', { className: 'wrt-pill', 'data-phase': phase, title: '展开计时器', onClick: () => setCollapsed(false) },
            React.createElement('span', { className: 'wrt-pill-dot' }),
            React.createElement('span', null, timeText),
          ),
        )
      }

      return React.createElement('div', { className: 'wrt-root' },
        React.createElement('div', { className: 'wrt-card', 'data-phase': phase },
          React.createElement('div', { className: 'wrt-head' },
            React.createElement('span', { className: 'wrt-phase ' + phase }, phase === 'work' ? '工作中' : '休息中'),
            React.createElement('span', null,
              React.createElement('button', { className: 'wrt-iconbtn', title: '设置', onClick: () => setShowSettings(s => !s) }, '\u2699'),
              React.createElement('button', { className: 'wrt-iconbtn', title: '收起', onClick: () => setCollapsed(true) }, '\u2013'),
            ),
          ),
          React.createElement('div', { className: 'wrt-time' }, timeText),
          React.createElement('div', { className: 'wrt-bar' },
            React.createElement('div', { className: 'wrt-fill', style: { width: Math.round(progress * 100) + '%' } }),
          ),
          React.createElement('div', { className: 'wrt-controls' },
            React.createElement('button', { className: 'wrt-btn primary', onClick: startPause }, running ? '暂停' : '开始'),
            React.createElement('button', { className: 'wrt-btn', onClick: reset }, '重置'),
            React.createElement('button', { className: 'wrt-btn', onClick: skip }, '跳过'),
          ),
          showSettings ? React.createElement('div', { className: 'wrt-settings' },
            React.createElement('div', { className: 'wrt-row' },
              React.createElement('span', null, '工作时长(分)'),
              React.createElement('input', { className: 'wrt-num', type: 'number', min: '1', max: '600', value: workMin, onChange: (ev) => changeWork(ev.target.value) }),
            ),
            React.createElement('div', { className: 'wrt-row' },
              React.createElement('span', null, '休息时长(分)'),
              React.createElement('input', { className: 'wrt-num', type: 'number', min: '1', max: '600', value: restMin, onChange: (ev) => changeRest(ev.target.value) }),
            ),
            React.createElement('div', { className: 'wrt-row' },
              React.createElement('span', null, '语音提醒'),
              React.createElement('input', { className: 'wrt-toggle', type: 'checkbox', checked: voiceOn, onChange: (ev) => setVoiceOn(ev.target.checked) }),
            ),
            React.createElement('div', { className: 'wrt-row' },
              React.createElement('span', null, '自动循环'),
              React.createElement('input', { className: 'wrt-toggle', type: 'checkbox', checked: autoLoop, onChange: (ev) => setAutoLoop(ev.target.checked) }),
            ),
          ) : null,
        ),
      )
    }

    const disposeSlot = slots.inject('shell.overlay', () =>
      slots.register(
        { name: 'shell.overlay', id: 'work-rest-timer' },
        () => React.createElement(App),
      ),
    )

    return () => {
      disposeSlot()
      disposeStyles()
    }
  },
}
