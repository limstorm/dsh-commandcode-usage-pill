/**
 * dsh-commandcode-usage-pill — browser half.
 *
 * One entry in the composer dock row (`conversation.composer.dock`), seated
 * beside the shipped session-statistics and token-usage pills. It shows the
 * Command Code subscription's two rolling windows as whole percentages; the
 * shipped pills beside it open a panel on click, so this one does too rather
 * than hiding its detail behind a native tooltip only.
 *
 * Where the numbers come from: the account bridge `dsh-commandcode-goat`
 * already serves on loopback (`POST api/dsh-commandcode-goat/usage`). Reusing
 * it keeps the account key on the host — this bundle never reads a credential
 * and never talks to the vendor. The route is written document-relative on
 * purpose: the harness serves the GUI with `<base href="./">`, so a
 * root-absolute `/api/...` would escape a sub-path deployment.
 *
 * The entry degrades to nothing: with the goat plugin absent, the account
 * unconfigured, or the first read still in flight it renders no cell at all
 * rather than an empty pill, and a poll that fails keeps the last good reading.
 */
window.__ModuleLoader__.load({
  id: '@limstorm/dsh-commandcode-usage-pill',
  factory(require) {
    const React = require('react')
    const reactDom = require('react-dom')
    const h = React.createElement
    /* Layout effects position the panel before paint. Fall back rather than
       crash if a deployment's React build ever lacks the layout variant. */
    const useLayoutEffect = React.useLayoutEffect ?? React.useEffect

    const NS = 'dsh-commandcode-usage-pill'
    const USAGE_ROUTE = 'api/dsh-commandcode-goat/usage'
    const REFRESH_MS = 60000
    /* Panel placement, matching the shipped pills: 8px off the anchor, never
       closer than 12px to a viewport edge. */
    const PANEL_GAP = 8
    const PANEL_MARGIN = 12

    /** Row-local styling. Theme tokens only, so light and dark follow the host. */
    const STYLE = [
      '.ccup-anchor{box-sizing:border-box;min-width:0;max-width:100%;display:inline-flex;',
      'font-size:calc(var(--dsh-content-font-size-secondary,13px) - 1px);',
      'line-height:calc(20px + var(--dsh-content-font-delta-secondary,0px))}',
      '.ccup-pill{box-sizing:border-box;corner-shape:round;max-width:100%;display:inline-flex;',
      'align-items:center;gap:6px;padding:1px 8px;border:none;border-radius:999px;background:0 0;',
      'color:var(--dsw-alias-label-tertiary);font:inherit;line-height:inherit;',
      'font-variant-numeric:tabular-nums;white-space:nowrap;cursor:pointer}',
      '.ccup-pill:hover,.ccup-pill[aria-expanded=true]{background:var(--dsw-alias-interactive-bg-hover);',
      'color:var(--dsw-alias-label-secondary)}',
      '.ccup-pill svg{flex:none;width:14px;height:14px}',
      '.ccup-label{min-width:0;overflow:hidden;text-overflow:ellipsis}',
      '.ccup-sep{color:var(--dsw-alias-separator-primary);margin:0 6px}',
      '.ccup-warn,.ccup-warn:hover,.ccup-warn[aria-expanded=true]{color:var(--dsw-alias-state-warn-label)}',
      '.ccup-panel{position:fixed;z-index:1100;box-sizing:border-box;width:max-content;',
      'min-width:min(300px,100vw - 24px);max-width:min(440px,100vw - 24px);padding:16px;',
      'border:0;border-radius:var(--dsw-radius-lg);background:var(--dsw-specific-menu);',
      'backdrop-filter:var(--dsw-menu-backdrop-filter);--dsw-elevation-stroke-color:var(--dsw-alias-border-l1);',
      'box-shadow:var(--dsw-elevation-prominent);color:var(--dsw-alias-label-secondary);',
      'cursor:default;font-size:12px;line-height:18px}',
      '.ccup-panelTitle{display:flex;justify-content:space-between;gap:16px;margin-bottom:8px;',
      'color:var(--dsw-alias-label-primary);font-weight:500}',
      '.ccup-panelTitleLabel{display:inline-flex;align-items:center;gap:6px;min-width:0}',
      '.ccup-panelTitleLabel svg{flex:none;width:14px;height:14px}',
      '.ccup-rule{border-top:.5px solid var(--dsw-alias-border-l2);margin-bottom:10px}',
      '.ccup-details{display:grid;grid-template-columns:minmax(76px,auto) minmax(0,1fr);',
      'gap:6px 16px;margin:0;color:var(--dsw-alias-label-tertiary)}',
      '.ccup-details dt,.ccup-details dd{min-width:0;margin:0}',
      '.ccup-details dd{color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;text-align:right}',
    ].join('')

    const ZH = {
      'pill.five': '5小时 {percent}%',
      'pill.weekly': '周 {percent}%',
      'panel.title': 'Command Code 用量',
      'window.fiveHour': '5 小时窗口',
      'window.weekly': '每周窗口',
      'label.reset': '重置',
      'label.balance': '账户余额',
      'label.cost': '本周期花费',
      'label.requests': '请求数',
      'label.tokens': 'Tokens',
      'value.window': '${used} / ${cap}（{percent}%）',
      'value.reset': '{duration}后',
      'value.requests': '{count}（失败 {failed}）',
      'duration.minutes': '{n} 分钟',
      'duration.hours': '{n} 小时',
      'duration.hoursMinutes': '{h} 小时 {m} 分',
      'duration.days': '{n} 天',
      'duration.daysHours': '{d} 天 {h} 小时',
      'aria.label': 'Command Code 用量',
    }

    const EN = {
      'pill.five': '5h {percent}%',
      'pill.weekly': 'wk {percent}%',
      'panel.title': 'Command Code usage',
      'window.fiveHour': '5-hour window',
      'window.weekly': 'Weekly window',
      'label.reset': 'Resets',
      'label.balance': 'Balance',
      'label.cost': 'Cost this period',
      'label.requests': 'Requests',
      'label.tokens': 'Tokens',
      'value.window': '${used} / ${cap} ({percent}%)',
      'value.reset': 'in {duration}',
      'value.requests': '{count} ({failed} failed)',
      'duration.minutes': '{n}m',
      'duration.hours': '{n}h',
      'duration.hoursMinutes': '{h}h {m}m',
      'duration.days': '{n}d',
      'duration.daysHours': '{d}d {h}h',
      'aria.label': 'Command Code usage',
    }

    /** One window's used/cap as a clamped whole percentage, or null when unusable. */
    function percentOf(limit) {
      const used = Number(limit?.used)
      const cap = Number(limit?.cap)
      if (!Number.isFinite(used) || !Number.isFinite(cap) || cap <= 0) return null
      return Math.min(100, Math.max(0, Math.round((used / cap) * 100)))
    }

    /** Dollars to the two decimals the account reports its windows in. */
    function money(value) {
      const amount = Number(value)
      return Number.isFinite(amount) ? amount.toFixed(2) : '0.00'
    }

    /** Token counts the way the shipped usage surfaces shorten them. */
    function compactCount(value) {
      const n = Number(value)
      if (!Number.isFinite(n)) return null
      if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`
      if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`
      if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`
      return String(n)
    }

    /** Compact countdown to a window reset, in the active locale, or null once past. */
    function resetIn(resetAt, t) {
      const delta = Number(resetAt) - Date.now()
      if (!Number.isFinite(delta) || delta <= 0) return null
      const minutes = Math.max(1, Math.round(delta / 60000))
      if (minutes < 60) return t('duration.minutes', { n: minutes })
      const hours = Math.floor(minutes / 60)
      const rest = minutes % 60
      if (hours < 24) {
        return rest === 0
          ? t('duration.hours', { n: hours })
          : t('duration.hoursMinutes', { h: hours, m: rest })
      }
      const days = Math.floor(hours / 24)
      const restHours = hours % 24
      return restHours === 0
        ? t('duration.days', { n: days })
        : t('duration.daysHours', { d: days, h: restHours })
    }

    /**
     * Read the account usage report through the goat bridge.
     *
     * The bridge answers 200 with `{ok:false}` for expected failures and a
     * non-200 only for a request it refused outright, so both carry the reason.
     */
    async function readUsage(signal) {
      const response = await fetch(USAGE_ROUTE, {
        signal,
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: '{}',
      })
      const payload = await response.json().catch(() => undefined)
      if (!response.ok || payload?.ok === false) {
        throw new Error(payload?.message ?? `HTTP ${response.status}`)
      }
      return payload?.value
    }

    /** A small ascending-bars mark, drawn locally so no Client package is imported. */
    function UsageMark() {
      return h('svg', {
        viewBox: '0 0 16 16', width: 14, height: 14, 'aria-hidden': true,
        fill: 'none', stroke: 'currentColor', strokeWidth: 1.2,
        strokeLinecap: 'round', strokeLinejoin: 'round',
      },
        h('path', { d: 'M2.5 13.5h11' }),
        h('path', { d: 'M4.5 13.5V8.4' }),
        h('path', { d: 'M8 13.5V4.6' }),
        h('path', { d: 'M11.5 13.5V6.7' }),
      )
    }

    /**
     * Track the anchor's viewport position while the panel is open, seating the
     * panel above it and clamping it inside the viewport. The panel renders
     * hidden for the first pass so it can be measured before it is placed.
     */
    function useAnchoredPosition(open, anchorRef, panelRef) {
      const [position, setPosition] = React.useState(null)
      useLayoutEffect(() => {
        if (!open) {
          setPosition(null)
          return undefined
        }
        const place = () => {
          const anchor = anchorRef.current
          if (anchor === null) return
          const rect = anchor.getBoundingClientRect()
          const measured = panelRef.current?.getBoundingClientRect()
          const width = measured?.width ?? 0
          const height = measured?.height ?? 0
          const maxLeft = Math.max(PANEL_MARGIN, window.innerWidth - width - PANEL_MARGIN)
          const centered = rect.left + rect.width / 2 - width / 2
          const left = Math.min(Math.max(centered, PANEL_MARGIN), maxLeft)
          const above = rect.top - PANEL_GAP - height
          const top = above >= PANEL_MARGIN ? above : rect.bottom + PANEL_GAP
          setPosition({ left, top })
        }
        place()
        window.addEventListener('resize', place)
        window.addEventListener('scroll', place, true)
        return () => {
          window.removeEventListener('resize', place)
          window.removeEventListener('scroll', place, true)
        }
      }, [open, anchorRef, panelRef])
      return position
    }

    function UsagePill({ t }) {
      const [report, setReport] = React.useState(null)
      const [open, setOpen] = React.useState(false)
      const anchorRef = React.useRef(null)
      const panelRef = React.useRef(null)
      const position = useAnchoredPosition(open, anchorRef, panelRef)

      React.useEffect(() => {
        const controller = new AbortController()
        const load = async () => {
          try {
            const value = await readUsage(controller.signal)
            if (!controller.signal.aborted) setReport(value ?? null)
          } catch {
            /* Expected when the goat plugin is absent or the account is not
               configured. Keep the last good reading and stay silent. */
          }
        }
        load()
        const timer = setInterval(load, REFRESH_MS)
        return () => {
          controller.abort()
          clearInterval(timer)
        }
      }, [])

      /* Dismiss on an outside pointer or Escape, the way the shipped pills do. */
      React.useEffect(() => {
        if (!open) return undefined
        const onPointerDown = (event) => {
          const target = event.target
          if (anchorRef.current?.contains(target) === true) return
          if (panelRef.current?.contains(target) === true) return
          setOpen(false)
        }
        const onKeyDown = (event) => {
          if (event.key === 'Escape') setOpen(false)
        }
        document.addEventListener('pointerdown', onPointerDown, true)
        document.addEventListener('keydown', onKeyDown)
        return () => {
          document.removeEventListener('pointerdown', onPointerDown, true)
          document.removeEventListener('keydown', onKeyDown)
        }
      }, [open])

      const fiveHour = report?.credits?.fiveHour
      const weekly = report?.credits?.weekly
      const fivePercent = percentOf(fiveHour)
      const weeklyPercent = percentOf(weekly)
      if (fivePercent === null && weeklyPercent === null) return null

      const cells = []
      const summaryParts = []
      if (fivePercent !== null) {
        cells.push(t('pill.five', { percent: fivePercent }))
        summaryParts.push(t('pill.five', { percent: fivePercent }))
      }
      if (weeklyPercent !== null) {
        if (cells.length > 0) {
          cells.push(h('span', { key: 'sep', className: 'ccup-sep', 'aria-hidden': true }, '\u00b7'))
        }
        cells.push(t('pill.weekly', { percent: weeklyPercent }))
        summaryParts.push(t('pill.weekly', { percent: weeklyPercent }))
      }
      const summary = summaryParts.join(' \u00b7 ')

      const rows = []
      for (const [labelKey, limit, percent] of [
        ['window.fiveHour', fiveHour, fivePercent],
        ['window.weekly', weekly, weeklyPercent],
      ]) {
        if (percent === null) continue
        rows.push(h(React.Fragment, { key: labelKey },
          h('dt', null, t(labelKey)),
          h('dd', null, t('value.window', {
            used: money(limit.used), cap: money(limit.cap), percent,
          })),
        ))
        const reset = resetIn(limit.resetAt, t)
        if (reset !== null) {
          rows.push(h(React.Fragment, { key: `${labelKey}.reset` },
            h('dt', null, t('label.reset')),
            h('dd', null, t('value.reset', { duration: reset })),
          ))
        }
      }
      const balance = Number(report?.credits?.monthlyCredits)
      if (Number.isFinite(balance)) {
        rows.push(h(React.Fragment, { key: 'balance' },
          h('dt', null, t('label.balance')),
          h('dd', null, `$${money(balance)}`),
        ))
      }
      const cost = Number(report?.usage?.totalCost)
      if (Number.isFinite(cost)) {
        rows.push(h(React.Fragment, { key: 'cost' },
          h('dt', null, t('label.cost')),
          h('dd', null, `$${money(cost)}`),
        ))
      }
      const requests = Number(report?.usage?.totalCount)
      if (Number.isFinite(requests)) {
        rows.push(h(React.Fragment, { key: 'requests' },
          h('dt', null, t('label.requests')),
          h('dd', null, t('value.requests', {
            count: requests, failed: Number(report?.usage?.failedCount) || 0,
          })),
        ))
      }
      const tokens = compactCount(report?.usage?.totalTokens)
      if (tokens !== null) {
        rows.push(h(React.Fragment, { key: 'tokens' },
          h('dt', null, t('label.tokens')),
          h('dd', null, tokens),
        ))
      }

      const exceeded = fiveHour?.exceeded === true || weekly?.exceeded === true

      const panel = open
        ? reactDom.createPortal(
            h('div', {
              ref: panelRef,
              className: 'ccup-panel',
              role: 'dialog',
              'aria-label': t('panel.title'),
              style: position === null
                ? { left: 0, top: 0, visibility: 'hidden' }
                : { left: position.left, top: position.top },
            },
              h('div', { className: 'ccup-panelTitle' },
                h('span', { className: 'ccup-panelTitleLabel' },
                  h(UsageMark, null),
                  t('panel.title'),
                ),
                typeof report?.plan?.name === 'string' && report.plan.name !== ''
                  ? h('span', null, report.plan.name)
                  : null,
              ),
              h('div', { className: 'ccup-rule', 'aria-hidden': true }),
              h('dl', { className: 'ccup-details' }, rows),
            ),
            document.body,
          )
        : null

      return h(React.Fragment, null,
        h('style', null, STYLE),
        h('span', { className: 'ccup-anchor', ref: anchorRef },
          h('button', {
            type: 'button',
            className: exceeded ? 'ccup-pill ccup-warn' : 'ccup-pill',
            'aria-haspopup': 'dialog',
            'aria-expanded': open,
            'aria-label': `${t('aria.label')} — ${summary}`,
            title: open ? undefined : summary,
            onClick: () => setOpen((value) => !value),
          },
            h(UsageMark, null),
            h('span', { className: 'ccup-label' }, cells),
          ),
          panel,
        ),
      )
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(
          () => ctx.locale.register(NS, { zh: ZH, en: EN }),
          'dsh-commandcode-usage-pill: dictionaries',
        )
        ctx.slots.inject('conversation.composer.dock', () => ctx.slots.register({
          name: 'conversation.composer.dock',
          id: 'commandcode-usage',
          order: 10,
          locale: NS,
        }, UsagePill))
      },
    }
  },
})
