const { pool } = require("../config/database");

class Solicitud {
  static async getAll(filtros = {}) {
    let query = `
            SELECT s.*, c.nombre_completo as cliente_nombre, c.identificacion,
                   u1.nombre as asesor_nombre, u2.nombre as auxiliar_nombre,
                   e.nombre as estado_nombre
            FROM solicitudes s
            JOIN clientes c ON s.id_cliente = c.id
            JOIN usuarios u1 ON s.id_asesor = u1.id
            JOIN usuarios u2 ON s.id_auxiliar = u2.id
            JOIN estados e ON s.id_estado_actual = e.id
            WHERE 1=1
        `;
    const values = [];
    if (filtros.id_cliente) {
      query += ` AND s.id_cliente = ?`;
      values.push(filtros.id_cliente);
    }
    if (filtros.id_estado) {
      query += ` AND s.id_estado_actual = ?`;
      values.push(filtros.id_estado);
    }
    query += ` ORDER BY s.created_at DESC`;
    const [rows] = await pool.execute(query, values);
    return rows;
  }

  static async getById(id) {
    const query = `
            SELECT s.*, c.nombre_completo as cliente_nombre, c.identificacion,
                   u1.nombre as asesor_nombre, u2.nombre as auxiliar_nombre,
                   e.nombre as estado_nombre
            FROM solicitudes s
            JOIN clientes c ON s.id_cliente = c.id
            JOIN usuarios u1 ON s.id_asesor = u1.id
            JOIN usuarios u2 ON s.id_auxiliar = u2.id
            JOIN estados e ON s.id_estado_actual = e.id
            WHERE s.id = ?
        `;
    const [rows] = await pool.execute(query, [id]);
    return rows[0];
  }

  static async create(data) {
    const query = `
            INSERT INTO solicitudes 
            (numero_credito, monto_solicitado, plazo_meses, 
             id_cliente, id_asesor, id_auxiliar, id_estado_actual)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
    const [result] = await pool.execute(query, [
      data.numero_credito,
      data.monto_solicitado,
      data.plazo_meses,
      data.id_cliente,
      data.id_asesor,
      data.id_auxiliar,
      data.id_estado_actual,
    ]);
    await pool.execute(
      `
            INSERT INTO log_estados (id_solicitud, id_estado_nuevo, comentario)
            VALUES (?, ?, ?)
        `,
      [result.insertId, data.id_estado_actual, "Creación"],
    );
    return result.insertId;
  }

  static async cambiarEstado(id_solicitud, nuevoEstadoId, comentario) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [estadoActual] = await connection.execute(
        "SELECT id_estado_actual FROM solicitudes WHERE id = ? FOR UPDATE",
        [id_solicitud],
      );
      if (!estadoActual[0]) throw new Error("Solicitud no existe");
      await connection.execute(
        `
                INSERT INTO log_estados (id_solicitud, id_estado_anterior, id_estado_nuevo, comentario)
                VALUES (?, ?, ?, ?)
            `,
        [
          id_solicitud,
          estadoActual[0].id_estado_actual,
          nuevoEstadoId,
          comentario,
        ],
      );
      await connection.execute(
        `
                UPDATE solicitudes SET id_estado_actual = ?, updated_at = NOW() WHERE id = ?
            `,
        [nuevoEstadoId, id_solicitud],
      );
      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async getHistorial(id_solicitud) {
    const query = `
            SELECT l.*, e1.nombre as estado_anterior_nombre, e2.nombre as estado_nuevo_nombre
            FROM log_estados l
            LEFT JOIN estados e1 ON l.id_estado_anterior = e1.id
            JOIN estados e2 ON l.id_estado_nuevo = e2.id
            WHERE l.id_solicitud = ?
            ORDER BY l.fecha_cambio DESC
        `;
    const [rows] = await pool.execute(query, [id_solicitud]);
    return rows;
  }
}

module.exports = Solicitud;
