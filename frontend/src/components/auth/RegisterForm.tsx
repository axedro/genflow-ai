import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Card } from '../ui/Card'
import toast from 'react-hot-toast'

const registerSchema = z.object({
  firstName: z.string().min(1, 'Nombre requerido').max(50),
  lastName: z.string().min(1, 'Apellido requerido').max(50),
  email: z.string().email('Email inválido'),
  password: z.string()
    .min(8, 'Contraseña debe tener al menos 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Contraseña debe contener mayúscula, minúscula y número'),
  confirmPassword: z.string(),
  companyName: z.string().max(100).optional(),
  industry: z.string().max(50).optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"]
})

type RegisterFormData = z.infer<typeof registerSchema>

const industries = [
  'Consultoría',
  'Comercio',
  'Servicios',
  'Tecnología',
  'Salud',
  'Educación',
  'Hostelería',
  'Construcción',
  'Otros'
]

export const RegisterForm: React.FC = () => {
  const navigate = useNavigate()
  const { register: registerUser, isLoading, error, clearError } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema)
  })

  const onSubmit = async (data: RegisterFormData) => {
    try {
      clearError()
      const { confirmPassword, ...registerData } = data
      await registerUser(registerData)
      toast.success('¡Cuenta creada exitosamente! Bienvenido a GenFlow AI')
      navigate('/dashboard')
    } catch (error: any) {
      toast.error(error.message || 'Error al crear la cuenta')
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Crear Cuenta</h1>
        <p className="text-gray-600 mt-2">
          Únete a GenFlow AI y automatiza tu negocio
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Nombre"
            placeholder="Tu nombre"
            error={errors.firstName?.message}
            {...register('firstName')}
          />

          <Input
            label="Apellido"
            placeholder="Tu apellido"
            error={errors.lastName?.message}
            {...register('lastName')}
          />
        </div>

        <Input
          label="Email"
          type="email"
          placeholder="tu@email.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Nombre de la Empresa (Opcional)"
          placeholder="Mi Empresa S.L."
          error={errors.companyName?.message}
          {...register('companyName')}
        />

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">
            Sector (Opcional)
          </label>
          <select
            className="input"
            {...register('industry')}
          >
            <option value="">Selecciona tu sector</option>
            {industries.map((industry) => (
              <option key={industry} value={industry}>
                {industry}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Contraseña"
          type="password"
          placeholder="Mínimo 8 caracteres"
          error={errors.password?.message}
          helperText="Debe contener mayúscula, minúscula y número"
          {...register('password')}
        />

        <Input
          label="Confirmar Contraseña"
          type="password"
          placeholder="Repite tu contraseña"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
            {error}
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={isLoading}
          className="w-full"
        >
          Crear Cuenta
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          ¿Ya tienes cuenta?{' '}
          <Link
            to="/login"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Inicia sesión
          </Link>
        </p>
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        Al crear una cuenta aceptas nuestros{' '}
        <a href="/terms" className="text-primary-600 hover:underline">
          Términos de Servicio
        </a>{' '}
        y{' '}
        <a href="/privacy" className="text-primary-600 hover:underline">
          Política de Privacidad
        </a>
      </div>
    </Card>
  )
}