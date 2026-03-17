import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, UserPlus, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { AREAS, CARRERAS, AreaType } from '../types';

const APPSCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxNDLhK6_BaxCtOO_sXrvfare0f4If3JLruSswte2f4ujoeKSQUmxnoXjIJUBQoWA6c/exec';

export function Register() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    carrera: '',
    area: '' as AreaType | '',
    celular: '',
    dni: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (formData.dni.length !== 8 || !/^\d+$/.test(formData.dni)) {
      setError('El DNI debe tener exactamente 8 números');
      return;
    }

    if (formData.celular.length !== 9 || !/^\d+$/.test(formData.celular)) {
      setError('El celular debe tener exactamente 9 números');
      return;
    }

    setIsLoading(true);

    try {
      const url = `${APPSCRIPT_URL}?action=registrarAlumnoConUsuario&nombre=${encodeURIComponent(formData.nombre)}&apellido=${encodeURIComponent(formData.apellido)}&carrera=${encodeURIComponent(formData.carrera)}&area=${encodeURIComponent(formData.area)}&celular=${encodeURIComponent(formData.celular)}&dni=${encodeURIComponent(formData.dni)}&email=${encodeURIComponent(formData.email)}&username=${encodeURIComponent(formData.username)}&password=${encodeURIComponent(formData.password)}`;
      
      const response = await fetch(url, { method: 'GET', mode: 'cors', cache: 'no-cache' });
      const text = await response.text();
      
      let result: { success: boolean; message?: string };
      try {
        result = JSON.parse(text);
      } catch {
        setError('Error de conexión. Verifica la publicación del Apps Script.');
        setIsLoading(false);
        return;
      }

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(result.message || 'Error al registrar el estudiante');
      }
    } catch (err) {
      setError('Error de conexión. Intenta de nuevo.');
    }

    setIsLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-4 flex items-center justify-center">
        <div className="text-center max-w-md">
          <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">¡Registro exitoso!</h2>
          <p className="text-slate-400 mb-4">Tu cuenta ha sido creada. Serás redirigido al login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      <div className="max-w-lg mx-auto">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-violet-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-violet-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Regístrate</h1>
          <p className="text-slate-400">Crea tu cuenta para acceder a los quizizz</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Nombres</label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
                placeholder="Juan"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Apellidos</label>
              <input
                type="text"
                name="apellido"
                value={formData.apellido}
                onChange={handleChange}
                required
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
                placeholder="Pérez"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Carrera a la que postulas</label>
            <select
              name="carrera"
              value={formData.carrera}
              onChange={handleChange}
              required
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
            >
              <option value="">Seleccionar carrera</option>
              {CARRERAS.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Área a la que postulas</label>
            <select
              name="area"
              value={formData.area}
              onChange={handleChange}
              required
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
            >
              <option value="">Seleccionar área</option>
              {AREAS.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">DNI</label>
              <input
                type="text"
                name="dni"
                value={formData.dni}
                onChange={handleChange}
                required
                maxLength={8}
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
                placeholder="12345678"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Celular</label>
              <input
                type="tel"
                name="celular"
                value={formData.celular}
                onChange={handleChange}
                required
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
                placeholder="999999999"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Correo electrónico</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
              placeholder="juan@email.com"
            />
          </div>

          <hr className="border-slate-700 my-4" />

          <div>
            <label className="block text-sm text-slate-400 mb-1">Usuario</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
              placeholder="juanperez"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Contraseña</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
                placeholder="Mín. 6 caracteres"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Confirmar contraseña</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
                placeholder="Repite"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-violet-600 rounded-xl font-bold hover:bg-violet-500 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                Crear cuenta
              </>
            )}
          </button>

          <p className="text-center text-slate-400">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-cyan-400 hover:underline">
              Iniciar sesión
            </Link>
          </p>
        </form>

        <div className="mt-12 mb-8 text-center">
          <p className="text-slate-500 text-xs">
            Desarrollado por <span className="text-slate-400 font-medium">Carlos Llano</span>
          </p>
          <p className="text-slate-600 text-[10px] mt-1">
            llanovilca97@gmail.com
          </p>
        </div>
      </div>
    </div>
  );
}
