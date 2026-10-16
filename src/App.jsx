import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function App() {
  const [transacciones, setTransacciones] = useState([])
  const [cargando, setCargando] = useState(true)

  // Formulario
  const [descripcion, setDescripcion] = useState('')
  const [monto, setMonto] = useState('')
  const [tipo, setTipo] = useState('gasto') // 'gasto' o 'ingreso'
  const [categoria, setCategoria] = useState('Comida')
  const [pagadoPor, setPagadoPor] = useState('Catriel')
  const [filtroPersona, setFiltroPersona] = useState('Todos')

  // Cargar transacciones e iniciar suscripción en tiempo real
  useEffect(() => {
    fetchTransacciones()

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transacciones' },
        () => {
          fetchTransacciones()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchTransacciones = async () => {
    try {
      const { data, error } = await supabase
        .from('transacciones')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) console.error('Error al cargar:', error)
      else setTransacciones(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setCargando(false)
    }
  }

  const agregarTransaccion = async (e) => {
    e.preventDefault()
    if (!descripcion || !monto) return

    const nueva = {
      descripcion,
      monto: parseFloat(monto),
      tipo,
      categoria,
      pagado_por: pagadoPor,
      fecha: new Date().toISOString()
    }

    const { error } = await supabase.from('transacciones').insert([nueva])

    if (error) {
      alert('Error al guardar la transacción')
      console.error(error)
    } else {
      setDescripcion('')
      setMonto('')
    }
  }

  const borrarTransaccion = async (id) => {
    const { error } = await supabase.from('transacciones').delete().eq('id', id)
    if (error) console.error('Error al borrar:', error)
  }

  // Cálculos Financieros
  const totalIngresos = transacciones
    .filter((t) => t.tipo === 'ingreso')
    .reduce((acc, t) => acc + Number(t.monto), 0)

  const totalGastos = transacciones
    .filter((t) => t.tipo === 'gasto')
    .reduce((acc, t) => acc + Number(t.monto), 0)

  const gastoCatriel = transacciones
    .filter((t) => t.tipo === 'gasto' && t.pagado_por === 'Catriel')
    .reduce((acc, t) => acc + Number(t.monto), 0)

  const gastoLisandro = transacciones
    .filter((t) => t.tipo === 'gasto' && t.pagado_por === 'Lisandro')
    .reduce((acc, t) => acc + Number(t.monto), 0)

  // Balance entre ambos (asumiendo gastos compartidos al 50%)
  const diferencia = (gastoCatriel - gastoLisandro) / 2

  const transaccionesFiltradas = transacciones.filter((t) => {
    if (filtroPersona === 'Todos') return true
    return t.pagado_por === filtroPersona
  })

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>Finanzas del Hogar 🏠</h1>
        <p>Catriel & Lisandro • Sincronización en tiempo real</p>
      </header>

      {/* Tarjetas de Resumen */}
      <div style={styles.gridCards}>
        <div style={{ ...styles.card, borderColor: '#22c55e' }}>
          <h3>Total Ingresos</h3>
          <p style={{ ...styles.monto, color: '#22c55e' }}>
            ${totalIngresos.toLocaleString()}
          </p>
        </div>

        <div style={{ ...styles.card, borderColor: '#ef4444' }}>
          <h3>Total Gastos</h3>
          <p style={{ ...styles.monto, color: '#ef4444' }}>
            ${totalGastos.toLocaleString()}
          </p>
        </div>

        <div style={{ ...styles.card, borderColor: '#3b82f6' }}>
          <h3>Balance Cuentas</h3>
          {diferencia > 0 ? (
            <p style={{ color: '#3b82f6', fontWeight: 'bold' }}>
              Lisandro le debe a Catriel: <strong>${Math.abs(diferencia).toLocaleString()}</strong>
            </p>
          ) : diferencia < 0 ? (
            <p style={{ color: '#3b82f6', fontWeight: 'bold' }}>
              Catriel le debe a Lisandro: <strong>${Math.abs(diferencia).toLocaleString()}</strong>
            </p>
          ) : (
            <p style={{ color: '#6b7280' }}>Están a mano 👍</p>
          )}
        </div>
      </div>

      {/* Formulario de Carga */}
      <section style={styles.section}>
        <h2>Cargar Nuevo Movimiento</h2>
        <form onSubmit={agregarTransaccion} style={styles.form}>
          <input
            type="text"
            placeholder="Descripción (ej. Compras Coto)"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            style={styles.input}
            required
          />
          <input
            type="number"
            step="0.01"
            placeholder="Monto ($)"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            style={styles.input}
            required
          />
          <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={styles.select}>
            <option value="gasto">Gasto</option>
            <option value="ingreso">Ingreso</option>
          </select>
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)} style={styles.select}>
            <option value="Comida">Comida / Supermercado</option>
            <option value="Servicios">Servicios (Luz, Gas, Internet)</option>
            <option value="Alquiler">Alquiler</option>
            <option value="Salidas">Salidas / Entretenimiento</option>

            <option value="Varios">Varios</option>
          </select>
          <select value={pagadoPor} onChange={(e) => setPagadoPor(e.target.value)} style={styles.select}>
            <option value="Catriel">Catriel</option>
            <option value="Lisandro">Lisandro</option>
          </select>
          <button type="submit" style={styles.button}>Añadir Movimiento</button>
        </form>
      </section>

      {/* Lista de Movimientos */}
      <section style={styles.section}>
        <div style={styles.listHeader}>
          <h2>Historial de Movimientos</h2>
          <div>
            <label style={{ marginRight: '8px' }}>Filtrar por:</label>
            <select
              value={filtroPersona}
              onChange={(e) => setFiltroPersona(e.target.value)}
              style={styles.selectSmall}
            >
              <option value="Todos">Todos</option>
              <option value="Catriel">Catriel</option>
              <option value="Lisandro">Lisandro</option>
            </select>
          </div>
        </div>

        {cargando ? (
          <p>Cargando datos...</p>
        ) : transaccionesFiltradas.length === 0 ? (
          <p style={{ color: '#6b7280' }}>No hay movimientos registrados.</p>
        ) : (
          <div style={styles.tablaContainer}>
            <table style={styles.tabla}>
              <thead>
                <tr>
                  <th>Descripción</th>
                  <th>Categoría</th>
                  <th>Persona</th>
                  <th>Monto</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {transaccionesFiltradas.map((t) => (
                  <tr key={t.id}>
                    <td>{t.descripcion}</td>
                    <td><span style={styles.tag}>{t.categoria}</span></td>
                    <td><strong>{t.pagado_por}</strong></td>
                    <td style={{ color: t.tipo === 'ingreso' ? '#22c55e' : '#ef4444', fontWeight: 'bold' }}>
                      {t.tipo === 'ingreso' ? '+' : '-'}${Number(t.monto).toLocaleString()}
                    </td>
                    <td>
                      <button onClick={() => borrarTransaccion(t.id)} style={styles.btnDelete}>
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

const styles = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
    color: '#1f2937',
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
  },
  gridCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  card: {
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    borderLeft: '6px solid #ccc',
  },
  monto: {
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '10px 0 0 0',
  },
  section: {
    backgroundColor: '#ffffff',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    marginBottom: '30px',
  },
  form: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '12px',
    marginTop: '15px',
  },
  input: {
    padding: '10px 14px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
  },
  select: {
    padding: '10px 14px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    backgroundColor: '#fff',
  },
  selectSmall: {
    padding: '6px 10px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
  },
  button: {
    gridColumn: '1 / -1',
    padding: '12px',
    backgroundColor: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  listHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
  },
  tablaContainer: {
    overflowX: 'auto',
  },
  tabla: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  tag: {
    backgroundColor: '#f3f4f6',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
  },
  btnDelete: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
  },
}
