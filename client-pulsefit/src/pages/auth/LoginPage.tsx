import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
   Form,
   FormControl,
   FormField,
   FormItem,
   FormLabel,
   FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks/useAuth'
import { useErrorHandling } from '@/hooks/useErrorHandling'
import { loginSchema, type LoginValues } from '@/validations/authSchemas'

const GoogleIcon = () => (
   <svg viewBox='0 0 24 24' className='h-4 w-4' aria-hidden='true'>
      <path
         d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z'
         fill='#4285F4'
      />
      <path
         d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.24 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z'
         fill='#34A853'
      />
      <path
         d='M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.95l3.66-2.84Z'
         fill='#FBBC05'
      />
      <path
         d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.96 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z'
         fill='#EA4335'
      />
   </svg>
)

const LoginPage = () => {
   const navigate = useNavigate()
   const { signIn, signInWithGoogle, loading } = useAuth()
   const { handleApiError } = useErrorHandling()

   const form = useForm<LoginValues>({
      resolver: zodResolver(loginSchema),
      defaultValues: { email: '', password: '' }
   })

   const onSubmit = async (values: LoginValues) => {
      try {
         await signIn(values)
         toast.success('Bienvenido de vuelta 🌱')
         navigate('/home', { replace: true })
      } catch (e) {
         handleApiError(e)
      }
   }

   const onGoogle = async () => {
      try {
         await signInWithGoogle()
      } catch (e) {
         handleApiError(e)
      }
   }

   return (
      <main className='mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10'>
         <Card>
            <CardHeader className='space-y-2 text-center'>
               <CardTitle>Hola de nuevo</CardTitle>
               <CardDescription>Entra a tu PulseFit y seguimos juntos.</CardDescription>
            </CardHeader>
            <CardContent className='space-y-5'>
               <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
                     <FormField
                        control={form.control}
                        name='email'
                        render={({ field }) => (
                           <FormItem>
                              <FormLabel>Correo</FormLabel>
                              <FormControl>
                                 <Input
                                    type='email'
                                    autoComplete='email'
                                    placeholder='hola@pulsefit.app'
                                    {...field}
                                 />
                              </FormControl>
                              <FormMessage />
                           </FormItem>
                        )}
                     />
                     <FormField
                        control={form.control}
                        name='password'
                        render={({ field }) => (
                           <FormItem>
                              <FormLabel>Contraseña</FormLabel>
                              <FormControl>
                                 <Input
                                    type='password'
                                    autoComplete='current-password'
                                    placeholder='••••••••'
                                    {...field}
                                 />
                              </FormControl>
                              <FormMessage />
                           </FormItem>
                        )}
                     />
                     <Button type='submit' className='w-full' disabled={loading}>
                        {loading ? <Loader2 className='h-4 w-4 animate-spin' /> : 'Entrar'}
                     </Button>
                  </form>
               </Form>

               <div className='flex items-center gap-3'>
                  <Separator className='flex-1' />
                  <span className='text-xs text-muted-foreground'>o</span>
                  <Separator className='flex-1' />
               </div>

               <Button
                  type='button'
                  variant='outline'
                  className='w-full'
                  onClick={onGoogle}
                  disabled={loading}
               >
                  <GoogleIcon />
                  Continuar con Google
               </Button>

               <div className='space-y-2 text-center text-sm'>
                  <p>
                     <Link
                        to='/forgot-password'
                        className='font-medium text-primary hover:underline'
                     >
                        ¿Olvidaste tu contraseña?
                     </Link>
                  </p>
                  <p className='text-muted-foreground'>
                     ¿Aún no tienes cuenta?{' '}
                     <Link to='/register' className='font-medium text-primary hover:underline'>
                        Empezar
                     </Link>
                  </p>
               </div>
            </CardContent>
         </Card>
      </main>
   )
}

export default LoginPage
