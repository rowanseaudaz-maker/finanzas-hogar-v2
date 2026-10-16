import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function App() {
  const [periodo, setPeriodo] = useState('2026-10')
  const [cargando, setCargando] = useState(true)

  // Datos de la base
  const [ingresos, setIngresos] = useState([])
  const [ahorros, setAhorros] = useState({ Lisandro: 0, Catriel: 0 })
  const [gastosPropios, setGastosPropios] = useState([])
  const [gastosCompartidos, setGastosCompartidos] = useState([])
  const [tarjetas, setTarjetas] = useState([])
  const [consumosTarjetas, setConsumosTarjetas] = useState([])
  const [prestamos, setPrestamos] = useState([])
  const [combustible, setCombustible] = useState([])

  // Formularios
  const [nuevoGastoCompartido, setNuevoGastoCompartido] = useState({ concepto: '', monto: '' })
  const [nuevoIngreso, setNuevoIngreso] = useState({ persona: 'Catriel', descripcion: '', monto: '' })
  const [nuevoGastoPropio, setNuevoGastoPropio] = useState({ persona: 'Catriel', descripcion: '', monto: '' })
  const [nuevaTarjeta, setNuevaTarjeta] = useState({ persona: 'Catriel', nombre: '' })
  const [nuevoConsumo, setNuevoConsumo] = useState({
    realiza: 'Catriel',
    tarjetaId: '',
    descripcion: '',
    montoCuota: '',
    cuotaActual: 1,
    totalCuotas: 1,
    quienPaga: 'Catriel'
  })
  const [nuevoPrestamo, setNuevoPrestamo] = useState({
    entidad: '',
    montoCuota: '',
    cuotaActual: 1,
    totalCuotas: 12,
    tipo: 'Compartido (Centro)'
  })

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

      const { data: prest } = await supabase.from('prestamos').select('*')
      setPrestamos(prest || [])

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

  // Operaciones DB
  const agregarGastoCompartido = async (e) => {
    e.preventDefault()
    if (!nuevoGastoCompartido.concepto || !nuevoGastoCompartido.monto) return
    await supabase.from('gastos_compartidos').insert([{
      concepto: nuevoGastoCompartido.concepto,
      monto: parseFloat(nuevoGastoCompartido.monto),
      periodo
    }])
    setNuevoGastoCompartido({ concepto: '', monto: '' })
    cargarTodo()
  }

  const borrarGastoCompartido = async (id) => {
    await supabase.from('gastos_compartidos').delete().eq('id', id)
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

  const agregarConsumo = async (e) => {
    e.preventDefault()
    if (!nuevoConsumo.tarjetaId || !nuevoConsumo.montoCuota) return
    await supabase.from('consumos_tarjetas').insert([{
      tarjeta_id: nuevoConsumo.tarjetaId,
      realiza: nuevoConsumo.realiza,
      descripcion: nuevoConsumo.descripcion,
      monto_cuota: parseFloat(nuevoConsumo.montoCuota),
      cuota_actual: parseInt(nuevoConsumo.cuotaActual),
      total_cuotas: parseInt(nuevoConsumo.totalCuotas),
      quien_paga: nuevoConsumo.quienPaga,
      periodo
    }])
    setNuevoConsumo({ ...nuevoConsumo, descripcion: '', montoCuota: '' })
    cargarTodo()
  }

  const agregarPrestamo = async (e) => {
    e.preventDefault()
    if (!nuevoPrestamo.entidad || !nuevoPrestamo.montoCuota) return
    await supabase.from('prestamos').insert([{
      entidad: nuevoPrestamo.entidad,
      monto_cuota: parseFloat(nuevoPrestamo.montoCuota),
      cuota_actual: parseInt(nuevoPrestamo.cuotaActual),
      total_cuotas: parseInt(nuevoPrestamo.totalCuotas),
      tipo: nuevoPrestamo.tipo,
      periodo
    }])
    setNuevoPrestamo({ ...nuevoPrestamo, entidad: '', montoCuota: '' })
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

  // Totales Tarjetas
  const tarjLisandro = tarjetas.filter(t => t.persona === 'Lisandro')
  const tarjCatriel = tarjetas.filter(t => t.persona === 'Catriel')

  const totalTarjLisandro = consumosTarjetas
    .filter(c => tarjLisandro.some(t => t.id === c.tarjeta_id))
    .reduce((acc, c) => acc + Number(c.monto_cuota), 0)

  const totalTarjCatriel = consumosTarjetas
    .filter(c => tarjCatriel.some(t => t.id === c.tarjeta_id))
    .reduce((acc, c) => acc + Number(c.monto_cuota), 0)

  const tarjCompLisandro = consumosTarjetas
    .filter(c => c.quien_paga === 'Compartido' && tarjLisandro.some(t => t.id === c.tarjeta_id))
    .reduce((acc, c) => acc + Number(c.monto_cuota), 0)

  const tarjCompCatriel = consumosTarjetas
    .filter(c => c.quien_paga === 'Compartido' && tarjCatriel.some(t => t.id === c.tarjeta_id))
    .reduce((acc, c) => acc + Number(c.monto_cuota), 0)

  const mitadTarjComp = (tarjCompLisandro + tarjCompCatriel) / 2

  const dispLisandro = ingresosLisandro - (mitadCompartidos + gastosPropLisandro + ahorros.Lisandro)
  const dispCatriel = ingresosCatriel - (mitadCompartidos + gastosPropCatriel + ahorros.Catriel)

  return (
    <div style={styles.appContainer}>
      {/* Header */}
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

      {/* Grid de 3 Columnas Principal */}
      <div style={styles.mainGrid}>
        
        {/* COLUMNA LISANDRO (AZUL) */}
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

          <div style={{ ...styles.boxLightBlue, marginTop: '12px' }}>
            <span style={styles.boxTitle}>GASTOS PROPIOS LISANDRO</span>
            <p style={{ textAlign: 'right', marginTop: '10px', fontSize: '13px' }}>
              Subtotal Propio: <strong>${gastosPropLisandro.toLocaleString()}</strong>
            </p>
          </div>

          <div style={styles.cardGroupTitle}>💳 Tarjetas de Lisandro</div>
          {tarjLisandro.length === 0 ? (
            <p style={styles.emptyText}>No hay tarjetas creadas</p>
          ) : (
            tarjLisandro.map(t => (
              <div key={t.id} style={styles.cardItemBlue}>
                <span>💳 <strong>{t.nombre}</strong></span>
                <p style={{ fontSize: '12px', margin: '4px 0 0 0', color: '#64748b' }}>
                  Total Resumen Mes: <strong>${totalTarjLisandro.toLocaleString()}</strong>
                </p>
              </div>
            ))
          )}
        </div>

        {/* COLUMNA COMPARTIDO (AMARILLO) */}
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
                    <button onClick={() => borrarGastoCompartido(g.id)} style={styles.btnIcon}>🗑️</button>
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
            <div style={{ ...styles.rowFlex, color: '#b45309', marginTop: '4px' }}>
              <span>Corresponde a CADA UNO (50%):</span>
              <strong>${mitadCompartidos.toLocaleString()}</strong>
            </div>
          </div>

          <form onSubmit={agregarGastoCompartido} style={{ ...styles.rowFlex, gap: '6px', marginTop: '12px' }}>
            <input
              type="text"
              placeholder="Ej: Alquiler"
              value={nuevoGastoCompartido.concepto}
              onChange={e => setNuevoGastoCompartido({ ...nuevoGastoCompartido, concepto: e.target.value })}
              style={styles.inputFlex}
            />
            <input
              type="number"
              placeholder="$ Total"
              value={nuevoGastoCompartido.monto}
              onChange={e => setNuevoGastoCompartido({ ...nuevoGastoCompartido, monto: e.target.value })}
              style={{ ...styles.inputFlex, maxWidth: '90px' }}
            />
            <button type="submit" style={styles.btnOrange}>+</button>
          </form>

          {/* Tarjetas Compartidas */}
          <div style={{ marginTop: '20px', borderTop: '1px solid #fef08a', paddingTop: '15px' }}>
            <h4 style={{ margin: '0 0 10px 0' }}>💳 Gastos Tarjetas Compartidos</h4>
            <div style={styles.infoRowLightBlue}>
              <span>En tarjetas de Lisandro:</span>
              <strong>${tarjCompLisandro.toLocaleString()}</strong>
            </div>
            <div style={{ ...styles.infoRowLightGreen, marginTop: '6px' }}>
              <span>En tarjetas de Catriel:</span>
              <strong>${tarjCompCatriel.toLocaleString()}</strong>
            </div>
            <div style={styles.infoRowLightYellow}>
              <span>Corresponde pagar a CADA UNO (50%):</span>
              <strong>${mitadTarjComp.toLocaleString()}</strong>
            </div>
            <div style={styles.statusBoxOk}>
              ⚖️ LIQUIDACIÓN DE TARJETAS COMPARTIDAS<br />
              <strong>¡Las tarjetas compartidas están 100% al día!</strong>
            </div>
          </div>
        </div>

        {/* COLUMNA CATRIEL (VERDE) */}
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

          <div style={{ ...styles.boxLightGreen, marginTop: '12px' }}>
            <span style={styles.boxTitle}>GASTOS PROPIOS CATRIEL</span>
            <p style={{ textAlign: 'right', marginTop: '10px', fontSize: '13px' }}>
              Subtotal Propio: <strong>${gastosPropCatriel.toLocaleString()}</strong>
            </p>
          </div>

          <div style={styles.cardGroupTitleGreen}>💳 Tarjetas de Catriel</div>
          {tarjCatriel.length === 0 ? (
            <p style={styles.emptyText}>No hay tarjetas creadas</p>
          ) : (
            tarjCatriel.map(t => (
              <div key={t.id} style={styles.cardItemGreen}>
                <span>💳 <strong>{t.nombre}</strong></span>
                <p style={{ fontSize: '12px', margin: '4px 0 0 0', color: '#64748b' }}>
                  Total Resumen Mes: <strong>${totalTarjCatriel.toLocaleString()}</strong>
                </p>
              </div>
            ))
          )}
        </div>

      </div>

      {/* PANELES INFERIORES */}
      <div style={styles.bottomSection}>
        
        {/* Cargo Justo y Combustible */}
        <div style={styles.grid2Col}>
          <div style={styles.cardWhite}>
            <h4>📊 Cargo Justo de Tarjetas (Solo Gastos Propios)</h4>
            <div style={styles.rowFlex}>
              <div style={styles.boxMiniBlue}>
                <span style={{ fontSize: '12px' }}>LISANDRO (PROPIO)</span>
                <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#0284c7', margin: '4px 0' }}>$0</p>
                <small style={{ color: '#94a3b8' }}>Sin consumos propios</small>
              </div>
              <div style={styles.boxMiniGreen}>
                <span style={{ fontSize: '12px' }}>CATRIEL (PROPIO)</span>
                <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#16a34a', margin: '4px 0' }}>$0</p>
                <small style={{ color: '#94a3b8' }}>Sin consumos propios</small>
              </div>
            </div>
          </div>

          <div style={{ ...styles.cardWhite, border: '1px solid #fdba74' }}>
            <h4 style={{ color: '#c2410c' }}>⛽ GASTOS DE COMBUSTIBLE</h4>
            <div style={styles.rowFlex}>
              <div style={styles.boxMiniOrange}>
                <span>Combustible Lisandro:</span>
                <p style={{ color: '#c2410c', fontWeight: 'bold', margin: '4px 0' }}>${combustibleLisandro.toLocaleString()}</p>
              </div>
              <div style={styles.boxMiniOrange}>
                <span>Combustible Catriel:</span>
                <p style={{ color: '#c2410c', fontWeight: 'bold', margin: '4px 0' }}>${combustibleCatriel.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* BALANCE NETO DEL MES */}
        <div style={styles.balanceNetoCard}>
          <h3 style={{ textAlign: 'center', margin: '0 0 15px 0' }}>💰 BALANCE NETO DEL MES</h3>
          <div style={styles.rowFlex}>
            <div style={styles.balanceColBlue}>
              <h4 style={{ color: '#0284c7', margin: '0 0 8px 0' }}>LISANDRO</h4>
              <p>Ingresos: <strong>${ingresosLisandro.toLocaleString()}</strong></p>
              <p>Gastos: <strong style={{ color: '#ef4444' }}>${mitadCompartidos.toLocaleString()}</strong></p>
              <p>Ahorro: <strong>${ahorros.Lisandro.toLocaleString()}</strong></p>
              <hr />
              <p style={{ fontSize: '15px' }}>
                DISPONIBLE: <strong style={{ color: dispLisandro < 0 ? '#ef4444' : '#22c55e' }}>${dispLisandro.toLocaleString()}</strong>
              </p>
            </div>

            <div style={styles.balanceColGreen}>
              <h4 style={{ color: '#16a34a', margin: '0 0 8px 0' }}>CATRIEL</h4>
              <p>Ingresos: <strong>${ingresosCatriel.toLocaleString()}</strong></p>
              <p>Gastos: <strong style={{ color: '#ef4444' }}>${mitadCompartidos.toLocaleString()}</strong></p>
              <p>Ahorro: <strong>${ahorros.Catriel.toLocaleString()}</strong></p>
              <hr />
              <p style={{ fontSize: '15px' }}>
                DISPONIBLE: <strong style={{ color: dispCatriel < 0 ? '#ef4444' : '#22c55e' }}>${dispCatriel.toLocaleString()}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* FORMULARIOS DE CARGA */}
        <div style={{ ...styles.cardWhite, border: '2px solid #c084fc', marginTop: '20px' }}>
          <h4 style={{ color: '#7e22ce' }}>🏛️ Cargar Nuevo Préstamo / Crédito</h4>
          <form onSubmit={agregarPrestamo} style={{ ...styles.rowFlex, gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
            <input type="text" placeholder="Entidad (ej: Banco Hipotecario)" value={nuevoPrestamo.entidad} onChange={e => setNuevoPrestamo({ ...nuevoPrestamo, entidad: e.target.value })} style={styles.inputFlex} />
            <input type="number" placeholder="$ Cuota" value={nuevoPrestamo.montoCuota} onChange={e => setNuevoPrestamo({ ...nuevoPrestamo, montoCuota: e.target.value })} style={{ ...styles.inputFlex, maxWidth: '100px' }} />
            <input type="number" value={nuevoPrestamo.cuotaActual} onChange={e => setNuevoPrestamo({ ...nuevoPrestamo, cuotaActual: e.target.value })} style={{ ...styles.inputFlex, maxWidth: '60px' }} />
            <input type="number" value={nuevoPrestamo.totalCuotas} onChange={e => setNuevoPrestamo({ ...nuevoPrestamo, totalCuotas: e.target.value })} style={{ ...styles.inputFlex, maxWidth: '60px' }} />
            <select value={nuevoPrestamo.tipo} onChange={e => setNuevoPrestamo({ ...nuevoPrestamo, tipo: e.target.value })} style={styles.selectStyle}>
              <option value="Compartido (Centro)">Compartido (Centro)</option>
              <option value="Lisandro">Lisandro</option>
              <option value="Catriel">Catriel</option>
            </select>
            <button type="submit" style={styles.btnPurple}>+ Cargar Préstamo</button>
          </form>
        </div>

        <div style={{ ...styles.cardWhite, marginTop: '15px' }}>
          <h4>💳 Cargar Nuevo Consumo con Tarjeta</h4>
          <form onSubmit={agregarConsumo} style={{ marginTop: '10px' }}>
            <div style={{ ...styles.rowFlex, gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
              <span>1. ¿Quién realiza el gasto?:</span>
              <select value={nuevoConsumo.realiza} onChange={e => setNuevoConsumo({ ...nuevoConsumo, realiza: e.target.value })} style={styles.selectStyle}>
                <option value="Catriel">Catriel</option>
                <option value="Lisandro">Lisandro</option>
              </select>

              <span>2. Elegir Tarjeta:</span>
              <select value={nuevoConsumo.tarjetaId} onChange={e => setNuevoConsumo({ ...nuevoConsumo, tarjetaId: e.target.value })} style={styles.selectStyle}>
                <option value="">-- Seleccionar --</option>
                {tarjetas.map(t => <option key={t.id} value={t.id}>{t.persona} - {t.nombre}</option>)}
              </select>
            </div>

            <div style={{ ...styles.rowFlex, gap: '8px', flexWrap: 'wrap' }}>
              <input type="text" placeholder="Descripción del gasto" value={nuevoConsumo.descripcion} onChange={e => setNuevoConsumo({ ...nuevoConsumo, descripcion: e.target.value })} style={styles.inputFlex} />
              <input type="number" placeholder="$ Monto por cuota" value={nuevoConsumo.montoCuota} onChange={e => setNuevoConsumo({ ...nuevoConsumo, montoCuota: e.target.value })} style={{ ...styles.inputFlex, maxWidth: '140px' }} />
              <button type="submit" style={styles.btnBlue}>+ Cargar Consumo</button>
            </div>
          </form>
        </div>

        <div style={{ ...styles.grid3Col, marginTop: '15px' }}>
          <form onSubmit={agregarTarjeta} style={styles.cardWhite}>
            <h4>💳 Crear Nueva Tarjeta</h4>
            <select value={nuevaTarjeta.persona} onChange={e => setNuevaTarjeta({ ...nuevaTarjeta, persona: e.target.value })} style={{ ...styles.selectStyle, width: '100%', marginTop: '8px' }}>
              <option value="Catriel">Para Catriel</option>
              <option value="Lisandro">Para Lisandro</option>
            </select>
            <input type="text" placeholder="Nombre (ej. NACION - VISA)" value={nuevaTarjeta.nombre} onChange={e => setNuevaTarjeta({ ...nuevaTarjeta, nombre: e.target.value })} style={{ ...styles.inputFlex, width: '100%', marginTop: '8px' }} />
            <button type="submit" style={{ ...styles.btnBlue, width: '100%', marginTop: '8px' }}>+ Crear Tarjeta</button>
          </form>

          <div style={styles.cardWhite}>
            <h4>➕ Cargar Nuevo Ingreso</h4>
            <select style={{ ...styles.selectStyle, width: '100%', marginTop: '8px' }}>
              <option>Para Catriel</option>
              <option>Para Lisandro</option>
            </select>
            <input type="text" placeholder="Descripción" style={{ ...styles.inputFlex, width: '100%', marginTop: '8px' }} />
          </div>

          <div style={styles.cardWhite}>
            <h4>➕ Cargar Gasto Propio</h4>
            <select style={{ ...styles.selectStyle, width: '100%', marginTop: '8px' }}>
              <option>De Catriel</option>
              <option>De Lisandro</option>
            </select>
            <input type="text" placeholder="Descripción" style={{ ...styles.inputFlex, width: '100%', marginTop: '8px' }} />
          </div>
        </div>

      </div>
    </div>
  )
}

const styles = {
  appContainer: {
    backgroundColor: '#f1f5f9',
    minHeight: '100vh',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#334155',
  },
  topHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: '16px 24px',
    borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    marginBottom: '20px',
  },
  title: { fontSize: '20px', margin: 0, color: '#0f172a' },
  subtitle: { fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' },
  periodSelector: { backgroundColor: '#f8fafc', padding: '8px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' },
  inputMonth: { border: 'none', background: 'transparent', marginLeft: '6px', fontWeight: 'bold' },
  mainGrid: { display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: '16px' },
  
  // Columna Azul
  columnBlue: { backgroundColor: '#e0f2fe', borderRadius: '16px', padding: '16px', border: '1px solid #38bdf8' },
  headerBlue: { color: '#0369a1', marginBottom: '12px' },
  subGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' },
  boxLightBlue: { backgroundColor: '#fff', padding: '12px', borderRadius: '10px', border: '1px solid #bae6fd' },
  cardItemBlue: { backgroundColor: '#fff', padding: '10px', borderRadius: '8px', marginTop: '8px', border: '1px solid #bae6fd' },

  // Columna Amarilla
  columnYellow: { backgroundColor: '#fef9c3', borderRadius: '16px', padding: '16px', border: '1px solid #fde047' },
  headerYellow: { color: '#a16207', marginBottom: '12px' },
  tableYellow: { width: '100%', borderCollapse: 'collapse', fontSize: '14px' },
  summaryYellowBox: { backgroundColor: '#fef08a', padding: '12px', borderRadius: '8px', marginTop: '12px' },

  // Columna Verde
  columnGreen: { backgroundColor: '#dcfce7', borderRadius: '16px', padding: '16px', border: '1px solid #4ade80' },
  headerGreen: { color: '#15803d', marginBottom: '12px' },
  boxLightGreen: { backgroundColor: '#fff', padding: '12px }
