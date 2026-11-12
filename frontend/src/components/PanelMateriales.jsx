import { useCallback, useEffect, useState } from 'react'
import api from '../api'
import ListadoMateriales from './ListadoMateriales'
import FormularioMaterial from './FormularioMaterial'
import ResumenMateriales from './ResumenMateriales'
import FiltroMateriales from './FiltroMateriales'
import Notificacion from './Notificacion'

// Función adaptadora (Ejercicio 10): Convierte decimales y números recibidos como texto
const adaptarMaterial = (m) => ({
  ...m,
  precio_unitario: Number(m.precio_unitario),
  stock: Number(m.stock),
  categoria_nombre: m.categoria_nombre || 'Sin categoría',
})

// Componente Padre del Panel Administrativo de Insumos (Módulo Logistics)
function PanelMateriales() {
  const [materiales, setMateriales] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  // Estado para el registro en edición (Ejercicio 11)
  const [materialEditando, setMaterialEditando] = useState(null)

  // Estados controlados para el buscador y filtro por categoría (Ejercicio 13)
  const [texto, setTexto] = useState('')
  const [categoria, setCategoria] = useState('')
  const [mensaje, setMensaje] = useState(null)

  const cerrarMensaje = useCallback(() => setMensaje(null), [])
  const avisar = (contenido) => setMensaje({ texto: contenido, hora: Date.now() })

  // Solicitud GET con useEffect parametrizado y AbortController (Ejercicio 13)
  useEffect(() => {
    // Instancia de AbortController para cancelar peticiones pendientes en cada cambio
    const controller = new AbortController()

    const cargarMateriales = async () => {
      setCargando(true)
      setError(null)
      try {
        // Parámetros dinámicos enviados a Django (?search= y ?categoria=)
        const params = {}
        if (texto.trim()) params.search = texto.trim()
        if (categoria) params.categoria = categoria

        const respuesta = await api.get('/materiales/', {
          params,
          signal: controller.signal,
        })

        const materialesAdaptados = respuesta.data.map(adaptarMaterial)
        setMateriales(materialesAdaptados)
      } catch (err) {
        // Ignorar si la petición fue cancelada por nueva entrada del usuario
        if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
          return
        }
        console.error('Error al cargar insumos desde la API:', err)
        setError('No se pudo cargar el listado de insumos textiles desde el servidor.')
      } finally {
        setCargando(false)
      }
    }

    cargarMateriales()

    // Limpieza del efecto: cancela la petición pendiente si el usuario sigue escribiendo o cambiando filtros
    return () => {
      controller.abort()
    }
  }, [texto, categoria]) // Recarga cada vez que cambia el texto o la categoría seleccionada

  // Iniciar edición de una fila
  const iniciarEdicion = (material) => {
    setMaterialEditando(material)
    avisar(`Editando: ${material.nombre}`)
  }

  // Cancelar edición
  const cancelarEdicion = () => {
    setMaterialEditando(null)
  }

  // Alta y Edición con POST y PATCH/PUT (Ejercicio 11)
  const guardarMaterial = async (datos) => {
    try {
      if (materialEditando) {
        const respuesta = await api.patch(`/materiales/${materialEditando.id}/`, datos)
        const adaptado = adaptarMaterial(respuesta.data)

        setMateriales((anteriores) =>
          anteriores.map((m) => (m.id === materialEditando.id ? adaptado : m))
        )
        avisar(`Se actualizó ${adaptado.nombre} (200 OK)`)
        setMaterialEditando(null)
        return { exito: true }
      } else {
        const respuesta = await api.post('/materiales/', datos)
        const adaptado = adaptarMaterial(respuesta.data)

        setMateriales((anteriores) => [...anteriores, adaptado])
        avisar(`Se registró ${adaptado.nombre} (201 Created)`)
        return { exito: true }
      }
    } catch (err) {
      console.error('Error al guardar insumo:', err)
      if (err.response && err.response.data) {
        return { exito: false, errores: err.response.data }
      }
      return { exito: false, errorGeneral: 'Error de conexión con el servidor.' }
    }
  }

  // Reponer stock con PATCH (Ejercicio 11)
  const reponerStock = async (id) => {
    const material = materiales.find((m) => m.id === id)
    if (!material) return
    const nuevoStock = material.stock + 10

    try {
      const respuesta = await api.patch(`/materiales/${id}/`, { stock: nuevoStock })
      const adaptado = adaptarMaterial(respuesta.data)
      setMateriales((anteriores) =>
        anteriores.map((m) => (m.id === id ? adaptado : m))
      )
      avisar(`Se repusieron 10 ${adaptado.unidad_medida.toLowerCase()} de ${adaptado.nombre} (200 OK)`)
    } catch (err) {
      console.error('Error al reponer stock:', err)
      avisar('Error al actualizar el stock en el servidor.')
    }
  }

  // Eliminar: ejecuta api.delete(...) con confirmación previa y maneja 204 y 404 (Ejercicio 12)
  const eliminarMaterial = async (id) => {
    const material = materiales.find((m) => m.id === id)
    const nombre = material ? material.nombre : `Insumo #${id}`

    try {
      const respuesta = await api.delete(`/materiales/${id}/`)

      if (respuesta.status === 204 || respuesta.status === 200) {
        setMateriales((anteriores) => anteriores.filter((m) => m.id !== id))
        avisar(`Se eliminó permanentemente ${nombre} (204 No Content)`)
      }
    } catch (err) {
      console.error('Error al eliminar insumo:', err)
      if (err.response && err.response.status === 404) {
        avisar(`El insumo "${nombre}" ya no existe en el servidor (404 Not Found). Se actualizó la lista.`)
        setMateriales((anteriores) => anteriores.filter((m) => m.id !== id))
      } else {
        avisar('No se pudo eliminar el insumo. Verifique la conexión con el servidor.')
      }
    }
  }

  // Título de la pestaña
  useEffect(() => {
    document.title = `Panel de insumos (${materiales.length}) — UrbanTrend`
    return () => {
      document.title = 'UrbanTrend'
    }
  }, [materiales.length])

  return (
    <div className="contenedor panel">
      <h1 className="titulo">Panel de insumos textiles</h1>

      {/* Estados visuales: Error */}
      {error && !cargando && (
        <div style={{ padding: '14px 18px', background: '#ffe4e6', color: '#be123c', borderRadius: '8px', fontWeight: 600, marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {/* Resumen: calcula los totales (conteo, promedio, inventario) con los datos recibidos de la API (Ejercicio 13) */}
      <ResumenMateriales materiales={materiales} />

      {/* Formulario de alta y edición conectado con la API */}
      <FormularioMaterial
        key={materialEditando ? materialEditando.id : 'nuevo'}
        materialEditando={materialEditando}
        onGuardar={guardarMaterial}
        onCancelar={cancelarEdicion}
      />

      {/* Filtro y buscador que envían sus valores como parámetros a la API (Ejercicio 13) */}
      <FiltroMateriales
        texto={texto}
        categoria={categoria}
        onCambiarTexto={setTexto}
        onCambiarCategoria={setCategoria}
      />

      {/* Indicador de URL con parámetros generados en la API */}
      {(texto || categoria) && (
        <div style={{ margin: '-6px 0 14px', fontSize: '0.85rem', color: '#0f766e', fontWeight: 600 }}>
          Petición activa a la API:{' '}
          <code>
            GET /api/materiales/?
            {[texto && `search=${encodeURIComponent(texto)}`, categoria && `categoria=${encodeURIComponent(categoria)}`]
              .filter(Boolean)
              .join('&')}
          </code>
        </div>
      )}

      {/* Estados visuales: Cargando */}
      {cargando && (
        <p style={{ padding: '16px', background: '#f1f5f9', borderRadius: '8px', color: '#0f766e', fontWeight: 600 }}>
          Cargando insumos textiles desde la API...
        </p>
      )}

      {/* Listado con datos reales recibidos de la API */}
      {!cargando && (
        <ListadoMateriales
          materiales={materiales}
          onReponer={reponerStock}
          onEliminar={eliminarMaterial}
          onEditar={iniciarEdicion}
        />
      )}

      <Notificacion mensaje={mensaje} onCerrar={cerrarMensaje} />
    </div>
  )
}

export default PanelMateriales
