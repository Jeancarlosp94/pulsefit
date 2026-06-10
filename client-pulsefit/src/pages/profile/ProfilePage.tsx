import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Sun, Moon, Monitor, UtensilsCrossed, Users, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { MealsPerDayDialog } from '@/components'
import { InfoTooltip } from '@/components/InfoTooltip'
import { FavoritesEditor } from '@/components/FavoritesEditor'
import { ResetAccountDialog } from '@/components/ResetAccountDialog'
import { AppShell } from '@/layout'
import { TitleUI } from '@/components/TitleUI'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle
} from '@/components/ui/dialog'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import { useErrorHandling } from '@/hooks/useErrorHandling'
import type { ThemeMode } from '@/themes'
import { cn } from '@/utils'

interface ThemeOption {
   mode: ThemeMode
   label: string
   icon: React.ComponentType<{ className?: string }>
}

const themeOptions: ThemeOption[] = [
   { mode: 'light', label: 'Claro', icon: Sun },
   { mode: 'dark', label: 'Oscuro', icon: Moon },
   { mode: 'system', label: 'Sistema', icon: Monitor }
]

const ProfilePage = () => {
   const navigate = useNavigate()
   const { profile, user, signOut, updateProfile } = useAuth()
   const { theme, setTheme } = useTheme()
   const { handleApiError } = useErrorHandling()

   const [signOutOpen, setSignOutOpen] = useState(false)
   const [mealsDialogOpen, setMealsDialogOpen] = useState(false)
   const [resetOpen, setResetOpen] = useState(false)
   const [savingFamily, setSavingFamily] = useState(false)

   const familySize = (profile?.family_size as number | null) ?? 1

   const handleFamilyChange = async (n: number) => {
      if (n === familySize || savingFamily) return
      setSavingFamily(true)
      try {
         await updateProfile({ family_size: n })
         toast.success(
            n === 1 ? 'Listo, cocinas para ti 🌱' : `Listo, cocinas para ${n} personas 🌱`
         )
      } catch (e) {
         handleApiError(e)
      } finally {
         setSavingFamily(false)
      }
   }

   const displayName = profile?.name ?? user?.email?.split('@')[0] ?? 'Bienvenida'
   const email = user?.email ?? '—'

   const handleSignOut = async () => {
      try {
         await signOut()
         setSignOutOpen(false)
         toast.success('Hasta pronto 🌿')
         navigate('/login', { replace: true })
      } catch (e) {
         handleApiError(e)
      }
   }

   return (
      <AppShell userName={profile?.name ?? null}>
         <TitleUI title='Tu perfil' subtitle='Aquí ajustas lo esencial.' />

         <div className='space-y-4'>
            <Card>
               <CardHeader>
                  <CardTitle>Datos básicos</CardTitle>
               </CardHeader>
               <CardContent className='space-y-2 text-sm'>
                  <div className='flex justify-between gap-4'>
                     <span className='text-muted-foreground'>Nombre</span>
                     <span className='font-medium text-foreground'>{displayName}</span>
                  </div>
                  <Separator />
                  <div className='flex justify-between gap-4'>
                     <span className='text-muted-foreground'>Correo</span>
                     <span className='break-all text-right font-medium text-foreground'>
                        {email}
                     </span>
                  </div>
               </CardContent>
            </Card>

            <Card>
               <CardHeader>
                  <CardTitle className='flex items-center gap-2 text-base'>
                     <UtensilsCrossed className='h-4 w-4 text-primary' />
                     Patrón alimentario
                  </CardTitle>
               </CardHeader>
               <CardContent className='space-y-3'>
                  <div className='flex items-center justify-between text-sm'>
                     <span className='text-muted-foreground'>Comidas por día</span>
                     <span className='font-medium text-foreground'>
                        {profile?.meals_per_day ?? 3}
                     </span>
                  </div>
                  <Button
                     variant='outline'
                     size='sm'
                     onClick={() => setMealsDialogOpen(true)}
                     className='w-full'
                  >
                     Cambiar
                  </Button>
               </CardContent>
            </Card>

            <Card>
               <CardHeader>
                  <CardTitle className='flex items-center gap-2 text-base'>
                     <Users className='h-4 w-4 text-primary' />
                     ¿Para cuántas personas cocinas?
                  </CardTitle>
               </CardHeader>
               <CardContent className='space-y-2 text-sm'>
                  <p className='text-xs text-muted-foreground'>
                     Las porciones de las recetas y la lista de compras se multiplican × este
                     número.
                  </p>
                  <div className='grid grid-cols-4 gap-2'>
                     {([1, 2, 3, 4] as const).map((n) => (
                        <button
                           key={n}
                           type='button'
                           disabled={savingFamily}
                           onClick={() => handleFamilyChange(n)}
                           aria-pressed={familySize === n}
                           className={cn(
                              'rounded-md border p-2 text-xs transition-colors disabled:opacity-50',
                              familySize === n
                                 ? 'border-primary bg-primary/10 text-primary'
                                 : 'border-border text-muted-foreground hover:bg-muted'
                           )}
                        >
                           {n === 1 ? 'Solo yo' : `${n} 👥`}
                        </button>
                     ))}
                  </div>
               </CardContent>
            </Card>

            {profile?.target_kcal ? (
               <Card>
                  <CardHeader>
                     <CardTitle className='text-base'>Tus números</CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-2 text-sm'>
                     <div className='flex items-center justify-between'>
                        <span className='inline-flex items-center gap-1 text-muted-foreground'>
                           Calorías objetivo
                           <InfoTooltip topic='target_kcal' />
                        </span>
                        <span className='font-medium text-foreground'>
                           {profile.target_kcal} kcal
                        </span>
                     </div>
                     <Separator />
                     <div className='flex items-center justify-between'>
                        <span className='inline-flex items-center gap-1 text-muted-foreground'>
                           Proteína
                           <InfoTooltip topic='protein' />
                        </span>
                        <span className='font-medium text-foreground'>
                           {profile.target_protein_g}g
                        </span>
                     </div>
                     <div className='flex items-center justify-between'>
                        <span className='inline-flex items-center gap-1 text-muted-foreground'>
                           Carbohidratos
                           <InfoTooltip topic='carbs' />
                        </span>
                        <span className='font-medium text-foreground'>
                           {profile.target_carbs_g}g
                        </span>
                     </div>
                     <div className='flex items-center justify-between'>
                        <span className='inline-flex items-center gap-1 text-muted-foreground'>
                           Grasas
                           <InfoTooltip topic='fats' />
                        </span>
                        <span className='font-medium text-foreground'>
                           {profile.target_fats_g}g
                        </span>
                     </div>
                  </CardContent>
               </Card>
            ) : null}

            <FavoritesEditor />

            <Card>
               <CardHeader>
                  <CardTitle>Apariencia</CardTitle>
               </CardHeader>
               <CardContent>
                  <div role='radiogroup' aria-label='Tema' className='grid grid-cols-3 gap-2'>
                     {themeOptions.map(({ mode, label, icon: Icon }) => {
                        const active = theme === mode
                        return (
                           <button
                              key={mode}
                              type='button'
                              role='radio'
                              aria-checked={active}
                              onClick={() => setTheme(mode)}
                              className={cn(
                                 'flex flex-col items-center gap-1 rounded-md border p-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                 active
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-border text-muted-foreground hover:bg-muted'
                              )}
                           >
                              <Icon className='h-5 w-5' />
                              <span>{label}</span>
                           </button>
                        )
                     })}
                  </div>
               </CardContent>
            </Card>

            <Card>
               <CardHeader>
                  <CardTitle>Información legal</CardTitle>
               </CardHeader>
               <CardContent className='space-y-1 text-sm'>
                  <a
                     href='#privacy'
                     className='block py-1 text-muted-foreground hover:text-foreground'
                  >
                     Política de privacidad
                  </a>
                  <a
                     href='#terms'
                     className='block py-1 text-muted-foreground hover:text-foreground'
                  >
                     Términos y condiciones
                  </a>
               </CardContent>
            </Card>

            <Card className='border-accent/30'>
               <CardContent className='space-y-3 pt-6'>
                  <Button variant='outline' className='w-full' onClick={() => setResetOpen(true)}>
                     <RotateCcw className='h-4 w-4' />
                     Empezar desde cero
                  </Button>
                  <Button variant='outline' className='w-full' onClick={() => setSignOutOpen(true)}>
                     <LogOut className='h-4 w-4' />
                     Cerrar sesión
                  </Button>
               </CardContent>
            </Card>
         </div>

         <MealsPerDayDialog open={mealsDialogOpen} onOpenChange={setMealsDialogOpen} />
         <ResetAccountDialog open={resetOpen} onOpenChange={setResetOpen} />

         <Dialog open={signOutOpen} onOpenChange={setSignOutOpen}>
            <DialogContent>
               <DialogHeader>
                  <DialogTitle>¿Cerramos tu sesión?</DialogTitle>
                  <DialogDescription>
                     Puedes volver cuando quieras. Tu plan te espera.
                  </DialogDescription>
               </DialogHeader>
               <DialogFooter>
                  <Button variant='outline' onClick={() => setSignOutOpen(false)}>
                     Mejor no
                  </Button>
                  <Button variant='accent' onClick={handleSignOut}>
                     Sí, cerrar sesión
                  </Button>
               </DialogFooter>
            </DialogContent>
         </Dialog>
      </AppShell>
   )
}

export default ProfilePage
