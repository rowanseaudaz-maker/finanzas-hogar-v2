import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function App() {
  const [periodo, setPeriodo] = useState('2026-10')
  const [cargando, setCargando] = useState(true)

  // ESTADOS DE DATOS DESDE SUPABASE
  const [ingresos, setIngresos] = useState([])
  const [ahorros, setAhorros] = useState({ Lisandro: 0, Catriel: 0 })
  const [gastosPropios, setGastosPropios] = useState([])
  const [gastosCompartidos, setGastosCompartidos] = useState([])
  const [tarjetas, setTarjetas] = useState([])
  const [consumosTarjetas, setConsumosTarjetas] = useState([])
  const [combustible, setCombustible] = useState([])
  const [prestamos, setPrestamos] = useState([])

  // ESTADOS DE FORMULARIOS
  const [nuevoGastoComp, setNuevoGastoComp] = useState({ concepto: '', monto: '' })
  const [nuevoIngreso, setNuevoIngreso] = useState({ persona: 'Catriel', descripcion: '', monto: '' })
  const [nuevoGastoPropio, setNuevoGastoPropio] = useState({ persona: 'Catriel', descripcion: '', monto: '' })
  const [nuevaTarjeta, setNuevaTarjeta] = useState({ persona: 'Catriel', nombre: '' })
  const [nuevoCombustible, setNuevoCombustible] = useState({ persona: 'Catriel', monto: '' })
  
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

  // SUBSCRIPCIÓN EN TIEMPO REAL
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

  // LECTURA GENERAL DE LA BASE DE DATOS
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

      const { data: prest } = await supabase.from('prestamos').select('*')
      setPrestamos(prest || [])

      const { data: aho } = await supabase.from('ahorros').select('*')
      if (aho) {
        const lis = aho.find(a => a.persona === 'Lisandro')?.monto || 0
        const cat = aho.find(a => a.persona === 'Catriel')?.monto || 0
        setAhorros({ Lisandro: lis, Catriel: cat })
      }
    } catch (e) {
      console.error('Error al cargar datos desde Supabase:', e)
    } finally {
      setCargando(false)
    }
  }

  // ACCIONES CON SUPABASE (GUARDAR Y ELIMINAR)

  const agregarGastoComp = async (e) => {
    e.preventDefault()
    if (!nuevoGastoComp.concepto || !nuevoGastoComp.monto) return
    const { error } = await supabase.from('gastos_compartidos').insert([{
      concepto: nuevoGastoComp.concepto,
      monto: parseFloat(nuevoGastoComp.monto),
      periodo
    }])
    if (error) alert('Error: ' + error.message)
    else {
      setNuevoGastoComp({ concepto: '', monto: '' })
      cargarTodo()
    }
  }

  const borrarGastoComp = async (id) => {
    await supabase.from('gastos_compartidos').delete().eq('id', id)
    cargarTodo()
  }

  const agregarIngreso = async (e) => {
    e.preventDefault()
    if (!nuevoIngreso.descripcion || !nuevoIngreso.monto) return
    const { error } = await supabase.from('ingresos').insert([{
      persona: nuevoIngreso.persona,
      descripcion: nuevoIngreso.descripcion,
      monto: parseFloat(nuevoIngreso.monto),
      periodo
    }])
    if (error) alert('Error: ' + error.message)
    else {
      setNuevoIngreso({ persona: nuevoIngreso.persona, descripcion: '', monto: '' })
      cargarTodo()
    }
  }

  const borrarIngreso = async (id) => {
    await supabase.from('ingresos').delete().eq('id', id)
    cargarTodo()
  }

  const agregarGastoPropio = async (e) => {
    e.preventDefault()
    if (!nuevoGastoPropio.descripcion || !nuevoGastoPropio.monto) return
    const { error } = await supabase.from('gastos_propios').insert([{
      persona: nuevoGastoPropio.persona,
      descripcion: nuevoGastoPropio.descripcion,
      monto: parseFloat(nuevoGastoPropio.monto),
      periodo
    }])
    if (error) alert('Error: ' + error.message)
    else {
      setNuevoGastoPropio({ persona: nuevoGastoPropio.persona, descripcion: '', monto: '' })
      cargarTodo()
    }
  }

  const borrarGastoPropio = async (id) => {
    await supabase.from('gastos_propios').delete().eq('id', id)
    cargarTodo()
  }

  const agregarTarjeta = async (e) => {
    e.preventDefault()
    if (!nuevaTarjeta.nombre) return
    const { error } = await supabase.from('tarjetas').insert([nuevaTarjeta])
    if (error) alert('Error: ' + error.message)
    else {
      setNuevaTarjeta({ persona: nuevaTarjeta.persona, nombre: '' })
      cargarTodo()
    }
  }

  const borrarTarjeta = async (id) => {
    await supabase.from('tarjetas').delete().eq('id', id)
    cargarTodo()
  }

  const agregarConsumo = async (e) => {
    e.preventDefault()
    if (!nuevoConsumo.tarjetaId || !nuevoConsumo.montoCuota) {
      alert('Por favor seleccioná la tarjeta e ingresá el monto.')
      return
    }
    const { error } = await supabase.from('consumos_tarjetas').insert([{
      tarjeta_id: parseInt(nuevoConsumo.tarjetaId),
      realiza: nuevoConsumo.realiza,
      descripcion: nuevoConsumo.descripcion || 'Gasto Tarjeta',
      monto_cuota: parseFloat(nuevoConsumo.montoCuota),
      cuota_actual: parseInt(nuevoConsumo.cuotaActual) || 1,
      total_cuotas: parseInt(nuevoConsumo.totalCuotas) || 1,
      quien_paga: nuevoConsumo.quienPaga,
      periodo
    }])
    if (error) alert('Error: ' + error.message)
    else {
      setNuevoConsumo({ ...nuevoConsumo, descripcion: '', montoCuota: '' })
      cargarTodo()
    }
  }

  const borrarConsumo = async (id) => {
    await supabase.from('consumos_tarjetas').delete().eq('id', id)
    cargarTodo()
  }

  const agregarCombustible = async (e) => {
    e.preventDefault()
    if (!nuevoCombustible.monto) return
    const { error } = await supabase.from('combustible').insert([{
      persona: nuevoCombustible.persona,
      monto: parseFloat(nuevoCombustible.monto),
      periodo
    }])
    if (error) alert('Error: ' + error.message)
    else {
      setNuevoCombustible({ persona: nuevoCombustible.persona, monto: '' })
      cargarTodo()
    }
  }

  const borrarCombustible = async (id) => {
    await supabase.from('combustible').delete().eq('id', id)
    cargarTodo()
  }

  const agregarPrestamo = async (e) => {
    e.preventDefault()
    if (!nuevoPrestamo.entidad || !nuevoPrestamo.montoCuota) return
    const { error } = await supabase.from('prestamos').insert([{
      entidad: nuevoPrestamo.entidad,
      monto_cuota: parseFloat(nuevoPrestamo.montoCuota),
      cuota_actual: parseInt(nuevoPrestamo.cuotaActual) || 1,
      total_cuotas: parseInt(nuevoPrestamo.totalCuotas) || 12,
      tipo: nuevoPrestamo.tipo,
      periodo
    }])
    if (error) alert('Error: ' + error.message)
    else {
      setNuevoPrestamo({ ...nuevoPrestamo, entidad: '', montoCuota: '' })
      cargarTodo()
    }
  }

  const borrarPrestamo = async (id) => {
    await supabase.from('prestamos').delete().eq('id', id)
    cargarTodo()
  }

  const guardarAhorro = async (persona, monto) => {
    await supabase.from('ahorros').upsert([{ persona, monto: parseFloat(monto) || 0 }], { onConflict: 'persona' })
    cargarTodo()
  }

  // CÁLCULOS MATEMÁTICOS DE BALANCE FINANCIERO
  const totalCompartidos = gastosCompartidos.reduce((acc, item) => acc + Number(item.monto), 0)
  const mitadCompartidos = totalCompartidos / 2

  // Ingresos
  const ingLisandro = ingresos.filter(i => i.persona === 'Lisandro')
  const ingCatriel = ingresos.filter(i => i.persona === 'Catriel')
  const totalIngLisandro = ingLisandro.reduce((acc, i) => acc + Number(i.monto), 0)
  const totalIngCatriel = ingCatriel.reduce((acc, i) => acc + Number(i.monto), 0)

  // Gastos Propios
  const gPropLisandro = gastosPropios.filter(g => g.persona === 'Lisandro')
  const gPropCatriel = gastosPropios.filter(g => g.persona === 'Catriel')
  const totalGPropLisandro = gPropLisandro.reduce((acc, g) => acc + Number(g.monto), 0)
  const totalGPropCatriel = gPropCatriel.reduce((acc, g) => acc + Number(g.monto), 0)

  // Combustible
  const combLisandro = combustible.filter(c => c.persona === 'Lisandro')
  const combCatriel = combustible.filter(c => c.persona === 'Catriel')
  const totalCombLisandro = combLisandro.reduce((acc, c) => acc + Number(c.monto), 0)
  const totalCombCatriel = combCatriel.reduce((acc, c) => acc + Number(c.monto), 0)

  // Tarjetas
  const tarjLisandro = tarjetas.filter(t => t.persona === 'Lisandro')
  const tarjCatriel = tarjetas.filter(t => t.persona === 'Catriel')
  const tarjetasParaForm = tarjetas.filter(t => t.persona === nuevoConsumo.realiza)

  // Consumos Tarjeta por Propietario de la tarjeta
  const consumosLisandroPropio = consumosTarjetas.filter(c => {
    const perteneceALisandro = tarjLisandro.some(t => t.id === c.tarjeta_id)
    return perteneceALisandro && c.quien_paga === 'Lisandro'
  }).reduce((acc, c) => acc + Number(c.monto_cuota), 0)

  const consumosCatrielPropio = consumosTarjetas.filter(c => {
    const perteneceACatriel = tarjCatriel.some(t => t.id === c.tarjeta_id)
    return perteneceACatriel && c.quien_paga === 'Catriel'
  }).reduce((acc, c) => acc + Number(c.monto_cuota), 0)

  // Consumos Tarjeta Compartidos
  const tarjCompLisandro = consumosTarjetas.filter(c => {
    const perteneceALisandro = tarjLisandro.some(t => t.id === c.tarjeta_id)
    return perteneceALisandro && c.quien_paga === 'Compartido'
  }).reduce((acc, c) => acc + Number(c.monto_cuota), 0)

  const tarjCompCatriel = consumosTarjetas.filter(c => {
    const perteneceACatriel = tarjCatriel.some(t => t.id === c.tarjeta_id)
    return perteneceACatriel && c.quien_paga === 'Compartido'
  }).reduce((acc, c) => acc + Number(c.monto_cuota), 0)

  const mitadTarjComp = (tarjCompLisandro + tarjCompCatriel) / 2

  // Disponibles
  const dispLisandro = totalIngLisandro - (mitadCompartidos + totalGPropLisandro + ahorros.Lisandro + consumosLisandroPropio)
  const dispCatriel = totalIngCatriel - (mitadCompartidos + totalGPropCatriel + ahorros.Catriel + consumosCatrielPropio)

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

        {/* ESTRUCTURA PRINCIPAL EN 3 COLUMNAS */}
        <div style={styles.mainGrid}>
          
          {/* COLUMNA LISANDRO */}
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
                    <button onClick={() => borrarIngreso(i.id)} style={styles.btnIcon}>🗑️</button>
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
              <span style={styles.boxTitle}>🛍️ GASTOS PROPIOS LISANDRO</span>
              {gPropLisandro.length === 0 ? (
                <p style={styles.emptyText}>Sin gastos propios</p>
              ) : (
                gPropLisandro.map(g => (
                  <div key={g.id} style={styles.itemDesglosado}>
                    <span>{g.descripcion}: <strong>${Number(g.monto).toLocaleString()}</strong></span>
                    <button onClick={() => borrarGastoPropio(g.id)} style={styles.btnIcon}>🗑️</button>
                  </div>
                ))
              )}
              <p style={{ textAlign: 'right', marginTop: '6px', fontSize: '12px', borderTop: '1px solid #bae6fd', paddingTop: '4px' }}>
                Subtotal Propio: <strong>${totalGPropLisandro.toLocaleString()}</strong>
              </p>
            </div>

            {/* TARJETAS LISANDRO */}
            <div style={styles.cardGroupTitle}>💳 Tarjetas de Lisandro</div>
            {tarjLisandro.length === 0 ? (
              <p style={styles.emptyText}>Sin tarjetas creadas</p>
            ) : (
              tarjLisandro.map(t => {
                const consumosEstaTarjeta = consumosTarjetas.filter(c => c.tarjeta_id === t.id)
                const totalResumen = consumosEstaTarjeta.reduce((acc, c) => acc + Number(c.monto_cuota), 0)
                return (
                  <div key={t.id} style={styles.cardItemBlue}>
                    <div style={styles.rowFlex}>
                      <span>💳 <strong>{t.nombre}</strong></span>
                      <button onClick={() => borrarTarjeta(t.id)} style={styles.btnIcon}>🗑️</button>
                    </div>
                    {consumosEstaTarjeta.map(c => (
                      <div key={c.id} style={styles.itemDesglosadoConsumo}>
                        <span>{c.descripcion} ({c.cuota_actual}/{c.total_cuotas}): <strong>${Number(c.monto_cuota).toLocaleString()}</strong> [{c.quien_paga}]</span>
                        <button onClick={() => borrarConsumo(c.id)} style={styles.btnIcon}>🗑️</button>
                      </div>
                    ))}
                    <p style={{ fontSize: '11px', margin: '4px 0 0 0', color: '#0284c7', textAlign: 'right', fontWeight: 'bold' }}>
                      Total Resumen: ${totalResumen.toLocaleString()}
                    </p>
                  </div>
                )
              })
            )}
          </div>

          {/* COLUMNA COMPARTIDO */}
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

            {/* SECCIÓN LIQUIDACIÓN DE TARJETAS COMPARTIDAS */}
            <div style={{ marginTop: '16px', borderTop: '1px solid #fef08a', paddingTop: '10px' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#854d0e' }}>💳 Tarjetas Compartidas</h4>
              <div style={styles.infoRowLightBlue}>
                <span>En tarjetas de Lisandro:</span>
                <strong>${tarjCompLisandro.toLocaleString()}</strong>
              </div>
              <div style={{ ...styles.infoRowLightGreen, marginTop: '4px' }}>
                <span>En tarjetas de Catriel:</span>
                <strong>${tarjCompCatriel.toLocaleString()}</strong>
              </div>
              <div style={styles.infoRowLightYellow}>
                <span>Paga CADA UNO (50%):</span>
                <strong>${mitadTarjComp.toLocaleString()}</strong>
              </div>
            </div>
          </div>

          {/* COLUMNA CATRIEL */}
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
                    <button onClick={() => borrarIngreso(i.id)} style={styles.btnIcon}>🗑️</button>
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
              <span style={styles.boxTitle}>🛍️ GASTOS PROPIOS CATRIEL</span>
              {gPropCatriel.length === 0 ? (
                <p style={styles.emptyText}>Sin gastos propios</p>
              ) : (
                gPropCatriel.map(g => (
                  <div key={g.id} style={styles.itemDesglosado}>
                    <span>{g.descripcion}: <strong>${Number(g.monto).toLocaleString()}</strong></span>
                    <button onClick={() => borrarGastoPropio(g.id)} style={styles.btnIcon}>🗑️</button>
                  </div>
                ))
              )}
              <p style={{ textAlign: 'right', marginTop: '6px', fontSize: '12px', borderTop: '1px solid #bbf7d0', paddingTop: '4px' }}>
                Subtotal Propio: <strong>${totalGPropCatriel.toLocaleString()}</strong>
              </p>
            </div>

            {/* TARJETAS CATRIEL */}
            <div style={styles.cardGroupTitleGreen}>💳 Tarjetas de Catriel</div>
            {tarjCatriel.length === 0 ? (
              <p style={styles.emptyText}>Sin tarjetas creadas</p>
            ) : (
              tarjCatriel.map(t => {
                const consumosEstaTarjeta = consumosTarjetas.filter(c => c.tarjeta_id === t.id)
                const totalResumen = consumosEstaTarjeta.reduce((acc, c) => acc + Number(c.monto_cuota), 0)
                return (
                  <div key={t.id} style={styles.cardItemGreen}>
                    <div style={styles.rowFlex}>
                      <span>💳 <strong>{t.nombre}</strong></span>
                      <button onClick={() => borrarTarjeta(t.id)} style={styles.btnIcon}>🗑️</button>
                    </div>
                    {consumosEstaTarjeta.map(c => (
                      <div key={c.id} style={styles.itemDesglosadoConsumo}>
                        <span>{c.descripcion} ({c.cuota_actual}/{c.total_cuotas}): <strong>${Number(c.monto_cuota).toLocaleString()}</strong> [{c.quien_paga}]</span>
                        <button onClick={() => borrarConsumo(c.id)} style={styles.btnIcon}>🗑️</button>
                      </div>
                    ))}
                    <p style={{ fontSize: '11px', margin: '4px 0 0 0', color: '#16a34a', textAlign: 'right', fontWeight: 'bold' }}>
                      Total Resumen: ${totalResumen.toLocaleString()}
                    </p>
                  </div>
                )
              })
            )}
          </div>

        </div>

        {/* SECCIONES INFERIORES */}
        <div style={styles.bottomSection}>
          
          {/* CARGO JUSTO Y COMBUSTIBLE */}
          <div style={styles.grid2Col}>
            
            {/* Cargo Justo Tarjetas */}
            <div style={styles.cardWhite}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '13px' }}>📊 Cargo Justo de Tarjetas (Solo Gastos Propios)</h4>
              <div style={styles.rowFlex}>
                <div style={styles.boxMiniBlue}>
                  <span style={{ fontSize: '11px' }}>LISANDRO (PROPIO)</span>
                  <p style={{ fontSize: '15px', fontWeight: 'bold', color: '#0284c7', margin: '2px 0' }}>${consumosLisandroPropio.toLocaleString()}</p>
                </div>
                <div style={styles.boxMiniGreen}>
                  <span style={{ fontSize: '11px' }}>CATRIEL (PROPIO)</span>
                  <p style={{ fontSize: '15px', fontWeight: 'bold', color: '#16a34a', margin: '2px 0' }}>${consumosCatrielPropio.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Combustible */}
            <div style={{ ...styles.cardWhite, border: '1px solid #fdba74' }}>
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
                  placeholder="$ Monto"
                  value={nuevoCombustible.monto}
                  onChange={e => setNuevoCombustible({ ...nuevoCombustible, monto: e.target.value })}
                  style={styles.inputFlex}
                />
                <button type="submit" style={styles.btnOrange}>+ Cargar</button>
              </form>
            </div>
          </div>

          {/* BALANCE NETO DEL MES */}
          <div style={{ ...styles.balanceNetoCard, marginTop: '12px' }}>
            <h3 style={{ textAlign: 'center', margin: '0 0 8px 0', fontSize: '14px' }}>💰 BALANCE NETO DEL MES</h3>
            <div style={styles.rowFlex}>
              <div style={styles.balanceColBlue}>
                <h4 style={{ color: '#0284c7', margin: 0, fontSize: '12px' }}>LISANDRO</h4>
                <p style={{ margin: '2px 0', fontSize: '11px' }}>Ingresos: ${totalIngLisandro.toLocaleString()}</p>
                <p style={{ margin: '2px 0', fontSize: '11px' }}>Gastos: ${(mitadCompartidos + totalGPropLisandro + consumosLisandroPropio).toLocaleString()}</p>
                <p style={{ margin: '2px 0', fontSize: '12px' }}>DISPONIBLE: <strong style={{ color: dispLisandro < 0 ? '#ef4444' : '#22c55e' }}>${dispLisandro.toLocaleString()}</strong></p>
              </div>
              <div style={styles.balanceColGreen}>
                <h4 style={{ color: '#16a34a', margin: 0, fontSize: '12px' }}>CATRIEL</h4>
                <p style={{ margin: '2px 0', fontSize: '11px' }}>Ingresos: ${totalIngCatriel.toLocaleString()}</p>
                <p style={{ margin: '2px 0', fontSize: '11px' }}>Gastos: ${(mitadCompartidos + totalGPropCatriel + consumosCatrielPropio).toLocaleString()}</p>
                <p style={{ margin: '2px 0', fontSize: '12px' }}>DISPONIBLE: <strong style={{ color: dispCatriel < 0 ? '#ef4444' : '#22c55e' }}>${dispCatriel.toLocaleString()}</strong></p>
              </div>
            </div>
          </div>

          {/* Cargar Consumo de Tarjetas */}
          <div style={{ ...styles.cardWhite, border: '2px solid #3b82f6', marginTop: '12px' }}>
            <h4 style={{ color: '#1d4ed8', margin: '0 0 8px 0', fontSize: '13px' }}>💳 Cargar Nuevo Consumo con Tarjeta</h4>
            <form onSubmit={agregarConsumo}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr 1fr 0.8fr 0.8fr 1fr', gap: '6px', alignItems: 'center' }}>
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
                    placeholder="Ej. Súper / Compra"
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
                  <label style={styles.labelMini}>Cuota Actual:</label>
                  <input
                    type="number"
                    value={nuevoConsumo.cuotaActual}
                    onChange={e => setNuevoConsumo({ ...nuevoConsumo, cuotaActual: e.target.value })}
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
                    value={nuevoConsumo.quienPaga}
                    onChange={e => setNuevoConsumo({ ...nuevoConsumo, quienPaga: e.target.value })}
                    style={styles.selectFull}
                  >
                    <option value="Catriel">Catriel</option>
                    <option value="Lisandro">Lisandro</option>
                    <option value="Compartido">Compartido</option>
                  </select>
                </div>
              </div>
              <button type="submit" style={{ ...styles.btnBlueFull, marginTop: '8px' }}>+ Cargar Consumo de Tarjeta</button>
            </form>
          </div>

          {/* Cargar Préstamo */}
          <div style={{ ...styles.cardWhite, border: '2px solid #a855f7', marginTop: '12px' }}>
            <h4 style={{ color: '#7e22ce', margin: '0 0 8px 0', fontSize: '13px' }}>🏛️ Cargar Nuevo Préstamo / Crédito</h4>
            <form onSubmit={agregarPrestamo} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 0.8fr 0.8fr 1.2fr 1fr', gap: '6px' }}>
              <input type="text" placeholder="Entidad (ej: Banco Hipotecario)" value={nuevoPrestamo.entidad} onChange={e => setNuevoPrestamo({ ...nuevoPrestamo, entidad: e.target.value })} style={styles.inputFull} />
              <input type="number" placeholder="$ Cuota" value={nuevoPrestamo.montoCuota} onChange={e => setNuevoPrestamo({ ...nuevoPrestamo, montoCuota: e.target.value })} style={styles.inputFull} />
              <input type="number" value={nuevoPrestamo.cuotaActual} onChange={e => setNuevoPrestamo({ ...nuevoPrestamo, cuotaActual: e.target.value })} style={styles.inputFull} />
              <input type="number" value={nuevoPrestamo.totalCuotas} onChange={e => setNuevoPrestamo({ ...nuevoPrestamo, totalCuotas: e.target.value })} style={styles.inputFull} />
              <select value={nuevoPrestamo.tipo} onChange={e => setNuevoPrestamo({ ...nuevoPrestamo, tipo: e.target.value })} style={styles.selectFull}>
                <option value="Compartido (Centro)">Compartido (Centro)</option>
                <option value="Lisandro">Lisandro</option>
                <option value="Catriel">Catriel</option>
              </select>
              <button type="submit" style={styles.btnPurpleFull}>+ Cargar Préstamo</button>
            </form>
          </div>

          {/* CREACIÓN DE INGRESOS, GASTOS PROPIOS Y TARJETAS */}
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
                placeholder="Descripción (ej. Sueldo)"
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
                placeholder="Descripción (ej. Ropa)"
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
  totText: { fontSize: '12px', fontWeight: 'bold', margin: '2px 0 4px 0' },
  montoText: { fontSize: '15px', fontWeight: 'bold', margin: '2px 0' },
  inputMini: { width: '100%', padding: '2px 4px', fontSize: '10px', borderRadius: '4px', border: '1px solid #cbd5e1' },
  cardGroupTitle: { fontSize: '12px', fontWeight: 'bold', color: '#0369a1', marginTop: '12px' },
  cardGroupTitleGreen: { fontSize: '12px', fontWeight: 'bold', color: '#15803d', marginTop: '12px' },
  emptyText: { fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', margin: '4px 0' },
  rowFlex: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  btnIcon: { background: 'none', border: 'none', cursor: 'pointer', marginLeft: '4px', fontSize: '11px' },
  inputFlex: { padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', flex: 1 },
  btnOrange: { backgroundColor: '#d97706', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' },
  bottomSection: { marginTop: '14px' },
  grid2Col: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  grid3Col: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' },
  cardWhite: { backgroundColor: '#fff', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' },
  boxMiniBlue: { backgroundColor: '#e0f2fe', padding: '8px', borderRadius: '6px', width: '48%' },
  boxMiniGreen: { backgroundColor: '#dcfce7', padding: '8px', borderRadius: '6px', width: '48%' },
  boxMiniOrange: { backgroundColor: '#ffedd5', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', width: '48%' },
  balanceNetoCard: { backgroundColor: '#fff', padding: '12px', borderRadius: '12px', border: '1.5px solid #0f172a' },
  balanceColBlue: { backgroundColor: '#f0f9ff', padding: '8px', borderRadius: '6px', width: '48%' },
  balanceColGreen: { backgroundColor: '#f0fdf4', padding: '8px', borderRadius: '6px', width: '48%' },
  selectStyle: { padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff', fontSize: '12px' },
  selectFull: { width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff', fontSize: '12px', marginTop: '2px' },
  inputFull: { width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', marginTop: '2px', boxSizing: 'border-box' },
  btnBlueFull: { width: '100%', backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '6px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px', marginTop: '6px' },
  btnPurpleFull: { width: '100%', backgroundColor: '#9333ea', color: '#fff', border: 'none', padding: '6px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px', marginTop: '2px' },
  formTitle: { fontSize: '12px', margin: '0 0 4px 0', color: '#1e293b' },
  itemDesglosado: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', marginTop: '2px', backgroundColor: '#f8fafc', padding: '2px 4px', borderRadius: '4px' },
  itemDesglosadoConsumo: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: '#475569', marginTop: '2px', borderTop: '1px dashed #e2e8f0', paddingTop: '2px' },
  labelMini: { fontSize: '10px', fontWeight: 'bold', color: '#475569', display: 'block' },
  infoRowLightBlue: { backgroundColor: '#e0f2fe', padding: '6px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '11px' },
  infoRowLightGreen: { backgroundColor: '#dcfce7', padding: '6px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '11px' },
  infoRowLightYellow: { backgroundColor: '#fef08a', padding: '6px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '4px' }
}
