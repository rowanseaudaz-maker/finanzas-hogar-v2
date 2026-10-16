import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function App() {
  const [periodo, setPeriodo] = useState('2026-10')
  const [cargando, setCargando] = useState(true)

  // Datos de Supabase
  const [ingresos, setIngresos] = useState([])
  const [ahorros, setAhorros] = useState({ Lisandro: 0, Catriel: 0 })
  const [gastosPropios, setGastosPropios] = useState([])
  const [gastosCompartidos, setGastosCompartidos] = useState([])
  const [tarjetas, setTarjetas] = useState([])
  const [consumosTarjetas, setConsumosTarjetas] = useState([])
  const [combustible, setCombustible] = useState([])

  // Formularios
  const [nuevoGastoComp, setNuevoGastoComp] = useState({ concepto: '', monto: '' })
  const [nuevoIngreso, setNuevoIngreso] = useState({ persona: 'Catriel', descripcion: '', monto: '' })
  const [nuevoGastoPropio, setNuevoGastoPropio] = useState({ persona: 'Catriel', descripcion: '', monto: '' })
  const [nuevaTarjeta, setNuevaTarjeta] = useState({ persona: 'Catriel', nombre: '' })
  const [nuevoCombustible, setNuevoCombustible] = useState({ persona: 'Catriel', monto: '' })

  useEffect(() => {
    cargarTodo()
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => cargarTodo())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [periodo])

  const cargarTodo = async () => {
    setCargando(true)
    try {
      const { data: gComp } = await supabase.from('gastos_compartidos').select('*')
      setGastosCompartidos(gComp || [])

      const { data: ing } = await supabase.from('ingresos').select('*')
      setIngresos(ing || [])

      const { data: gProp } = await supabase.from('gastos_propios').select('*')
      setGastosPropios(gProp || [])

      const { data: tarj } = await supabase.from('tarjetas').select('*')
      setTarjetas(tarj || [])

      const { data: cons } = await supabase.from('consumos_tarjetas').select('*')
      setConsumosTarjetas(cons || [])

      const { data: comb } = await supabase.from('combustible').select('*')
      setCombustible(comb || [])

      const { data: aho } = await supabase.from('ahorros').select('*')
      if (aho) {
        const lis = aho.find(a => a.persona === 'Lisandro')?.monto || 0
        const cat = aho.find(a => a.persona === 'Catriel')?.monto || 0
        setAhorros({ Lisandro: lis, Catriel: cat })
      }
    } catch (e) {
      console.error(e)
    } finally {
      setCargando(false)
    }
  }

  // Guardados en Supabase
  const agregarGastoComp = async (e) => {
    e.preventDefault()
    if (!nuevoGastoComp.concepto || !nuevoGastoComp.monto) return
    await supabase.from('gastos_compartidos').insert([{
      concepto: nuevoGastoComp.concepto,
      monto: parseFloat(nuevoGastoComp.monto),
      periodo
    }])
    setNuevoGastoComp({ concepto: '', monto: '' })
    cargarTodo()
  }

  const borrarGastoComp = async (id) => {
    await supabase.from('gastos_compartidos').delete().eq('id', id)
    cargarTodo()
  }

  const agregarIngreso = async (e) => {
    e.preventDefault()
    if (!nuevoIngreso.descripcion || !nuevoIngreso.monto) return
    await supabase.from('ingresos').insert([{
      persona: nuevoIngreso.persona,
      descripcion: nuevoIngreso.descripcion,
      monto: parseFloat(nuevoIngreso.monto),
      periodo
    }])
    setNuevoIngreso({ persona: 'Catriel', descripcion: '', monto: '' })
    cargarTodo()
  }

  const agregarGastoPropio = async (e) => {
    e.preventDefault()
    if (!nuevoGastoPropio.descripcion || !nuevoGastoPropio.monto) return
    await supabase.from('gastos_propios').insert([{
      persona: nuevoGastoPropio.persona,
      descripcion: nuevoGastoPropio.descripcion,
      monto: parseFloat(nuevoGastoPropio.monto),
      periodo
    }])
    setNuevoGastoPropio({ persona: 'Catriel', descripcion: '', monto: '' })
    cargarTodo()
  }

  const agregarCombustible = async (e) => {
    e.preventDefault()
    if (!nuevoCombustible.monto) return
    await supabase.from('combustible').insert([{
      persona: nuevoCombustible.persona,
      monto: parseFloat(nuevoCombustible.monto),
      periodo
    }])
    setNuevoCombustible({ persona: 'Catriel', monto: '' })
    cargarTodo()
  }

  const guardarAhorro = async (persona, monto) => {
    await supabase.from('ahorros').upsert([{ persona, monto: parseFloat(monto) || 0 }], { onConflict: 'persona' })
    cargarTodo()
  }

  const agregarTarjeta = async (e) => {
    e.preventDefault()
    if (!nuevaTarjeta.nombre) return
    await supabase.from('tarjetas').insert([nuevaTarjeta])
    setNuevaTarjeta({ persona: 'Catriel', nombre: '' })
    cargarTodo()
  }

  // Cálculos
  const totalCompartidos = gastosCompartidos.reduce((acc, item) => acc + Number(item.monto), 0)
  const mitadCompartidos = totalCompartidos / 2

  const ingresosLisandro = ingresos.filter(i => i.persona === 'Lisandro').reduce((acc, i) => acc + Number(i.monto), 0)
  const ingresosCatriel = ingresos.filter(i => i.persona === 'Catriel').reduce((acc, i) => acc + Number(i.monto), 0)

  const gastosPropLisandro = gastosPropios.filter(g => g.persona === 'Lisandro').reduce((acc, g) => acc + Number(g.monto), 0)
  const gastosPropCatriel = gastosPropios.filter(g => g.persona === 'Catriel').reduce((acc, g) => acc + Number(g.monto), 0)

  const combustibleLisandro = combustible.filter(c => c.persona === 'Lisandro').reduce((acc, c) => acc + Number(c.monto), 0)
  const combustibleCatriel = combustible.filter(c => c.persona === 'Catriel').reduce((acc, c) => acc + Number(c.monto), 0)

  const tarjLisandro = tarjetas.filter(t => t.persona === 'Lisandro')
  const tarjCatriel = tarjetas.filter(t => t.persona === 'Catriel')

  const totalTarjLisandro = consumosTarjetas
    .filter(c => tarjLisandro.some(t => t.id === c.tarjeta_id))
    .reduce((acc, c) => acc + Number(c.monto_cuota), 0)

  const totalTarjCatriel = consumosTarjetas
    .filter(c => tarjCatriel.some(t => t.id === c.tarjeta_id))
    .reduce((acc, c) => acc + Number(c.monto_cuota), 0)

  const dispLisandro = ingresosLisandro - (mitadCompartidos + gastosPropLisandro + ahorros.Lisandro)
  const dispCatriel = ingresosCatriel - (mitadCompartidos + gastosPropCatriel + ahorros.Catriel)

  return (
    <div style={styles.appWrapper}>
      <div style={styles.appContainer}>
        {/* Encabezado */}
        <div style={styles.topHeader}>
          <div>
            <h1 style={styles.title}>🏠 Dashboard Financiero del Hogar</h1>
            <p style={styles.subtitle}>Vista Dividida: Lisandro (Izq) | Compartido (Centro) | Catriel (Der)</p>
          </div>
          <div style={styles.periodSelector}>
            <span>📅 Período:</span>
            <input
              type="month"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              style={styles.inputMonth}
            />
          </div>
        </div>

        {/* Grid 3 Columnas */}
        <div style={styles.mainGrid}>
          
          {/* LISANDRO */}
          <div style={styles.columnBlue}>
            <div style={styles.headerBlue}>
              <h2>👤 LISANDRO</h2>
            </div>

            <div style={styles.subGrid}>
              <div style={styles.boxLightBlue}>
                <span style={styles.boxTitle}>INGRESOS</span>
                <p style={styles.totText}>Tot: ${ingresosLisandro.toLocaleString()}</p>
              </div>
              <div style={styles.boxLightBlue}>
                <span style={styles.boxTitle}>🐷 AHORRO</span>
                <p style={{ ...styles.montoText, color: '#0284c7' }}>${ahorros.Lisandro.toLocaleString()}</p>
                <input
                  type="number"
                  placeholder="Editar $"
                  style={styles.inputMini}
                  onBlur={(e) => guardarAhorro('Lisandro', e.target.value)}
                />
              </div>
            </div>

            <div style={{ ...styles.boxLightBlue, marginTop: '8px' }}>
              <span style={styles.boxTitle}>GASTOS PROPIOS LISANDRO</span>
              <p style={{ textAlign: 'right', marginTop: '4px', fontSize: '12px' }}>
                Subtotal Propio: <strong>${gastosPropLisandro.toLocaleString()}</strong>
              </p>
            </div>

            <div style={styles.cardGroupTitle}>💳 Tarjetas de Lisandro</div>
            {tarjLisandro.length === 0 ? (
              <p style={styles.emptyText}>Sin tarjetas</p>
            ) : (
              tarjLisandro.map(t => (
                <div key={t.id} style={styles.cardItemBlue}>
                  <span>💳 <strong>{t.nombre}</strong></span>
                  <p style={{ fontSize: '11px', margin: '2px 0 0 0', color: '#64748b' }}>
                    Resumen Mes: <strong>${totalTarjLisandro.toLocaleString()}</strong>
                  </p>
                </div>
              ))
            )}
          </div>

          {/* COMPARTIDO */}
          <div style={styles.columnYellow}>
            <div style={styles.headerYellow}>
              <h2>🤝 GASTOS COMPARTIDOS (50 / 50)</h2>
            </div>

            <table style={styles.tableYellow}>
              <thead>
                <tr>
                  <th>Concepto</th>
                  <th style={{ textAlign: 'right' }}>Monto Total</th>
                </tr>
              </thead>
              <tbody>
                {gastosCompartidos.map(g => (
                  <tr key={g.id}>
                    <td>{g.concepto}</td>
                    <td style={{ textAlign: 'right', color: '#b45309', fontWeight: 'bold' }}>
                      ${Number(g.monto).toLocaleString()}
                      <button onClick={() => borrarGastoComp(g.id)} style={styles.btnIcon}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={styles.summaryYellowBox}>
              <div style={styles.rowFlex}>
                <span>Total Compartidos:</span>
                <strong>${totalCompartidos.toLocaleString()}</strong>
              </div>
              <div style={{ ...styles.rowFlex, color: '#b45309', marginTop: '2px' }}>
                <span>Corresponde a CADA UNO (50%):</span>
                <strong>${mitadCompartidos.toLocaleString()}</strong>
              </div>
            </div>

            <form onSubmit={agregarGastoComp} style={{ ...styles.rowFlex, gap: '4px', marginTop: '8px' }}>
              <input
                type="text"
                placeholder="Ej: Alquiler"
                value={nuevoGastoComp.concepto}
                onChange={e => setNuevoGastoComp({ ...nuevoGastoComp, concepto: e.target.value })}
                style={styles.inputFlex}
              />
              <input
                type="number"
                placeholder="$ Total"
                value={nuevoGastoComp.monto}
                onChange={e => setNuevoGastoComp({ ...nuevoGastoComp, monto: e.target.value })}
                style={{ ...styles.inputFlex, maxWidth: '80px' }}
              />
              <button type="submit" style={styles.btnOrange}>+</button>
            </form>
          </div>

          {/* CATRIEL */}
          <div style={styles.columnGreen}>
            <div style={styles.headerGreen}>
              <h2>👤 CATRIEL</h2>
            </div>

            <div style={styles.subGrid}>
              <div style={styles.boxLightGreen}>
                <span style={styles.boxTitle}>💵 INGRESOS</span>
                <p style={styles.totText}>Tot: ${ingresosCatriel.toLocaleString()}</p>
              </div>
              <div style={styles.boxLightGreen}>
                <span style={styles.boxTitle}>🐷 AHORRO</span>
                <p style={{ ...styles.montoText, color: '#16a34a' }}>${ahorros.Catriel.toLocaleString()}</p>
                <input
                  type="number"
                  placeholder="Editar $"
                  style={styles.inputMini}
                  onBlur={(e) => guardarAhorro('Catriel', e.target.value)}
                />
              </div>
            </div>

            <div style={{ ...styles.boxLightGreen, marginTop: '8px' }}>
              <span style={styles.boxTitle}>GASTOS PROPIOS CATRIEL</span>
              <p style={{ textAlign: 'right', marginTop: '4px', fontSize: '12px' }}>
                Subtotal Propio: <strong>${gastosPropCatriel.toLocaleString()}</strong>
              </p>
            </div>

            <div style={styles.cardGroupTitleGreen}>💳 Tarjetas de Catriel</div>
            {tarjCatriel.length === 0 ? (
              <p style={styles.emptyText}>Sin tarjetas</p>
            ) : (
              tarjCatriel.map(t => (
                <div key={t.id} style={styles.cardItemGreen}>
                  <span>💳 <strong>{t.nombre}</strong></span>
                  <p style={{ fontSize: '11px', margin: '2px 0 0 0', color: '#64748b' }}>
                    Resumen Mes: <strong>${totalTarjCatriel.toLocaleString()}</strong>
                  </p>
                </div>
              ))
            )}
          </div>

        </div>

        {/* Inferiores */}
        <div style={styles.bottomSection}>
          
          <div style={styles.grid2Col}>
            <div style={{ ...styles.cardWhite, border: '1px solid #fdba74' }}>
              <h4 style={{ color: '#c2410c', margin: '0 0 6px 0', fontSize: '13px' }}>⛽ GASTOS DE COMBUSTIBLE</h4>
              <div style={styles.rowFlex}>
                <div style={styles.boxMiniOrange}>Combustible Lisandro: <strong>${combustibleLisandro.toLocaleString()}</strong></div>
                <div style={styles.boxMiniOrange}>Combustible Catriel: <strong>${combustibleCatriel.toLocaleString()}</strong></div>
              </div>
              <form onSubmit={agregarCombustible} style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                <select value={nuevoCombustible.persona} onChange={e => setNuevoCombustible({ ...nuevoCombustible, persona: e.target.value })} style={styles.selectStyle}>
                  <option value="Catriel">Catriel</option>
                  <option value="Lisandro">Lisandro</option>
                </select>
                <input type="number" placeholder="$ Monto" value={nuevoCombustible.monto} onChange={e => setNuevoCombustible({ ...nuevoCombustible, monto: e.target.value })} style={styles.inputFlex} />
                <button type="submit" style={styles.btnOrange}>+ Cargar</button>
              </form>
            </div>

            <div style={styles.balanceNetoCard}>
              <h3 style={{ textAlign: 'center', margin: '0 0 8px 0', fontSize: '14px' }}>💰 BALANCE NETO DEL MES</h3>
              <div style={styles.rowFlex}>
                <div style={styles.balanceColBlue}>
                  <h4 style={{ color: '#0284c7', margin: 0, fontSize: '12px' }}>LISANDRO</h4>
                  <p style={{ margin: '2px 0', fontSize: '12px' }}>Ingresos: ${ingresosLisandro.toLocaleString()}</p>
                  <p style={{ margin: '2px 0', fontSize: '12px' }}>Gastos: ${mitadCompartidos.toLocaleString()}</p>
                  <p style={{ margin: '2px 0', fontSize: '12px' }}>DISPONIBLE: <strong style={{ color: dispLisandro < 0 ? '#ef4444' : '#22c55e' }}>${dispLisandro.toLocaleString()}</strong></p>
                </div>
                <div style={styles.balanceColGreen}>
                  <h4 style={{ color: '#16a34a', margin: 0, fontSize: '12px' }}>CATRIEL</h4>
                  <p style={{ margin: '2px 0', fontSize: '12px' }}>Ingresos: ${ingresosCatriel.toLocaleString()}</p>
                  <p style={{ margin: '2px 0', fontSize: '12px' }}>Gastos: ${mitadCompartidos.toLocaleString()}</p>
                  <p style={{ margin: '2px 0', fontSize: '12px' }}>DISPONIBLE: <strong style={{ color: dispCatriel < 0 ? '#ef4444' : '#22c55e' }}>${dispCatriel.toLocaleString()}</strong></p>
                </div>
              </div>
            </div>
          </div>

          <div style={{ ...styles.grid3Col, marginTop: '12px' }}>
            <form onSubmit={agregarIngreso} style={styles.cardWhite}>
              <h4 style={styles.formTitle}>➕ Cargar Ingreso</h4>
              <select value={nuevoIngreso.persona} onChange={e => setNuevoIngreso({ ...nuevoIngreso, persona: e.target.value })} style={styles.selectFull}>
                <option value="Catriel">Para Catriel</option>
                <option value="Lisandro">Para Lisandro</option>
              </select>
              <input type="text" placeholder="Descripción" value={nuevoIngreso.descripcion} onChange={e => setNuevoIngreso({ ...nuevoIngreso, descripcion: e.target.value })} style={styles.inputFull} />
              <input type="number" placeholder="$ Monto" value={nuevoIngreso.monto} onChange={e => setNuevoIngreso({ ...nuevoIngreso, monto: e.target.value })} style={styles.inputFull} />
              <button type="submit" style={styles.btnBlueFull}>+ Guardar Ingreso</button>
            </form>

            <form onSubmit={agregarGastoPropio} style={styles.cardWhite}>
              <h4 style={styles.formTitle}>➕ Cargar Gasto Propio</h4>
              <select value={nuevoGastoPropio.persona} onChange={e => setNuevoGastoPropio({ ...nuevoGastoPropio, persona: e.target.value })} style={styles.selectFull}>
                <option value="Catriel">De Catriel</option>
                <option value="Lisandro">De Lisandro</option>
              </select>
              <input type="text" placeholder="Descripción" value={nuevoGastoPropio.descripcion} onChange={e => setNuevoGastoPropio({ ...nuevoGastoPropio, descripcion: e.target.value })} style={styles.inputFull} />
              <input type="number" placeholder="$ Monto" value={nuevoGastoPropio.monto} onChange={e => setNuevoGastoPropio({ ...nuevoGastoPropio, monto: e.target.value })} style={styles.inputFull} />
              <button type="submit" style={styles.btnBlueFull}>+ Guardar Gasto</button>
            </form>

            <form onSubmit={agregarTarjeta} style={styles.cardWhite}>
              <h4 style={styles.formTitle}>💳 Crear Tarjeta</h4>
              <select value={nuevaTarjeta.persona} onChange={e => setNuevaTarjeta({ ...nuevaTarjeta, persona: e.target.value })} style={styles.selectFull}>
                <option value="Catriel">Para Catriel</option>
                <option value="Lisandro">Para Lisandro</option>
              </select>
              <input type="text" placeholder="Nombre (ej: NACION VISA)" value={nuevaTarjeta.nombre} onChange={e => setNuevaTarjeta({ ...nuevaTarjeta, nombre: e.target.value })} style={styles.inputFull} />
              <button type="submit" style={styles.btnBlueFull}>+ Crear Tarjeta</button>
            </form>
          </div>

        </div>
      </div>
    </div>
  )
}

const styles = {
  appWrapper: { backgroundColor: '#f1f5f9', minHeight: '100vh', display: 'flex', justifyContent: 'center', padding: '16px 10px' },
  appContainer: { maxWidth: '1200px', width: '100%', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#334155' },
  topHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: '12px 20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '14px' },
  title: { fontSize: '18px', margin: 0, color: '#0f172a' },
  subtitle: { fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' },
  periodSelector: { backgroundColor: '#f8fafc', padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' },
  inputMonth: { border: 'none', background: 'transparent', marginLeft: '6px', fontWeight: 'bold' },
  mainGrid: { display: 'grid', gridTemplateColumns: '1fr 1.15fr 1fr', gap: '12px' },
  columnBlue: { backgroundColor: '#e0f2fe', borderRadius: '14px', padding: '12px', border: '1px solid #38bdf8' },
  headerBlue: { color: '#0369a1', marginBottom: '8px', fontSize: '14px' },
  subGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' },
  boxLightBlue: { backgroundColor: '#fff', padding: '8px', borderRadius: '8px', border: '1px solid #bae6fd' },
  cardItemBlue: { backgroundColor: '#fff', padding: '6px 8px', borderRadius: '6px', marginTop: '6px', border: '1px solid #bae6fd' },
  columnYellow: { backgroundColor: '#fef9c3', borderRadius: '14px', padding: '12px', border: '1px solid #fde047' },
  headerYellow: { color: '#a16207', marginBottom: '8px', fontSize: '14px' },
  tableYellow: { width: '100%', borderCollapse: 'collapse', fontSize: '12px' },
  summaryYellowBox: { backgroundColor: '#fef08a', padding: '8px', borderRadius: '6px', marginTop: '8px', fontSize: '12px' },
  columnGreen: { backgroundColor: '#dcfce7', borderRadius: '14px', padding: '12px', border: '1px solid #4ade80' },
  headerGreen: { color: '#15803d', marginBottom: '8px', fontSize: '14px' },
  boxLightGreen: { backgroundColor: '#fff', padding: '8px', borderRadius: '8px', border: '1px solid #bbf7d0' },
  cardItemGreen: { backgroundColor: '#fff', padding: '6px 8px', borderRadius: '6px', marginTop: '6px', border: '1px solid #bbf7d0' },
  boxTitle: { fontSize: '10px', fontWeight: 'bold', color: '#64748b' },
  totText: { fontSize: '12px', fontWeight: 'bold', margin: '4px 0 0 0' },
  montoText: { fontSize: '15px', fontWeight: 'bold', margin: '2px 0' },
  inputMini: { width: '100%', padding: '2px 4px', fontSize: '10px', borderRadius: '4px', border: '1px solid #cbd5e1' },
  cardGroupTitle: { fontSize: '12px', fontWeight: 'bold', color: '#0369a1', marginTop: '12px' },
  cardGroupTitleGreen: { fontSize: '12px', fontWeight: 'bold', color: '#15803d', marginTop: '12px' },
  emptyText: { fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' },
  rowFlex: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  btnIcon: { background: 'none', border: 'none', cursor: 'pointer', marginLeft: '4px', fontSize: '12px' },
  inputFlex: { padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', flex: 1 },
  btnOrange: { backgroundColor: '#d97706', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' },
  bottomSection: { marginTop: '14px' },
  grid2Col: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  grid3Col: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' },
  cardWhite: { backgroundColor: '#fff', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' },
  boxMiniOrange: { backgroundColor: '#ffedd5', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', width: '48%' },
  balanceNetoCard: { backgroundColor: '#fff', padding: '12px', borderRadius: '12px', border: '1.5px solid #0f172a' },
  balanceColBlue: { backgroundColor: '#f0f9ff', padding: '8px', borderRadius: '6px', width: '48%' },
  balanceColGreen: { backgroundColor: '#f0fdf4', padding: '8px', borderRadius: '6px', width: '48%' },
  selectStyle: { padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff', fontSize: '12px' },
  selectFull: { width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff', fontSize: '12px', marginTop: '4px' },
  inputFull: { width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', marginTop: '4px', boxSizing: 'border-box' },
  btnBlueFull: { width: '100%', backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '6px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px', marginTop: '6px' },
  formTitle: { fontSize: '12px', margin: '0 0 4px 0', color: '#1e293b' }
}
