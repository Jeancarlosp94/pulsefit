import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
   Form,
   FormControl,
   FormField,
   FormItem,
   FormLabel,
   FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'
import { useErrorHandling } from '@/hooks/useErrorHandling'
import { registerSchema, type RegisterValues } from '@/validations/authSchemas'

const RegisterPage = () => {
   const navigate = useNavigate()
   const { signUp, loading } = useAuth()
   const { handleApiError } = useErrorHandling()

   const form = useForm<RegisterValues>({
      resolver: zodResolver(registerSchema),
      defaultValues: {
         name: '',
         email: '',
         password: '',
         passwordConfirm: '',
         acceptedTerms: false
      }
   })

   const onSubmit = async (values: RegisterValues) => {
      try {
         await signUp({
            email: values.email,
            password: values.password,
            name: values.name?.trim() || undefined,
            acceptedTerms: values.acceptedTerms
         })
         toast.success('¡Bienvenido! Revisa tu correo para confirmar tu cuenta 🌱')
         navigate('/login', { replace: true })
      } catch (e) {
         handleApiError(e)
      }
   }

   return (
      <main className='mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10'>
         <Card>
            <CardHeader className='space-y-2 text-center'>
               <CardTitle>Empecemos juntos</CardTitle>
               <CardDescription>Sin presiones. A tu ritmo. Cero juicios.</CardDescription>
            </CardHeader>
            <CardContent>
               <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
                     <FormField
                        control={form.control}
                        name='name'
                        render={({ field }) => (
                           <FormItem>
                              <FormLabel>¿Cómo te llamamos?</FormLabel>
                              <FormControl>
                                 <Input
                                    autoComplete='given-name'
                                    placeholder='Tu nombre o apodo'
                                    {...field}
                                 />
                              </FormControl>
                              <FormMessage />
                           </FormItem>
                        )}
                     />
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
                                    autoComplete='new-password'
                                    placeholder='Mínimo 8 caracteres'
                                    {...field}
                                 />
                              </FormControl>
                              <FormMessage />
                           </FormItem>
                        )}
                     />
                     <FormField
                        control={form.control}
                        name='passwordConfirm'
                        render={({ field }) => (
                           <FormItem>
                              <FormLabel>Confírmala</FormLabel>
                              <FormControl>
                                 <Input
                                    type='password'
                                    autoComplete='new-password'
                                    placeholder='La misma de arriba'
                                    {...field}
                                 />
                              </FormControl>
                              <FormMessage />
                           </FormItem>
                        )}
                     />
                     <FormField
                        control={form.control}
                        name='acceptedTerms'
                        render={({ field }) => (
                           <FormItem className='flex items-start gap-3 space-y-0 rounded-md border border-border p-3'>
                              <FormControl>
                                 <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                              <div className='space-y-1 text-sm leading-tight'>
                                 <FormLabel className='font-medium'>
                                    Acepto los términos y la política de privacidad
                                 </FormLabel>
                                 <p className='text-xs text-muted-foreground'>
                                    Cuidamos tus datos como propios. Puedes pedir borrarlos cuando
                                    quieras.
                                 </p>
                                 <FormMessage />
                              </div>
                           </FormItem>
                        )}
                     />

                     <Button type='submit' className='w-full' disabled={loading}>
                        {loading ? <Loader2 className='h-4 w-4 animate-spin' /> : 'Crear mi cuenta'}
                     </Button>
                  </form>
               </Form>

               <p className='mt-4 text-center text-sm text-muted-foreground'>
                  ¿Ya tienes cuenta?{' '}
                  <Link to='/login' className='font-medium text-primary hover:underline'>
                     Entrar
                  </Link>
               </p>
            </CardContent>
         </Card>
      </main>
   )
}

export default RegisterPage
