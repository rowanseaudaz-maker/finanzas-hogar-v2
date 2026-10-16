import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function App() {
  const [periodo, setPeriodo] = useState('2026-10')
  const [cargando, setCargando] = useState(true)

  // ESTADOS DE DATOS
  const [ingresos, setIngresos] = useState([])
  const [ahorros, setAhorros] = useState({ Lisandro: 0, Catriel: 0 })
  const [gastosPropios, setGastosPropios] = useState([])
  const [gastosCompartidos, setGastosCompartidos] = useState([])
  const [tarjetas, setTarjetas] = useState([])
  const [consumosTarjetas, setConsumosTarjetas] = useState([])
  const [combustibleManual, setCombustibleManual] = useState([])
  const [pagosEstado, setPagosEstado] = useState({}) // Estado local/persistente de pagos por ítem (id_periodo -> boolean)

  // FORMULARIOS
  const [nuevoGastoComp, setNuevoGastoComp] = useState({ concepto: '', monto: '' })
  const [nuevoIngreso, setNuevoIngreso] = useState({ persona: 'Catriel', descripcion: '', monto: '' })
  const [nuevoGastoPropio, setNuevoGastoPropio] = useState({ persona: 'Catriel', descripcion: '', monto: '' })
  const [nuevaTarjeta, setNuevaTarjeta] = useState({ persona: 'Catriel', nombre: '' })
  const [nuevoCombustible, setNuevoCombustible] = useState({ persona: 'Catriel', monto: '' })
  
  // CONSUMO TARJETA
  const [nuevoConsumo, setNuevoConsumo] = useState({
    realiza: 'Catriel',
    tarjetaId: '',
    descripcion: '',
    montoCuota: '',
    cuotaInicial: 1,
    totalCuotas: 1,
    quienPagaOption: 'Catriel',
    quienPagaOtro: ''
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

      const { data: comb } = await supabase.from('combustible').select('*')
      setCombustibleManual(comb || [])

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

  // CÁLCULO DINÁMICO DE CUOTAS
  const calcularCuotaMes = (consumo) => {
    if (!consumo.periodo) return { cuotaActual: consumo.cuota_actual || 1, activa: true }
    
    const [yearInicio, monthInicio] = consumo.periodo.split('-').map(Number)
    const [yearActual, monthActual] = periodo.split('-').map(Number)
    
    const diffMeses = (yearActual - yearInicio) * 12 + (monthActual - monthInicio)
    const cuotaCalculada = (consumo.cuota_actual || 1) + diffMeses

    const activa = cuotaCalculada >= 1 && cuotaCalculada <= consumo.total_cuotas
    return { cuotaActual: cuotaCalculada, activa }
  }

  // MANEJO DE ESTADO DE PAGO (PAGADO / PENDIENTE)
  const togglePago = (tipo, id) => {
    const key = `${tipo}_${id}_${periodo}`
    setPagosEstado(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const estaPagado = (tipo, id) => {
    return !!pagosEstado[`${tipo}_${id}_${periodo}`]
  }

  // ACCIONES BASE DE DATOS

  const agregarGastoComp = async (e) => {
    e.preventDefault()
    if (!nuevoGastoComp.concepto || !nuevoGastoComp.monto) return
    await supabase.from('gastos_compartidos').insert([{
      concepto: nuevoGastoComp.concepto,
      monto: parseFloat(nuevoGastoComp.monto),
      periodo: 'fijo'
    }])
    setNuevoGastoComp({ concepto: '', monto: '' })
    cargarTodo()
  }

  const borrarItem = async (tabla, id) => {
    await supabase.from(tabla).delete().eq('id', id)
    cargarTodo()
  }

  const editarItemPrompt = async (tabla, id, campoActual, valorActual) => {
    const nuevoValor = prompt(`Editar ${campoActual}:`, valorActual)
    if (nuevoValor === null || nuevoValor === '') return
    const valorParsed = !isNaN(nuevoValor) ? parseFloat(nuevoValor) : nuevoValor
    await supabase.from(tabla).update({ [campoActual]: valorParsed }).eq('id', id)
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
    setNuevoIngreso({ persona: nuevoIngreso.persona, descripcion: '', monto: '' })
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
    setNuevoGastoPropio({ persona: nuevoGastoPropio.persona, descripcion: '', monto: '' })
    cargarTodo()
  }

  const agregarTarjeta = async (e) => {
    e.preventDefault()
    if (!nuevaTarjeta.nombre) return
    await supabase.from('tarjetas').insert([nuevaTarjeta])
    setNuevaTarjeta({ persona: nuevaTarjeta.persona, nombre: '' })
    cargarTodo()
  }

  const agregarConsumo = async (e) => {
    e.preventDefault()
    if (!nuevoConsumo.tarjetaId || !nuevoConsumo.montoCuota) return
    
    const quienPagaFinal = nuevoConsumo.quienPagaOption === 'Otro' 
      ? `Otro (${nuevoConsumo.quienPagaOtro || 'Familiar'})` 
      : nuevoConsumo.quienPagaOption

    await supabase.from('consumos_tarjetas').insert([{
      tarjeta_id: parseInt(nuevoConsumo.tarjetaId),
      realiza: nuevoConsumo.realiza,
      descripcion: nuevoConsumo.descripcion || 'Gasto Tarjeta',
      monto_cuota: parseFloat(nuevoConsumo.montoCuota),
      cuota_actual: parseInt(nuevoConsumo.cuotaInicial) || 1,
      total_cuotas: parseInt(nuevoConsumo.totalCuotas) || 1,
      quien_paga: quienPagaFinal,
      periodo
    }])

    setNuevoConsumo({ ...nuevoConsumo, descripcion: '', montoCuota: '' })
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
    setNuevoCombustible({ persona: nuevoCombustible.persona, monto: '' })
    cargarTodo()
  }

  const guardarAhorro = async (persona, monto) => {
    await supabase.from('ahorros').upsert([{ persona, monto: parseFloat(monto) || 0 }], { onConflict: 'persona' })
    cargarTodo()
  }

  // CONSUMOS ACTIVOS DEL MES
  const consumosActivosMes = consumosTarjetas.map(c => {
    const { cuotaActual, activa } = calcularCuotaMes(c)
    return { ...c, cuotaCalculada: cuotaActual, activa }
  }).filter(c => c.activa)

  // DETECCIÓN AUTOMÁTICA DE COMBUSTIBLE
  const esCombustible = (desc) => {
    const d = (desc || '').toUpperCase()
    return d.includes('YPF') || d.includes('SHELL') || d.includes('AXION')
  }

  // CÁLCULOS GENERALES
  const totalCompartidos = gastosCompartidos.reduce((acc, item) => acc + Number(item.monto), 0)
  const mitadCompartidos = totalCompartidos / 2

  // Ingresos del Mes
  const ingLisandro = ingresos.filter(i => i.persona === 'Lisandro' && i.periodo === periodo)
  const ingCatriel = ingresos.filter(i => i.persona === 'Catriel' && i.periodo === periodo)
  const totalIngLisandro = ingLisandro.reduce((acc, i) => acc + Number(i.monto), 0)
  const totalIngCatriel = ingCatriel.reduce((acc, i) => acc + Number(i.monto), 0)

  // Gastos Propios del Mes
  const gPropLisandro = gastosPropios.filter(g => g.persona === 'Lisandro' && g.periodo === periodo)
  const gPropCatriel = gastosPropios.filter(g => g.persona === 'Catriel' && g.periodo === periodo)
  const totalGPropLisandro = gPropLisandro.reduce((acc, g) => acc + Number(g.monto), 0)
  const totalGPropCatriel = gPropCatriel.reduce((acc, g) => acc + Number(g.monto), 0)

  // Combustible (Manual + Tarjetas YPF/SHELL/AXION)
  const combLisandroManual = combustibleManual.filter(c => c.persona === 'Lisandro' && c.periodo === periodo).reduce((acc, c) => acc + Number(c.monto), 0)
  const combCatrielManual = combustibleManual.filter(c => c.persona === 'Catriel' && c.periodo === periodo).reduce((acc, c) => acc + Number(c.monto), 0)

  const combLisandroAuto = consumosActivosMes.filter(c => c.realiza === 'Lisandro' && esCombustible(c.descripcion)).reduce((acc, c) => acc + Number(c.monto_cuota), 0)
  const combCatrielAuto = consumosActivosMes.filter(c => c.realiza === 'Catriel' && esCombustible(c.descripcion)).reduce((acc, c) => acc + Number(c.monto_cuota), 0)

  const totalCombLisandro = combLisandroManual + combLisandroAuto
  const totalCombCatriel = combCatrielManual + combCatrielAuto

  // Tarjetas
  const tarjLisandro = tarjetas.filter(t => t.persona === 'Lisandro')
  const tarjCatriel = tarjetas.filter(t => t.persona === 'Catriel')
  const tarjetasParaForm = tarjetas.filter(t => t.persona === nuevoConsumo.realiza)

  // Consumos Tarjeta Compartidos
  const tarjCompLisandro = consumosActivosMes.filter(c => {
    const perteneceALisandro = tarjLisandro.some(t => t.id === c.tarjeta_id)
    return perteneceALisandro && c.quien_paga === 'Compartido'
  }).reduce((acc, c) => acc + Number(c.monto_cuota), 0)

  const tarjCompCatriel = consumosActivosMes.filter(c => {
    const perteneceACatriel = tarjCatriel.some(t => t.id === c.tarjeta_id)
    return perteneceACatriel && c.quien_paga === 'Compartido'
  }).reduce((acc, c) => acc + Number(c.monto_cuota), 0)

  const totalTarjComp = tarjCompLisandro + tarjCompCatriel
  const mitadTarjComp = totalTarjComp / 2

  // Disponibles finales
  const dispLisandro = totalIngLisandro - (mitadCompartidos + totalGPropLisandro + ahorros.Lisandro)
  const dispCatriel = totalIngCatriel - (mitadCompartidos + totalGPropCatriel + ahorros.Catriel)

  return (
    <div style={styles.appWrapper}>
      <div style={styles.appContainer}>
        
        {/* ENCABEZADO */}
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

        {/* ESTRUCTURA VISUAL DE 3 COLUMNAS */}
        <div style={styles.mainGrid}>
          
          {/* COLUMNA LISANDRO (IZQUIERDA) */}
          <div style={styles.columnBlue}>
            <div style={styles.headerBlue}>
              <h2>👤 LISANDRO</h2>
            </div>
            
            <div style={styles.subGrid}>
              <div style={styles.boxLightBlue}>
                <span style={styles.boxTitle}>💵 INGRESOS</span>
                <p style={styles.totText}>Tot: ${totalIngLisandro.toLocaleString()}</p>
                {ingLisandro.map(i => (
                  <div key={i.id} style={styles.itemDesglosado}>
                    <span>{i.descripcion}: <strong>${Number(i.monto).toLocaleString()}</strong></span>
                    <div>
                      <button onClick={() => editarItemPrompt('ingresos', i.id, 'monto', i.monto)} style={styles.btnIcon}>✏️</button>
                      <button onClick={() => borrarItem('ingresos', i.id)} style={styles.btnIcon}>🗑️</button>
                    </div>
                  </div>
                ))}
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

            {/* GASTOS PROPIOS LISANDRO */}
            <div style={{ ...styles.boxLightBlue, marginTop: '8px' }}>
              <span style={styles.boxTitle}>GASTOS PROPIOS LISANDRO</span>
              {gPropLisandro.length === 0 ? (
                <p style={styles.emptyText}>Sin gastos propios</p>
              ) : (
                gPropLisandro.map(g => {
                  const pagado = estaPagado('gpropio', g.id)
                  return (
                    <div key={g.id} style={styles.itemDesglosado}>
                      <span style={{ textDecoration: pagado ? 'line-through' : 'none', opacity: pagado ? 0.6 : 1 }}>
                        {g.descripcion}: <strong>${Number(g.monto).toLocaleString()}</strong>
                      </span>
                      <div>
                        <button
                          onClick={() => togglePago('gpropio', g.id)}
                          style={{ ...styles.btnBadge, backgroundColor: pagado ? '#22c55e' : '#f59e0b' }}
                        >
                          {pagado ? '✅ Pagado' : '⏳ Pendiente'}
                        </button>
                        <button onClick={() => editarItemPrompt('gastos_propios', g.id, 'monto', g.monto)} style={styles.btnIcon}>✏️</button>
                        <button onClick={() => borrarItem('gastos_propios', g.id)} style={styles.btnIcon}>🗑️</button>
                      </div>
                    </div>
                  )
                })
              )}
              <p style={{ textAlign: 'right', marginTop: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                Subtotal Propio: ${totalGPropLisandro.toLocaleString()}
              </p>
            </div>

            {/* TARJETAS LISANDRO (TABLA DE CONSUMOS COMPLETA) */}
            <div style={styles.cardGroupTitle}>💳 Tarjetas de Lisandro</div>
            {tarjLisandro.length === 0 ? (
              <p style={styles.emptyText}>Sin tarjetas registradas</p>
            ) : (
              tarjLisandro.map(t => {
                const consumosEstaTarjeta = consumosActivosMes.filter(c => c.tarjeta_id === t.id)
                const totalResumen = consumosEstaTarjeta.reduce((acc, c) => acc + Number(c.monto_cuota), 0)
                return (
                  <div key={t.id} style={styles.cardItemBlue}>
                    <div style={styles.rowFlexTableHeader}>
                      <span>💳 <strong>{t.nombre}</strong></span>
                      <div>
                        <button onClick={() => editarItemPrompt('tarjetas', t.id, 'nombre', t.nombre)} style={styles.btnIcon}>✏️</button>
                        <button onClick={() => borrarItem('tarjetas', t.id)} style={styles.btnIcon}>🗑️</button>
                      </div>
                    </div>

                    <table style={styles.tableTarjeta}>
                      <thead>
                        <tr>
                          <th>Detalle</th>
                          <th style={{ textAlign: 'right' }}>Monto</th>
                          <th style={{ textAlign: 'center' }}>Cuota</th>
                          <th style={{ textAlign: 'center' }}>Quién</th>
                          <th style={{ textAlign: 'center' }}>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {consumosEstaTarjeta.length === 0 ? (
                          <tr><td colSpan="5" style={{ textAlign: 'center', color: '#94a3b8' }}>Sin consumos este mes</td></tr>
                        ) : (
                          consumosEstaTarjeta.map(c => {
                            const pagado = estaPagado('consumo', c.id)
                            return (
                              <tr key={c.id} style={{ opacity: pagado ? 0.6 : 1 }}>
                                <td>{c.descripcion}</td>
                                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>${Number(c.monto_cuota).toLocaleString()}</td>
                                <td style={{ textAlign: 'center' }}>{c.cuotaCalculada}/{c.total_cuotas}</td>
                                <td style={{ textAlign: 'center' }}>{c.quien_paga}</td>
                                <td style={{ textAlign: 'center' }}>
                                  <button
                                    onClick={() => togglePago('consumo', c.id)}
                                    style={{ ...styles.btnBadgeMini, backgroundColor: pagado ? '#22c55e' : '#f59e0b' }}
                                  >
                                    {pagado ? '✅' : '⏳'}
                                  </button>
                                  <button onClick={() => borrarItem('consumos_tarjetas', c.id)} style={styles.btnIcon}>🗑️</button>
                                </td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>

                    <p style={{ fontSize: '11px', margin: '6px 0 0 0', color: '#0284c7', textAlign: 'left', fontWeight: 'bold' }}>
                      Total Resumen Mes: ${totalResumen.toLocaleString()}
                    </p>
                  </div>
                )
              })
            )}
          </div>

          {/* COLUMNA CENTRAL (COMPARTIDO Y BLOQUES COMUNES) */}
          <div style={styles.columnYellow}>
            <div style={styles.headerYellow}>
              <h2>🤝 GASTOS COMPARTIDOS (50 / 50)</h2>
            </div>
            
            <table style={styles.tableYellow}>
              <tbody>
                {gastosCompartidos.map(g => {
                  const pagado = estaPagado('gcomp', g.id)
                  return (
                    <tr key={g.id} style={{ opacity: pagado ? 0.6 : 1 }}>
                      <td style={{ textDecoration: pagado ? 'line-through' : 'none' }}>{g.concepto}</td>
                      <td style={{ textAlign: 'right', color: '#b45309', fontWeight: 'bold' }}>
                        ${Number(g.monto).toLocaleString()}
                        <button
                          onClick={() => togglePago('gcomp', g.id)}
                          style={{ ...styles.btnBadge, backgroundColor: pagado ? '#22c55e' : '#f59e0b', marginLeft: '6px' }}
                        >
                          {pagado ? '✅ Pagado' : '⏳ Pendiente'}
                        </button>
                        <button onClick={() => editarItemPrompt('gastos_compartidos', g.id, 'monto', g.monto)} style={styles.btnIcon}>✏️</button>
                        <button onClick={() => borrarItem('gastos_compartidos', g.id)} style={styles.btnIcon}>🗑️</button>
                      </td>
                    </tr>
                  )
                })}
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
                placeholder="Ej: Alquiler (Fijo)"
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

            {/* GASTOS TARJETAS COMPARTIDOS */}
            <div style={{ marginTop: '16px', borderTop: '1px solid #fde047', paddingTop: '10px' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#854d0e' }}>💳 Gastos Tarjetas Compartidos</h4>
              <div style={styles.infoRowLightBlue}>
                <span>En tarjetas de Lisandro:</span>
                <strong>${tarjCompLisandro.toLocaleString()}</strong>
              </div>
              <div style={{ ...styles.infoRowLightGreen, marginTop: '4px' }}>
                <span>En tarjetas de Catriel:</span>
                <strong>${tarjCompCatriel.toLocaleString()}</strong>
              </div>
              <div style={styles.infoRowLightYellow}>
                <span>Corresponde pagar a CADA UNO (50%):</span>
                <strong>${mitadTarjComp.toLocaleString()}</strong>
              </div>
            </div>

            {/* CARGO JUSTO DE TARJETAS (SEPARACIÓN CLARA POR TARJETA) */}
            <div style={{ marginTop: '16px', borderTop: '1px solid #fde047', paddingTop: '10px' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#0f172a', fontWeight: 'bold' }}>
                📊 Cargo Justo de Tarjetas (Solo Gastos Propios)
              </h4>
              <div style={styles.grid2Col}>
                
                {/* LISANDRO */}
                <div style={styles.boxCargoJustoBlue}>
                  <h5 style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#0369a1', borderBottom: '1px solid #bae6fd', pb: '4px' }}>
                    LISANDRO (PROPIO)
                  </h5>
                  {tarjLisandro.length === 0 ? (
                    <p style={styles.emptyText}>Sin tarjetas</p>
                  ) : (
                    tarjLisandro.map(t => {
                      const propioTarj = consumosActivosMes
                        .filter(c => c.tarjeta_id === t.id && c.quien_paga === 'Lisandro')
                        .reduce((acc, c) => acc + Number(c.monto_cuota), 0)
                      return (
                        <div key={t.id} style={styles.rowFlexCargo}>
                          <span>{t.nombre}:</span>
                          <strong>${propioTarj.toLocaleString()}</strong>
                        </div>
                      )
                    })
                  )}
                </div>

                {/* CATRIEL */}
                <div style={styles.boxCargoJustoGreen}>
                  <h5 style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#15803d', borderBottom: '1px solid #bbf7d0', pb: '4px' }}>
                    CATRIEL (PROPIO)
                  </h5>
                  {tarjCatriel.length === 0 ? (
                    <p style={styles.emptyText}>Sin tarjetas</p>
                  ) : (
                    tarjCatriel.map(t => {
                      const propioTarj = consumosActivosMes
                        .filter(c => c.tarjeta_id === t.id && c.quien_paga === 'Catriel')
                        .reduce((acc, c) => acc + Number(c.monto_cuota), 0)
                      return (
                        <div key={t.id} style={styles.rowFlexCargo}>
                          <span>{t.nombre}:</span>
                          <strong>${propioTarj.toLocaleString()}</strong>
                        </div>
                      )
                    })
                  )}
                </div>

              </div>
            </div>

            {/* GASTOS DE COMBUSTIBLE */}
            <div style={{ marginTop: '16px', borderTop: '1px solid #fde047', paddingTop: '10px' }}>
              <h4 style={{ color: '#c2410c', margin: '0 0 6px 0', fontSize: '13px' }}>⛽ GASTOS DE COMBUSTIBLE</h4>
              <div style={styles.rowFlex}>
                <div style={styles.boxMiniOrange}>Lisandro: <strong>${totalCombLisandro.toLocaleString()}</strong></div>
                <div style={styles.boxMiniOrange}>Catriel: <strong>${totalCombCatriel.toLocaleString()}</strong></div>
              </div>
              <form onSubmit={agregarCombustible} style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                <select value={nuevoCombustible.persona} onChange={e => setNuevoCombustible({ ...nuevoCombustible, persona: e.target.value })} style={styles.selectStyle}>
                  <option value="Catriel">Catriel</option>
                  <option value="Lisandro">Lisandro</option>
                </select>
                <input
                  type="number"
                  placeholder="$ Monto Adicional"
                  value={nuevoCombustible.monto}
                  onChange={e => setNuevoCombustible({ ...nuevoCombustible, monto: e.target.value })}
                  style={styles.inputFlex}
                />
                <button type="submit" style={styles.btnOrange}>+ Cargar</button>
              </form>
            </div>

          </div>

          {/* COLUMNA CATRIEL (DERECHA) */}
          <div style={styles.columnGreen}>
            <div style={styles.headerGreen}>
              <h2>👤 CATRIEL</h2>
            </div>
            
            <div style={styles.subGrid}>
              <div style={styles.boxLightGreen}>
                <span style={styles.boxTitle}>💵 INGRESOS</span>
                <p style={styles.totText}>Tot: ${totalIngCatriel.toLocaleString()}</p>
                {ingCatriel.map(i => (
                  <div key={i.id} style={styles.itemDesglosado}>
                    <span>{i.descripcion}: <strong>${Number(i.monto).toLocaleString()}</strong></span>
                    <div>
                      <button onClick={() => editarItemPrompt('ingresos', i.id, 'monto', i.monto)} style={styles.btnIcon}>✏️</button>
                      <button onClick={() => borrarItem('ingresos', i.id)} style={styles.btnIcon}>🗑️</button>
                    </div>
                  </div>
                ))}
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

            {/* GASTOS PROPIOS CATRIEL */}
            <div style={{ ...styles.boxLightGreen, marginTop: '8px' }}>
              <span style={styles.boxTitle}>GASTOS PROPIOS CATRIEL</span>
              {gPropCatriel.length === 0 ? (
                <p style={styles.emptyText}>Sin gastos propios</p>
              ) : (
                gPropCatriel.map(g => {
                  const pagado = estaPagado('gpropio', g.id)
                  return (
                    <div key={g.id} style={styles.itemDesglosado}>
                      <span style={{ textDecoration: pagado ? 'line-through' : 'none', opacity: pagado ? 0.6 : 1 }}>
                        {g.descripcion}: <strong>${Number(g.monto).toLocaleString()}</strong>
                      </span>
                      <div>
                        <button
                          onClick={() => togglePago('gpropio', g.id)}
                          style={{ ...styles.btnBadge, backgroundColor: pagado ? '#22c55e' : '#f59e0b' }}
                        >
                          {pagado ? '✅ Pagado' : '⏳ Pendiente'}
                        </button>
                        <button onClick={() => editarItemPrompt('gastos_propios', g.id, 'monto', g.monto)} style={styles.btnIcon}>✏️</button>
                        <button onClick={() => borrarItem('gastos_propios', g.id)} style={styles.btnIcon}>🗑️</button>
                      </div>
                    </div>
                  )
                })
              )}
              <p style={{ textAlign: 'right', marginTop: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                Subtotal Propio: ${totalGPropCatriel.toLocaleString()}
              </p>
            </div>

            {/* TARJETAS CATRIEL (TABLA DE CONSUMOS COMPLETA) */}
            <div style={styles.cardGroupTitleGreen}>💳 Tarjetas de Catriel</div>
            {tarjCatriel.length === 0 ? (
              <p style={styles.emptyText}>Sin tarjetas registradas</p>
            ) : (
              tarjCatriel.map(t => {
                const consumosEstaTarjeta = consumosActivosMes.filter(c => c.tarjeta_id === t.id)
                const totalResumen = consumosEstaTarjeta.reduce((acc, c) => acc + Number(c.monto_cuota), 0)
                return (
                  <div key={t.id} style={styles.cardItemGreen}>
                    <div style={styles.rowFlexTableHeader}>
                      <span>💳 <strong>{t.nombre}</strong></span>
                      <div>
                        <button onClick={() => editarItemPrompt('tarjetas', t.id, 'nombre', t.nombre)} style={styles.btnIcon}>✏️</button>
                        <button onClick={() => borrarItem('tarjetas', t.id)} style={styles.btnIcon}>🗑️</button>
                      </div>
                    </div>

                    <table style={styles.tableTarjeta}>
                      <thead>
                        <tr>
                          <th>Detalle</th>
                          <th style={{ textAlign: 'right' }}>Monto</th>
                          <th style={{ textAlign: 'center' }}>Cuota</th>
                          <th style={{ textAlign: 'center' }}>Quién</th>
                          <th style={{ textAlign: 'center' }}>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {consumosEstaTarjeta.length === 0 ? (
                          <tr><td colSpan="5" style={{ textAlign: 'center', color: '#94a3b8' }}>Sin consumos este mes</td></tr>
                        ) : (
                          consumosEstaTarjeta.map(c => {
                            const pagado = estaPagado('consumo', c.id)
                            return (
                              <tr key={c.id} style={{ opacity: pagado ? 0.6 : 1 }}>
                                <td>{c.descripcion}</td>
                                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>${Number(c.monto_cuota).toLocaleString()}</td>
                                <td style={{ textAlign: 'center' }}>{c.cuotaCalculada}/{c.total_cuotas}</td>
                                <td style={{ textAlign: 'center' }}>{c.quien_paga}</td>
                                <td style={{ textAlign: 'center' }}>
                                  <button
                                    onClick={() => togglePago('consumo', c.id)}
                                    style={{ ...styles.btnBadgeMini, backgroundColor: pagado ? '#22c55e' : '#f59e0b' }}
                                  >
                                    {pagado ? '✅' : '⏳'}
                                  </button>
                                  <button onClick={() => borrarItem('consumos_tarjetas', c.id)} style={styles.btnIcon}>🗑️</button>
                                </td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>

                    <p style={{ fontSize: '11px', margin: '6px 0 0 0', color: '#16a34a', textAlign: 'left', fontWeight: 'bold' }}>
                      Total Resumen Mes: ${totalResumen.toLocaleString()}
                    </p>
                  </div>
                )
              })
            )}
          </div>

        </div>

        {/* PANELES INFERIORES */}
        <div style={styles.bottomSection}>
          
          {/* BALANCE NETO DEL MES */}
          <div style={styles.balanceNetoCard}>
            <h3 style={{ textAlign: 'center', margin: '0 0 8px 0', fontSize: '14px' }}>💰 BALANCE NETO DEL MES</h3>
            <div style={styles.rowFlex}>
              <div style={styles.balanceColBlue}>
                <h4 style={{ color: '#0284c7', margin: 0, fontSize: '12px' }}>LISANDRO</h4>
                <p style={{ margin: '2px 0', fontSize: '11px' }}>Ingresos: ${totalIngLisandro.toLocaleString()}</p>
                <p style={{ margin: '2px 0', fontSize: '11px' }}>Gastos: ${(mitadCompartidos + totalGPropLisandro).toLocaleString()}</p>
                <p style={{ margin: '2px 0', fontSize: '12px' }}>DISPONIBLE: <strong style={{ color: dispLisandro < 0 ? '#ef4444' : '#22c55e' }}>${dispLisandro.toLocaleString()}</strong></p>
              </div>
              <div style={styles.balanceColGreen}>
                <h4 style={{ color: '#16a34a', margin: 0, fontSize: '12px' }}>CATRIEL</h4>
                <p style={{ margin: '2px 0', fontSize: '11px' }}>Ingresos: ${totalIngCatriel.toLocaleString()}</p>
                <p style={{ margin: '2px 0', fontSize: '11px' }}>Gastos: ${(mitadCompartidos + totalGPropCatriel).toLocaleString()}</p>
                <p style={{ margin: '2px 0', fontSize: '12px' }}>DISPONIBLE: <strong style={{ color: dispCatriel < 0 ? '#ef4444' : '#22c55e' }}>${dispCatriel.toLocaleString()}</strong></p>
              </div>
            </div>
          </div>

          {/* FORMULARIO DE CARGAR CONSUMO CON TARJETA */}
          <div style={{ ...styles.cardWhite, border: '2px solid #3b82f6', marginTop: '12px' }}>
            <h4 style={{ color: '#1d4ed8', margin: '0 0 8px 0', fontSize: '13px' }}>💳 Cargar Nuevo Consumo con Tarjeta</h4>
            <form onSubmit={agregarConsumo}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr 1fr 0.8fr 0.8fr 1.2fr', gap: '6px', alignItems: 'center' }}>
                
                <div>
                  <label style={styles.labelMini}>1. Titular Tarjeta:</label>
                  <select
                    value={nuevoConsumo.realiza}
                    onChange={e => setNuevoConsumo({ ...nuevoConsumo, realiza: e.target.value, tarjetaId: '' })}
                    style={styles.selectFull}
                  >
                    <option value="Catriel">Catriel</option>
                    <option value="Lisandro">Lisandro</option>
                  </select>
                </div>

                <div>
                  <label style={styles.labelMini}>2. Tarjeta:</label>
                  <select
                    value={nuevoConsumo.tarjetaId}
                    onChange={e => setNuevoConsumo({ ...nuevoConsumo, tarjetaId: e.target.value })}
                    style={styles.selectFull}
                  >
                    <option value="">-- Seleccionar --</option>
                    {tarjetasParaForm.map(t => (
                      <option key={t.id} value={t.id}>{t.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={styles.labelMini}>3. Descripción:</label>
                  <input
                    type="text"
                    placeholder="Ej. YPF / Supermercado"
                    value={nuevoConsumo.descripcion}
                    onChange={e => setNuevoConsumo({ ...nuevoConsumo, descripcion: e.target.value })}
                    style={styles.inputFull}
                  />
                </div>

                <div>
                  <label style={styles.labelMini}>4. $ Monto Cuota:</label>
                  <input
                    type="number"
                    placeholder="$ Cuota"
                    value={nuevoConsumo.montoCuota}
                    onChange={e => setNuevoConsumo({ ...nuevoConsumo, montoCuota: e.target.value })}
                    style={styles.inputFull}
                  />
                </div>

                <div>
                  <label style={styles.labelMini}>Cuota Inicial:</label>
                  <input
                    type="number"
                    value={nuevoConsumo.cuotaInicial}
                    onChange={e => setNuevoConsumo({ ...nuevoConsumo, cuotaInicial: e.target.value })}
                    style={styles.inputFull}
                  />
                </div>

                <div>
                  <label style={styles.labelMini}>Total Cuotas:</label>
                  <input
                    type="number"
                    value={nuevoConsumo.totalCuotas}
                    onChange={e => setNuevoConsumo({ ...nuevoConsumo, totalCuotas: e.target.value })}
                    style={styles.inputFull}
                  />
                </div>

                <div>
                  <label style={styles.labelMini}>5. ¿Quién paga?:</label>
                  <select
                    value={nuevoConsumo.quienPagaOption}
                    onChange={e => setNuevoConsumo({ ...nuevoConsumo, quienPagaOption: e.target.value })}
                    style={styles.selectFull}
                  >
                    <option value="Catriel">Catriel</option>
                    <option value="Lisandro">Lisandro</option>
                    <option value="Compartido">Compartido</option>
                    <option value="Otro">Otro...</option>
                  </select>
                  {nuevoConsumo.quienPagaOption === 'Otro' && (
                    <input
                      type="text"
                      placeholder="Nombre familiar"
                      value={nuevoConsumo.quienPagaOtro}
                      onChange={e => setNuevoConsumo({ ...nuevoConsumo, quienPagaOtro: e.target.value })}
                      style={{ ...styles.inputFull, marginTop: '4px' }}
                    />
                  )}
                </div>

              </div>
              <button type="submit" style={{ ...styles.btnBlueFull, marginTop: '8px' }}>+ Cargar Consumo de Tarjeta</button>
            </form>
          </div>

          {/* FORMULARIOS DE INGRESOS, GASTOS PROPIOS Y CREACIÓN DE TARJETAS */}
          <div style={{ ...styles.grid3Col, marginTop: '12px' }}>
            
            <form onSubmit={agregarIngreso} style={styles.cardWhite}>
              <h4 style={styles.formTitle}>➕ Cargar Ingreso</h4>
              <select
                value={nuevoIngreso.persona}
                onChange={e => setNuevoIngreso({ ...nuevoIngreso, persona: e.target.value })}
                style={styles.selectFull}
              >
                <option value="Catriel">Para Catriel</option>
                <option value="Lisandro">Para Lisandro</option>
              </select>
              <input
                type="text"
                placeholder="Descripción"
                value={nuevoIngreso.descripcion}
                onChange={e => setNuevoIngreso({ ...nuevoIngreso, descripcion: e.target.value })}
                style={styles.inputFull}
              />
              <input
                type="number"
                placeholder="$ Monto"
                value={nuevoIngreso.monto}
                onChange={e => setNuevoIngreso({ ...nuevoIngreso, monto: e.target.value })}
                style={styles.inputFull}
              />
              <button type="submit" style={styles.btnBlueFull}>+ Guardar Ingreso</button>
            </form>

            <form onSubmit={agregarGastoPropio} style={styles.cardWhite}>
              <h4 style={styles.formTitle}>➕ Cargar Gasto Propio</h4>
              <select
                value={nuevoGastoPropio.persona}
                onChange={e => setNuevoGastoPropio({ ...nuevoGastoPropio, persona: e.target.value })}
                style={styles.selectFull}
              >
                <option value="Catriel">De Catriel</option>
                <option value="Lisandro">De Lisandro</option>
              </select>
              <input
                type="text"
                placeholder="Descripción"
                value={nuevoGastoPropio.descripcion}
                onChange={e => setNuevoGastoPropio({ ...nuevoGastoPropio, descripcion: e.target.value })}
                style={styles.inputFull}
              />
              <input
                type="number"
                placeholder="$ Monto"
                value={nuevoGastoPropio.monto}
                onChange={e => setNuevoGastoPropio({ ...nuevoGastoPropio, monto: e.target.value })}
                style={styles.inputFull}
              />
              <button type="submit" style={styles.btnBlueFull}>+ Guardar Gasto</button>
            </form>

            <form onSubmit={agregarTarjeta} style={styles.cardWhite}>
              <h4 style={styles.formTitle}>💳 Crear Nueva Tarjeta</h4>
              <select
                value={nuevaTarjeta.persona}
                onChange={e => setNuevaTarjeta({ ...nuevaTarjeta, persona: e.target.value })}
                style={styles.selectFull}
              >
                <option value="Catriel">Para Catriel</option>
                <option value="Lisandro">Para Lisandro</option>
              </select>
              <input
                type="text"
                placeholder="Nombre (ej. NACION VISA)"
                value={nuevaTarjeta.nombre}
                onChange={e => setNuevaTarjeta({ ...nuevaTarjeta, nombre: e.target.value })}
                style={styles.inputFull}
              />
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
  appContainer: { maxWidth: '1280px', width: '100%', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#334155' },
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
  cardItemBlue: { backgroundColor: '#fff', padding: '10px', borderRadius: '8px', marginTop: '8px', border: '1px solid #0284c7' },
  columnYellow: { backgroundColor: '#fef9c3', borderRadius: '14px', padding: '12px', border: '1px solid #fde047' },
  headerYellow: { color: '#a16207', marginBottom: '8px', fontSize: '14px' },
  tableYellow: { width: '100%', borderCollapse: 'collapse', fontSize: '12px' },
  summaryYellowBox: { backgroundColor: '#fef08a', padding: '8px', borderRadius: '6px', marginTop: '8px', fontSize: '12px' },
  columnGreen: { backgroundColor: '#dcfce7', borderRadius: '14px', padding: '12px', border: '1px solid #4ade80' },
  headerGreen: { color: '#15803d', marginBottom: '8px', fontSize: '14px' },
  boxLightGreen: { backgroundColor: '#fff', padding: '8px', borderRadius: '8px', border: '1px solid #bbf7d0' },
  cardItemGreen: { backgroundColor: '#fff', padding: '10px', borderRadius: '8px', marginTop: '8px', border: '1px solid #16a34a' },
  boxTitle: { fontSize: '10px', fontWeight: 'bold', color: '#64748b' },
  totText: { fontSize: '12px', fontWeight: 'bold', margin: '2px 0 4px 0' },
  montoText: { fontSize: '15px', fontWeight: 'bold', margin: '2px 0' },
  inputMini: { width: '100%', padding: '2px 4px', fontSize: '10px', borderRadius: '4px', border: '1px solid #cbd5e1' },
  cardGroupTitle: { fontSize: '12px', fontWeight: 'bold', color: '#0369a1', marginTop: '12px' },
  cardGroupTitleGreen: { fontSize: '12px', fontWeight: 'bold', color: '#15803d', marginTop: '12px' },
  emptyText: { fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', margin: '4px 0' },
  rowFlex: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  rowFlexTableHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0284c7', color: '#fff', padding: '6px 8px', borderRadius: '4px 4px 0 0', fontSize: '12px' },
  rowFlexCargo: { display: 'flex', justifyContent: 'space-between', fontSize: '11px', padding: '3px 0', borderBottom: '1px dashed #e2e8f0' },
  btnIcon: { background: 'none', border: 'none', cursor: 'pointer', marginLeft: '2px', fontSize: '11px' },
  btnBadge: { border: 'none', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold' },
  btnBadgeMini: { border: 'none', color: '#fff', padding: '1px 4px', borderRadius: '3px', fontSize: '9px', cursor: 'pointer' },
  inputFlex: { padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', flex: 1 },
  btnOrange: { backgroundColor: '#d97706', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' },
  bottomSection: { marginTop: '14px' },
  grid2Col: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' },
  grid3Col: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' },
  cardWhite: { backgroundColor: '#fff', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' },
  boxMiniBlue: { backgroundColor: '#e0f2fe', padding: '8px', borderRadius: '6px', width: '48%' },
  boxMiniGreen: { backgroundColor: '#dcfce7', padding: '8px', borderRadius: '6px', width: '48%' },
  boxCargoJustoBlue: { backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', padding: '8px', borderRadius: '6px' },
  boxCargoJustoGreen: { backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '8px', borderRadius: '6px' },
  boxMiniOrange: { backgroundColor: '#ffedd5', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', width: '48%' },
  balanceNetoCard: { backgroundColor: '#fff', padding: '12px', borderRadius: '12px', border: '1.5px solid #0f172a' },
  balanceColBlue: { backgroundColor: '#f0f9ff', padding: '8px', borderRadius: '6px', width: '48%' },
  balanceColGreen: { backgroundColor: '#f0fdf4', padding: '8px', borderRadius: '6px', width: '48%' },
  selectStyle: { padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff', fontSize: '12px' },
  selectFull: { width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff', fontSize: '12px', marginTop: '2px' },
  inputFull: { width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', marginTop: '2px', boxSizing: 'border-box' },
  btnBlueFull: { width: '100%', backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '6px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px', marginTop: '6px' },
  formTitle: { fontSize: '12px', margin: '0 0 4px 0', color: '#1e293b' },
  itemDesglosado: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', marginTop: '4px', backgroundColor: '#f8fafc', padding: '4px 6px', borderRadius: '4px', border: '1px solid #e2e8f0' },
  itemDesglosadoConsumo: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: '#475569', marginTop: '2px', borderTop: '1px dashed #e2e8f0', paddingTop: '2px' },
  labelMini: { fontSize: '10px', fontWeight: 'bold', color: '#475569', display: 'block' },
  infoRowLightBlue: { backgroundColor: '#e0f2fe', padding: '6px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '11px' },
  infoRowLightGreen: { backgroundColor: '#dcfce7', padding: '6px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '11px' },
  infoRowLightYellow: { backgroundColor: '#fef08a', padding: '6px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '4px' },
  tableTarjeta: { width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginTop: '4px', backgroundColor: '#fff' }
}
