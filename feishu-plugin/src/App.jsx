import { useEffect, useState, useCallback } from 'react'
import { bitable, FieldType } from '@lark-base-open/js-sdk'
import { analyzeWithAI } from './api'

const ANALYSIS_TYPES = [
  { value: 'content', label: '内容拆解' },
  { value: 'competitor', label: '竞品分析' },
  { value: 'copywrite', label: '文案优化' },
  { value: 'keywords', label: '关键词提取' },
]

const STORAGE_KEY = 'omniintel_settings'

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function saveSettings(s) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
}

export default function App() {
  const [tab, setTab] = useState('analyze')
  const [settings, setSettings] = useState(() => ({
    provider: 'deepseek',
    apiKey: '',
    ...loadSettings(),
  }))

  const [fields, setFields] = useState([])
  const [sourceFieldId, setSourceFieldId] = useState('')
  const [resultFieldId, setResultFieldId] = useState('')
  const [analysisType, setAnalysisType] = useState('content')
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [tableName, setTableName] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  // Init SDK
  useEffect(() => {
    async function init() {
      try {
        const table = await bitable.base.getActiveTable()
        setTableName(await table.getName())
        setFields(await table.getFieldMetaList())
      } catch (e) {
        setError('请在飞书多维表格中打开插件')
      }
    }
    init()

    bitable.base.onSelectionChange(async (event) => {
      if (!event.data.recordId) { setSelectedRecord(null); return }
      try {
        const table = await bitable.base.getActiveTable()
        setTableName(await table.getName())
        setFields(await table.getFieldMetaList())
        const record = await table.getRecordById(event.data.recordId)
        setSelectedRecord({ id: event.data.recordId, fields: record.fields })
        setResult('')
        setError('')
      } catch {}
    })
  }, [])

  const handleSaveSettings = () => {
    saveSettings(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleAnalyze = useCallback(async () => {
    if (!settings.apiKey) { setError('请先在「设置」中填写 API Key'); setTab('settings'); return }
    if (!sourceFieldId) { setError('请选择来源字段'); return }
    if (!selectedRecord) { setError('请在表格中点击选中一行'); return }

    setLoading(true)
    setError('')
    setResult('')

    try {
      const cell = selectedRecord.fields[sourceFieldId]
      const text = extractText(cell)
      if (!text.trim()) { setError('所选字段内容为空'); setLoading(false); return }

      const analysis = await analyzeWithAI({
        text,
        type: analysisType,
        provider: settings.provider,
        apiKey: settings.apiKey,
      })

      setResult(analysis)

      if (resultFieldId) {
        const table = await bitable.base.getActiveTable()
        await table.setCellValue(resultFieldId, selectedRecord.id, [{ type: 'text', text: analysis }])
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [settings, sourceFieldId, resultFieldId, analysisType, selectedRecord])

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <span style={s.logo}>⬡</span>
        <span style={s.brand}>OmniIntel</span>
        <span style={s.tagline}>内容情报</span>
      </div>

      <div style={s.tabs}>
        {['analyze', 'settings'].map(t => (
          <button key={t} style={{ ...s.tab, ...(tab === t ? s.tabActive : {}) }} onClick={() => setTab(t)}>
            {t === 'analyze' ? '分析' : '设置'}
          </button>
        ))}
      </div>

      {tab === 'settings' && (
        <div style={s.panel}>
          <div style={s.fieldGroup}>
            <label style={s.label}>AI 服务商</label>
            <div style={s.radioGroup}>
              {[{ v: 'deepseek', l: 'DeepSeek（推荐）' }, { v: 'claude', l: 'Claude' }].map(({ v, l }) => (
                <label key={v} style={s.radio}>
                  <input type="radio" name="provider" value={v}
                    checked={settings.provider === v}
                    onChange={() => setSettings(p => ({ ...p, provider: v }))} />
                  {l}
                </label>
              ))}
            </div>
          </div>

          <div style={s.fieldGroup}>
            <label style={s.label}>API Key</label>
            <input
              style={s.input}
              type="password"
              placeholder={settings.provider === 'deepseek' ? 'sk-...' : 'sk-ant-...'}
              value={settings.apiKey}
              onChange={e => setSettings(p => ({ ...p, apiKey: e.target.value }))}
            />
            <div style={s.hint}>
              {settings.provider === 'deepseek'
                ? '在 platform.deepseek.com 获取，约 ¥0.001/次'
                : '在 console.anthropic.com 获取'}
            </div>
          </div>

          <button style={{ ...s.btn, background: saved ? '#52c41a' : '#1456F0' }} onClick={handleSaveSettings}>
            {saved ? '已保存 ✓' : '保存设置'}
          </button>
        </div>
      )}

      {tab === 'analyze' && (
        <div style={s.panel}>
          <div style={s.infoRow}>
            <span style={s.infoLabel}>表格</span>
            <span style={s.infoVal}>{tableName || '—'}</span>
          </div>
          <div style={s.infoRow}>
            <span style={s.infoLabel}>当前行</span>
            <span style={s.infoVal}>{selectedRecord ? '已选中 ✓' : '请点击表格中的一行'}</span>
          </div>

          <div style={s.fieldGroup}>
            <label style={s.label}>来源字段</label>
            <select style={s.select} value={sourceFieldId} onChange={e => setSourceFieldId(e.target.value)}>
              <option value="">请选择包含内容的字段</option>
              {fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>

          <div style={s.fieldGroup}>
            <label style={s.label}>分析类型</label>
            <div style={s.typeGrid}>
              {ANALYSIS_TYPES.map(({ value, label }) => (
                <button key={value}
                  style={{ ...s.typeBtn, ...(analysisType === value ? s.typeBtnActive : {}) }}
                  onClick={() => setAnalysisType(value)}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div style={s.fieldGroup}>
            <label style={s.label}>结果写入字段（可选）</label>
            <select style={s.select} value={resultFieldId} onChange={e => setResultFieldId(e.target.value)}>
              <option value="">仅在此显示，不写入</option>
              {fields.filter(f => f.type === FieldType.Text).map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          <button style={{ ...s.btn, opacity: (loading || !selectedRecord || !sourceFieldId) ? 0.5 : 1 }}
            disabled={loading || !selectedRecord || !sourceFieldId}
            onClick={handleAnalyze}>
            {loading ? '分析中…' : '开始分析'}
          </button>

          {error && <div style={s.error}>{error}</div>}

          {result && (
            <div style={s.resultBox}>
              <div style={s.resultHeader}>
                分析结果
                {resultFieldId && <span style={s.writtenBadge}>已写入表格 ✓</span>}
              </div>
              <pre style={s.pre}>{result}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function extractText(cell) {
  if (!cell) return ''
  if (typeof cell === 'string') return cell
  if (Array.isArray(cell)) return cell.map(c => c?.text ?? c?.value ?? '').join('')
  return String(cell)
}

const s = {
  wrap: { padding: '12px', fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif', fontSize: 13, color: '#1f2329', background: '#fff', minHeight: '100vh' },
  header: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 },
  logo: { fontSize: 18, color: '#1456F0' },
  brand: { fontSize: 15, fontWeight: 700, color: '#1456F0' },
  tagline: { fontSize: 11, color: '#8f959e', background: '#f0f4ff', padding: '1px 7px', borderRadius: 10 },
  tabs: { display: 'flex', borderBottom: '1px solid #e8e8e8', marginBottom: 16 },
  tab: { flex: 1, padding: '8px 0', border: 'none', background: 'none', fontSize: 13, color: '#8f959e', cursor: 'pointer', borderBottom: '2px solid transparent', transition: 'all 0.15s' },
  tabActive: { color: '#1456F0', borderBottom: '2px solid #1456F0', fontWeight: 600 },
  panel: { display: 'flex', flexDirection: 'column', gap: 14 },
  infoRow: { display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: '#f5f6f7', borderRadius: 6 },
  infoLabel: { fontSize: 11, color: '#8f959e', minWidth: 30 },
  infoVal: { fontSize: 12, color: '#1f2329' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: 4 },
  label: { fontSize: 11, color: '#8f959e', fontWeight: 500 },
  hint: { fontSize: 11, color: '#b0b7c3', marginTop: 2 },
  input: { padding: '7px 10px', border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 13, outline: 'none', width: '100%' },
  select: { padding: '7px 8px', border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 13, color: '#1f2329', background: '#fff', width: '100%' },
  radioGroup: { display: 'flex', flexDirection: 'column', gap: 6, padding: '6px 0' },
  radio: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' },
  typeGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 },
  typeBtn: { padding: '7px 4px', border: '1px solid #e0e0e0', borderRadius: 6, background: '#fff', fontSize: 12, cursor: 'pointer', color: '#595959', transition: 'all 0.15s' },
  typeBtnActive: { border: '1px solid #1456F0', background: '#f0f4ff', color: '#1456F0', fontWeight: 600 },
  btn: { padding: '10px', background: '#1456F0', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' },
  error: { background: '#fff1f0', border: '1px solid #ffccc7', borderRadius: 6, padding: '8px 12px', color: '#cf1322', fontSize: 12 },
  resultBox: { background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6, padding: '10px 12px' },
  resultHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#52c41a', fontWeight: 600, marginBottom: 6 },
  writtenBadge: { fontSize: 10, background: '#52c41a', color: '#fff', padding: '1px 6px', borderRadius: 8 },
  pre: { whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: 12, color: '#135200', lineHeight: 1.7, margin: 0 },
}
