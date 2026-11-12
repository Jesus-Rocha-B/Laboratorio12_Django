import { useEffect, useState } from 'react'
import api from '../api'

const VALORES_INICIALES = {
  nombre: '',
  marca: 'Rebel',
  categoria: 'Polos',
  tipo: 'Unisex',
  talla: 'M',
  precio: '',
  stock: 10,
  descripcion: 'Prenda registrada desde React con Axios',
}

function ListaPractica() {
  const [prendas, setPrendas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  // Estado para el buscador controlado (Ejercicio 8)
  const [buscar, setBuscar] = useState('')

  // Estados para el formulario (Ejercicio 6)
  const [formulario, setFormulario] = useState(VALORES_INICIALES)
  const [errorFormulario, setErrorFormulario] = useState(null)
  const [enviando, setEnviando] = useState(false)

  // useEffect con dependencia [buscar] para recargar con ?search= (Ejercicio 4, 5 y 8)
  useEffect(() => {
    const obtenerPrendas = async () => {
      setCargando(true)
      setError(null)
      try {
        // params genera automáticamente la query string ?search=<buscar>
        const respuesta = await api.get('/prendas/', {
          params: buscar.trim() ? { search: buscar.trim() } : {},
        })
        setPrendas(respuesta.data)
      } catch (err) {
        console.error('Error al obtener la lista de prendas:', err)
        setError('No se pudo cargar la lista.')
      } finally {
        setCargando(false)
      }
    }

    obtenerPrendas()
  }, [buscar]) // Recarga cada vez que el texto de búsqueda cambia

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormulario({ ...formulario, [name]: value })
  }

  // POST: Crear registro (Ejercicio 6)
  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorFormulario(null)
    setEnviando(true)

    try {
      const respuesta = await api.post('/prendas/', formulario)
      setPrendas((anteriores) => [...anteriores, respuesta.data])
      setFormulario(VALORES_INICIALES)
    } catch (err) {
      console.error('Error al crear prenda:', err)
      if (err.response && err.response.data) {
        const erroresBackend = err.response.data
        if (typeof erroresBackend === 'object') {
          const mensajes = Object.entries(erroresBackend).map(
            ([campo, msgs]) => `${campo}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`
          )
          setErrorFormulario(mensajes.join(' | '))
        } else {
          setErrorFormulario(String(erroresBackend))
        }
      } else {
        setErrorFormulario('Error de conexión al enviar el formulario.')
      }
    } finally {
      setEnviando(false)
    }
  }

  // DELETE: Eliminar registro (Ejercicio 7)
  const handleEliminar = async (id) => {
    try {
      const respuesta = await api.delete(`/prendas/${id}/`)
      if (respuesta.status === 204 || respuesta.status === 200) {
        setPrendas((anteriores) => anteriores.filter((p) => p.id !== id))
      }
    } catch (err) {
      console.error('Error al eliminar prenda:', err)
      alert('No se pudo eliminar el registro.')
    }
  }

  // PATCH: Modificar registro (Ejercicio 7)
  const handleReponerStock = async (id, stockActual) => {
    try {
      const nuevoStock = Number(stockActual) + 5
      const respuesta = await api.patch(`/prendas/${id}/`, { stock: nuevoStock })

      if (respuesta.status === 200) {
        setPrendas((anteriores) =>
          anteriores.map((p) => (p.id === id ? respuesta.data : p))
        )
      }
    } catch (err) {
      console.error('Error al actualizar prenda con PATCH:', err)
      alert('No se pudo actualizar el stock.')
    }
  }

  return (
    <div className="contenedor">
      <h1 className="titulo">Parte 1 — CRUD y Búsqueda (API Django + Axios)</h1>
      <p style={{ color: '#64748b', marginBottom: '16px' }}>
        Operaciones completas con GET (?search=), POST, PATCH y DELETE.
      </p>

      {/* Formulario POST (Ejercicio 6) */}
      <form onSubmit={handleSubmit} className="formulario" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
        <h2>Registrar nueva prenda (POST)</h2>

        {errorFormulario && (
          <div className="error">
            <strong>Error de validación (400): </strong>
            {errorFormulario}
          </div>
        )}

        <label>
          Nombre
          <input
            type="text"
            name="nombre"
            value={formulario.nombre}
            onChange={handleChange}
            placeholder="Ej. Casaca Denim Cargo"
            required
          />
        </label>

        <label>
          Marca
          <input
            type="text"
            name="marca"
            value={formulario.marca}
            onChange={handleChange}
            placeholder="Marca"
            required
          />
        </label>

        <label>
          Categoría
          <select name="categoria" value={formulario.categoria} onChange={handleChange}>
            <option value="Polos">Polos</option>
            <option value="Jeans">Jeans</option>
            <option value="Casacas y Poleras">Casacas y Poleras</option>
            <option value="Vestidos">Vestidos</option>
            <option value="Ropa Deportiva">Ropa Deportiva</option>
            <option value="Calzado">Calzado</option>
          </select>
        </label>

        <label>
          Talla
          <select name="talla" value={formulario.talla} onChange={handleChange}>
            <option value="S">S</option>
            <option value="M">M</option>
            <option value="L">L</option>
            <option value="XL">XL</option>
            <option value="30">30</option>
            <option value="32">32</option>
            <option value="Única">Única</option>
          </select>
        </label>

        <label>
          Precio (S/)
          <input
            type="number"
            step="0.01"
            name="precio"
            value={formulario.precio}
            onChange={handleChange}
            placeholder="Ej. 120.00"
            required
          />
        </label>

        <label>
          Stock
          <input
            type="number"
            name="stock"
            value={formulario.stock}
            onChange={handleChange}
            min="0"
            required
          />
        </label>

        <button
          type="submit"
          className="boton"
          disabled={enviando}
          style={{ alignSelf: 'end', height: '38px', gridColumn: 'span 2' }}
        >
          {enviando ? 'Guardando...' : 'Crear Prenda (POST)'}
        </button>
      </form>

      {/* Buscador controlado con parámetro ?search= (Ejercicio 8) */}
      <div style={{ margin: '20px 0 14px' }}>
        <input
          type="text"
          className="buscador"
          style={{ marginTop: 0 }}
          placeholder="Buscar por nombre, marca o categoría (genera ?search= en la API)..."
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
        />
        {buscar && (
          <small style={{ color: '#0f766e', fontWeight: 600 }}>
            Filtrando con parámetro: <code>?search={buscar}</code>
          </small>
        )}
      </div>

      {/* Estados */}
      {cargando && (
        <p style={{ padding: '16px', background: '#f1f5f9', borderRadius: '8px', color: '#0f766e', fontWeight: 600 }}>
          Cargando...
        </p>
      )}

      {error && !cargando && (
        <div style={{ padding: '16px', background: '#ffe4e6', color: '#be123c', borderRadius: '8px', fontWeight: 600 }}>
          {error}
        </div>
      )}

      {!cargando && !error && prendas.length === 0 && (
        <p className="vacio">No se encontraron prendas que coincidan con &quot;{buscar}&quot;.</p>
      )}

      {/* Lista */}
      {!cargando && !error && prendas.length > 0 && (
        <ul className="lista">
          {prendas.map((prenda) => (
            <li key={prenda.id} className="tarjeta fila">
              <div>
                <strong>{prenda.nombre}</strong> — S/ {prenda.precio}
                <span className={`etiqueta ${prenda.stock === 0 ? 'agotado' : ''}`}>
                  {prenda.stock > 0 ? `Stock: ${prenda.stock}` : 'Agotado'}
                </span>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
                  Marca: {prenda.marca} | Categoría: {prenda.categoria} | Talla: {prenda.talla}
                </div>
              </div>

              {/* Botones de acción */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  type="button"
                  className="boton"
                  style={{ background: '#0284c7', fontSize: '0.85rem' }}
                  onClick={() => handleReponerStock(prenda.id, prenda.stock)}
                >
                  +5 Stock (PATCH)
                </button>
                <button
                  type="button"
                  className="boton secundario"
                  style={{ fontSize: '0.85rem' }}
                  onClick={() => handleEliminar(prenda.id)}
                >
                  Eliminar (DELETE)
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default ListaPractica
