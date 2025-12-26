import mongoose from 'mongoose';

const usuarioSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
        unique: true
    },
    nombre: {
        type: String,
        required: [true, 'El nombre es obligatorio'],
        trim: true,
        uppercase: true
    },
    email: {
        type: String,
        required: [true, 'El email es obligatorio'],
        unique: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Email no válido']
    },
    password: {
        type: String,
        required: [true, 'La contraseña es obligatoria']
    },
    rol: {
        type: String,
        enum: ['admin', 'usuario'],
        default: 'usuario'
    },
    fechaCreacion: {
        type: Date,
        default: Date.now
    }
}, {
    collection: 'usuarios',
    timestamps: true
});

// Método para generar siguiente ID
usuarioSchema.statics.obtenerSiguienteId = async function() {
    const ultimoUsuario = await this.findOne().sort({ id: -1 });
    return ultimoUsuario ? ultimoUsuario.id + 1 : 1;
};

const Usuario = mongoose.model('Usuario', usuarioSchema);

export default Usuario;