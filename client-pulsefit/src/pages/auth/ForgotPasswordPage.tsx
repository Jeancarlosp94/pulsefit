import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { forgotPasswordSchema, type ForgotPasswordValues } from '@/validations/authSchemas'

const ForgotPasswordPage = () => {
   const navigate = useNavigate()
   const { forgotPassword, loading } = useAuth()
   const { handleApiError } = useErrorHandling()

   const form = useForm<ForgotPasswordValues>({
      resolver: zodResolver(forgotPasswordSchema),
      defaultValues: { email: '' }
   })

   const onSubmit = async (values: ForgotPasswordValues) => {
      try {
         await forgotPassword(values)
         toast.success('Te enviamos un correo para recuperar tu acceso 🌱')
         navigate('/login', { replace: true })
      } catch (e) {
         handleApiError(e)
      }
   }

   return (
      <main className='mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10'>
         <Card>
            <CardHeader className='space-y-2 text-center'>
               <CardTitle>Recuperar acceso</CardTitle>
               <CardDescription>
                  Te mandamos un correo con un enlace para crear una nueva contraseña.
               </CardDescription>
            </CardHeader>
            <CardContent>
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
                     <Button type='submit' className='w-full' disabled={loading}>
                        {loading ? (
                           <Loader2 className='h-4 w-4 animate-spin' />
                        ) : (
                           'Enviarme el enlace'
                        )}
                     </Button>
                  </form>
               </Form>
               <p className='mt-4 text-center text-sm text-muted-foreground'>
                  <Link to='/login' className='font-medium text-primary hover:underline'>
                     Volver al inicio
                  </Link>
               </p>
            </CardContent>
         </Card>
      </main>
   )
}

export default ForgotPasswordPage
