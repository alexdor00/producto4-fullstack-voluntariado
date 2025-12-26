import mongoose from 'mongoose';

const voluntariadoSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
        unique: true
    },
    titulo: {
        type: String,
        required: [true, 'el titulo es obligatorio'],
        trim: true,
        uppercase: true
    },
    email: {
        type: String,
        required: [true, 'el email es obligatorio'],
        trim: true,
    },
    fecha: {
        type: String,
        required: [true, 'la fecha es obligatoria']
    },
    descripcion: {
        type: String,
        required: [true, 'la descripcion es obligatoria'],
        trim: true,
        uppercase: true
    },
    tipo: {
        type: String,
        enum: {
            values: ['Oferta', 'Petición'],
            message: 'el tipo debe ser oferta o peticion'
        },
        required: [true, 'el tipo es obligatorio']
    },
    fechaCreacion: {
        type: Date,
        default: Date.now
    }
}, {
    collection: 'voluntariados',
    timestamps: true
});

// indices para optimizar busquedas frecuentes
voluntariadoSchema.index({ email: 1 });
voluntariadoSchema.index({ tipo: 1 });
voluntariadoSchema.index({ fecha: 1 });
voluntariadoSchema.index({ fechaCreacion: -1 });

// hook pre-save: normalizar datos antes de guardar
voluntariadoSchema.pre('save', function(next) {
    // asegurar mayusculas en titulo y descripcion
    if (this.titulo) {
        this.titulo = this.titulo.toUpperCase();
    }
    if (this.descripcion) {
        this.descripcion = this.descripcion.toUpperCase();
    }
    next();
});

// hook post-save: log de auditoria
voluntariadoSchema.post('save', function(doc) {
    console.log('[mongoose] voluntariado guardado - id:', doc.id, 'titulo:', doc.titulo, 'tipo:', doc.tipo);
});

// hook post-delete: log
voluntariadoSchema.post('deleteOne', function(doc) {
    console.log('[mongoose] voluntariado eliminado');
});

// metodo estatico para generar siguiente id
voluntariadoSchema.statics.obtenerSiguienteId = async function() {
    const ultimoVoluntariado = await this.findOne().sort({ id: -1 });
    return ultimoVoluntariado ? ultimoVoluntariado.id + 1 : 1;
};

const Voluntariado = mongoose.model('Voluntariado', voluntariadoSchema);

export default Voluntariado;