import mongoose from 'mongoose';

const voluntariadoSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
        unique: true
    },
    titulo: {
        type: String,
        required: [true, 'El título es obligatorio'],
        trim: true,
        uppercase: true
    },
    email: {
        type: String,
        required: [true, 'El email es obligatorio'],
        trim: true,
    },
    fecha: {
        type: String,
        required: [true, 'La fecha es obligatoria']
    },
    descripcion: {
        type: String,
        required: [true, 'La descripción es obligatoria'],
        trim: true,
        uppercase: true
    },
    tipo: {
        type: String,
        enum: {
            values: ['Oferta', 'Petición'],
            message: 'El tipo debe ser Oferta o Petición'
        },
        required: [true, 'El tipo es obligatorio']
    },
    fechaCreacion: {
        type: Date,
        default: Date.now
    }
}, {
    collection: 'voluntariados',
    timestamps: true
});

// Método para generar siguiente ID
voluntariadoSchema.statics.obtenerSiguienteId = async function() {
    const ultimoVoluntariado = await this.findOne().sort({ id: -1 });
    return ultimoVoluntariado ? ultimoVoluntariado.id + 1 : 1;
};

const Voluntariado = mongoose.model('Voluntariado', voluntariadoSchema);

export default Voluntariado;