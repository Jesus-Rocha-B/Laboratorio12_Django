import { useState } from 'react'

const categorias = [
  { id: 1, nombre: 'Telas y Tejidos' },
  { id: 2, nombre: 'Avíos y Fornituras' },
  { id: 3, nombre: 'Hilados y Conos' },
  { id: 4, nombre: 'Empaque y Etiquetas' },
]

const vacio = { nombre: '', categoria: '1', unidad_medida: 'Metros', precio_unitario: '', stock: '' }

// Formulario de alta y edición conectado con la API REST (Ejercicio 11)
function FormularioMaterial({ materialEditando, onGuardar, onCancelar }) {
  // Inicialización de estado controlada: se sincroniza mediante la prop key del padre
  const [campos, setCampos] = useState(() =>
    materialEditando
      ? {
          nombre: materialEditando.nombre || '',
          categoria: String(materialEditando.categoria || 1),
          unidad_medida: materialEditando.unidad_medida || 'Metros',
          precio_unitario: String(materialEditando.precio_unitario ?? ''),
          stock: String(materialEditando.stock ?? ''),
        }
      : vacio
  )
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const cambiar = (e) => {
    setCampos({ ...campos, [e.target.name]: e.target.value })
  }

  const enviar = async (e) => {
    e.preventDefault()
    setError('')

    if (campos.nombre.trim() === '') {
      setError('El nombre del insumo es obligatorio.')
      return
    }

    const categoriaSel = categorias.find((c) => c.id === Number(campos.categoria)) || categorias[0]
    const datosEnvio = {
      categoria: categoriaSel.id,
      nombre: campos.nombre.trim(),
      unidad_medida: campos.unidad_medida,
      precio_unitario: campos.precio_unitario === '' ? 0 : Number(campos.precio_unitario),
      stock: campos.stock === '' ? 0 : Number(campos.stock),
    }

    setGuardando(true)
    const resultado = await onGuardar(datosEnvio)
    setGuardando(false)

    if (resultado && !resultado.exito) {
      // Mostrar al usuario los mensajes de error 400 que envía el serializer de Django
      if (resultado.errores) {
        const mensajes = Object.entries(resultado.errores).map(
          ([campo, msgs]) => `${campo}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`
        )
        setError(mensajes.join(' | '))
      } else {
        setError(resultado.errorGeneral || 'Error al procesar la solicitud.')
      }
    } else {
      setCampos(vacio)
      setError('')
    }
  }

  return (
    <form className="formulario" onSubmit={enviar} noValidate>
      <h2>
        {materialEditando
          ? `Editar insumo: #${materialEditando.id} — ${materialEditando.nombre}`
          : 'Registrar nuevo insumo (POST)'}
      </h2>

      {error && (
        <p className="error">
          <strong>Error de validación (400): </strong>
          {error}
        </p>
      )}

      <label>
        Nombre
        <input
          name="nombre"
          value={campos.nombre}
          onChange={cambiar}
          placeholder="Ej. Tela Jersey 30/1 Blanco"
          required
        />
      </label>

      <label>
        Categoría
        <select name="categoria" value={campos.categoria} onChange={cambiar}>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </label>

      <label>
        Unidad
        <select name="unidad_medida" value={campos.unidad_medida} onChange={cambiar}>
          <option>Metros</option>
          <option>Piezas</option>
          <option>Conos</option>
          <option>Kilos</option>
        </select>
      </label>

      <label>
        Precio (S/)
        <input
          name="precio_unitario"
          type="number"
          step="0.01"
          value={campos.precio_unitario}
          onChange={cambiar}
          placeholder="Ej. 18.50 (o 0 para error 400)"
          required
        />
      </label>

      <label>
        Stock
        <input
          name="stock"
          type="number"
          value={campos.stock}
          onChange={cambiar}
          min="0"
          required
        />
      </label>

      <div style={{ display: 'flex', gap: '8px', alignSelf: 'end' }}>
        <button type="submit" className="boton" disabled={guardando}>
          {guardando
            ? 'Guardando...'
            : materialEditando
            ? 'Actualizar (PATCH)'
            : 'Registrar (POST)'}
        </button>

        {materialEditando && (
          <button
            type="button"
            className="boton secundario"
            onClick={onCancelar}
            disabled={guardando}
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}

export default FormularioMaterial
