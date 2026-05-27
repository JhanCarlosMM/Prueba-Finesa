const Solicitud = require("../models/Solicitud");

const solicitudController = {
  async listar(req, res) {
    try {
      const filtros = {
        id_cliente: req.query.cliente,
        id_estado: req.query.estado,
      };
      const data = await Solicitud.getAll(filtros);
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async obtener(req, res) {
    try {
      const solicitud = await Solicitud.getById(req.params.id);
      if (!solicitud)
        return res.status(404).json({ success: false, error: "No encontrada" });
      const historial = await Solicitud.getHistorial(req.params.id);
      res.json({ success: true, data: solicitud, historial });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async crear(req, res) {
    console.log("Body recibido:", req.body);
    console.log("Headers:", req.headers["content-type"]);
    try {
      if (req.body.id_asesor === req.body.id_auxiliar) {
        return res
          .status(400)
          .json({
            success: false,
            error: "Asesor y auxiliar no pueden ser iguales",
          });
      }
      const id = await Solicitud.create(req.body);
      const nueva = await Solicitud.getById(id);
      res.status(201).json({ success: true, data: nueva });
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        return res
          .status(409)
          .json({ success: false, error: "Número de crédito ya existe" });
      }
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async cambiarEstado(req, res) {
    try {
      const { id } = req.params;
      const { nuevo_estado_id, comentario } = req.body;
      await Solicitud.cambiarEstado(id, nuevo_estado_id, comentario);
      res.json({ success: true, message: "Estado actualizado" });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
};

module.exports = solicitudController;
