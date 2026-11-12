// Fila del listado: muestra un material y avisa al padre con las funciones
// que recibe. Incluye confirmación previa antes de eliminar (Ejercicio 12).
function FilaMaterial({ material, onReponer, onEliminar, onEditar }) {
  const sinStock = material.stock === 0

  // Confirmación previa antes de ejecutar DELETE (Ejercicio 12)
  const handleEliminarConConfirmacion = () => {
    const confirmado = window.confirm(
      `¿Está seguro de que desea eliminar el insumo "${material.nombre}"?\nEsta acción ejecutará una solicitud DELETE a la API.`
    )
    if (confirmado) {
      onEliminar(material.id)
    }
  }

  return (
    <tr>
      <td>
        <strong>{material.nombre}</strong>
      </td>
      <td>{material.categoria_nombre}</td>
      <td>S/ {Number(material.precio_unitario).toFixed(2)}</td>
      <td>
        {material.stock} {material.unidad_medida.toLowerCase()}
        {sinStock && <span className="etiqueta agotado">Sin stock</span>}
      </td>
      <td className="acciones">
        {onEditar && (
          <button
            type="button"
            className="boton"
            style={{ background: '#334155', marginRight: '6px' }}
            onClick={() => onEditar(material)}
            title="Editar este insumo con PATCH/PUT"
          >
            Editar
          </button>
        )}
        <button type="button" className="boton" onClick={() => onReponer(material.id)}>
          Reponer +10
        </button>
        <button
          type="button"
          className="boton secundario"
          onClick={handleEliminarConConfirmacion}
          title="Eliminar con confirmación previa y DELETE"
        >
          Eliminar
        </button>
      </td>
    </tr>
  )
}

export default FilaMaterial
