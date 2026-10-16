import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function App() {
  const [data, setData] = useState({
    gastosCatriel: [],
    gastosLisandro: []
  });
  const [cargando, setCargando] = useState(true);
  const [estado, setEstado] = useState('Conectando...');

  // Formulario
  const [persona, setPersona] = useState('Catriel');
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [esCompartido, setEsCompartido] = useState(false);

  useEffect(() => {
    cargarDatos();

    // Escuchar cambios en vivo
    const canal = supabase
      .channel('cambios-finanzas')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'finanzas' },
        (payload) => {
          if (payload.new && payload.new.content) {
            setData(payload.new.content);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const { data: res, error } = await supabase
        .from('finanzas')
        .select('content')
        .eq('key', 'datos_hogar')
        .single();

      if (error) {
        console.error(error);
        setEstado('Error de conexión');
      } else if (res && res.content) {
        setData(res.content);
        setEstado('🟢 Sincronizado en tiempo real');
      }
    } catch (e) {
      console.error(e);
      setEstado('Error al cargar');
    } finally {
      setCargando(false);
    }
  };

  const guardar = async (nuevosDatos) => {
    setData(nuevosDatos);
    try {
      await supabase
        .from('finanzas')
        .upsert({ key: 'datos_hogar', content: nuevosDatos }, { onConflict: 'key' });
    } catch (e) {
      console.error(e);
    }
  };

  const agregarGasto = (e) => {
    e.preventDefault();
    if (!descripcion || !monto) return;

    const nuevoGasto = {
      id: Date.now(),
      descripcion,
      monto: parseFloat(monto),
      esCompartido,
      fecha: new Date().toLocaleDateString()
    };

    const campo = persona === 'Catriel' ? 'gastosCatriel' : 'gastosLisandro';
    const nuevosDatos = {
      ...data,
      [campo]: [...(data[campo] || []), nuevoGasto]
    };

    guardar(nuevosDatos);
    setDescripcion('');
    setMonto('');
  };

  const eliminarGasto = (quien, id) => {
    const campo = quien === 'Catriel' ? 'gastosCatriel' : 'gastosLisandro';
    const nuevosDatos = {
      ...data,
      [campo]: (data[campo] || []).filter((g) => g.id !== id)
    };
    guardar(nuevosDatos);
  };

  // Totales
  const catrielPropios = (data.gastosCatriel || []).filter(g => !g.esCompartido).reduce((a, b) => a + b.monto, 0);
  const catrielCompartidos = (data.gastosCatriel || []).filter(g => g.esCompartido).reduce((a, b) => a + b.monto, 0);

  const lisandroPropios = (data.gastosLisandro || []).filter(g => !g.esCompartido).reduce((a, b) => a + b.monto, 0);
  const lisandroCompartidos = (data.gastosLisandro || []).filter(g => g.esCompartido).reduce((a, b) => a + b.monto, 0);

  const dif = catrielCompartidos - lisandroCompartidos;
  let saldoTexto = 'Están al día en gastos compartidos';
  if (dif > 0) {
    saldoTexto = `Lisandro le debe $${(dif / 2).toLocaleString()} a Catriel`;
  } else if (dif < 0) {
    saldoTexto = `Catriel le debe $${(Math.abs(dif) / 2).toLocaleString()} a Lisandro`;
  }

  if (cargando) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
        <h2>🔄 Cargando Finanzas Compartidas...</h2>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'sans-serif', backgroundColor: '#f4f6f8', minHeight: '100vh', padding: '15px' }}>
      
      {/* Encabezado */}
      <div style={{ backgroundColor: '#fff', padding: '15px 20px', borderRadius: '10px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, color: '#333' }}>🏡 Finanzas Catriel & Lisandro</h2>
        <span style={{ fontSize: '13px', color: '#15803d', backgroundColor: '#dcfce7', padding: '4px 10px', borderRadius: '15px', fontWeight: 'bold' }}>
          {estado}
        </span>
      </div>

      {/* Balance 50/50 */}
      <div style={{ backgroundColor: '#3b82f6', color: '#fff', padding: '15px', borderRadius: '10px', marginBottom: '15px', textAlign: 'center' }}>
        <h3 style={{ margin: '0 0 5px 0', fontSize: '16px' }}>Balance Gastos Compartidos (50/50)</h3>
        <p style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>{saldoTexto}</p>
      </div>

      {/* Formulario */}
      <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '10px', marginBottom: '15px' }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>➕ Cargar Nuevo Gasto</h3>
        <form onSubmit={agregarGasto} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <select value={persona} onChange={(e) => setPersona(e.target.value)} style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }}>
            <option value="Catriel">Catriel</option>
            <option value="Lisandro">Lisandro</option>
          </select>

          <input
            type="text"
            placeholder="Descripción (ej. Alquiler)"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ccc', flex: '1', minWidth: '150px' }}
          />

          <input
            type="number"
            placeholder="Monto ($)"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ccc', width: '100px' }}
          />

          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px' }}>
            <input type="checkbox" checked={esCompartido} onChange={(e) => setEsCompartido(e.target.checked)} />
            Compartido (50/50)
          </label>

          <button type="submit" style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
            Guardar
          </button>
        </form>
      </div>

      {/* Listas de Gastos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px' }}>
        
        {/* Catriel */}
        <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '10px' }}>
          <h3 style={{ color: '#2563eb', margin: '0 0 5px 0' }}>Catriel</h3>
          <p style={{ fontSize: '13px', color: '#666', margin: '0 0 10px 0' }}>
            Propios: ${catrielPropios.toLocaleString()} \vert{} Compartidos:${catrielCompartidos.toLocaleString()}
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {(data.gastosCatriel || []).map((g) => (
              <li key={g.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
                <div>
                  <strong>{g.descripcion}</strong> {g.esCompartido && <small style={{ color: '#2563eb' }}>(Compartido)</small>}
                </div>
                <div>
                  <span style={{ fontWeight: 'bold', marginRight: '8px' }}>${g.monto.toLocaleString()}</span>
                  <button onClick={() => eliminarGasto('Catriel', g.id)} style={{ border: 'none', background: 'none', color: 'red', cursor: 'pointer' }}>✕</button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Lisandro */}
        <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '10px' }}>
          <h3 style={{ color: '#059669', margin: '0 0 5px 0' }}>Lisandro</h3>
          <p style={{ fontSize: '13px', color: '#666', margin: '0 0 10px 0' }}>
            Propios: ${lisandroPropios.toLocaleString()} \vert{} Compartidos:${lisandroCompartidos.toLocaleString()}
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {(data.gastosLisandro || []).map((g) => (
              <li key={g.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
                <div>
                  <strong>{g.descripcion}</strong> {g.esCompartido && <small style={{ color: '#059669' }}>(Compartido)</small>}
                </div>
                <div>
                  <span style={{ fontWeight: 'bold', marginRight: '8px' }}>${g.monto.toLocaleString()}</span>
                  <button onClick={() => eliminarGasto('Lisandro', g.id)} style={{ border: 'none', background: 'none', color: 'red', cursor: 'pointer' }}>✕</button>
                </div>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  );
}
