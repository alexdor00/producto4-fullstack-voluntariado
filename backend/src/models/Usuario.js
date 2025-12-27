import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const usuarioSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
        unique: true
    },
    nombre: {
        type: String,
        required: [true, 'el nombre es obligatorio'],
        trim: true,
        uppercase: true
    },
    email: {
        type: String,
        required: [true, 'el email es obligatorio'],
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'email no valido']
    },
    password: {
        type: String,
        required: [true, 'la contrasena es obligatoria'],
        minlength: [3, 'la contrasena debe tener al menos 3 caracteres']
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

// indices para optimizar busquedas (sin duplicados)
usuarioSchema.index({ email: 1 }, { unique: true });
usuarioSchema.index({ rol: 1 });
usuarioSchema.index({ fechaCreacion: -1 });

// hook pre-save: encriptar password antes de guardar
usuarioSchema.pre('save', async function(next) {
    // solo encriptar si el password fue modificado o es nuevo
    if (!this.isModified('password')) {
        return next();
    }
    
    try {
        // generar salt y hash
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        console.log('[mongoose] password encriptado para:', this.email);
        next();
    } catch (error) {
        next(error);
    }
});

// hook post-save: log de auditoria
usuarioSchema.post('save', function(doc) {
    console.log('[mongoose] usuario guardado - email:', doc.email, 'rol:', doc.rol);
});

// metodo para comparar passwords
usuarioSchema.methods.compararPassword = async function(passwordIngresado) {
    return await bcrypt.compare(passwordIngresado, this.password);
};

// metodo estatico para generar siguiente id
usuarioSchema.statics.obtenerSiguienteId = async function() {
    const ultimoUsuario = await this.findOne().sort({ id: -1 });
    return ultimoUsuario ? ultimoUsuario.id + 1 : 1;
};

const Usuario = mongoose.model('Usuario', usuarioSchema);

export default Usuario;