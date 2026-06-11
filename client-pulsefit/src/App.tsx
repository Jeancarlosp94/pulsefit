import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthRoute, NotAuthRoute } from '@/routes'
import {
   LandingPage,
   LoginPage,
   RegisterPage,
   ForgotPasswordPage,
   HomePage,
   OnboardingRouter,
   ProfilePage,
   PlanPage,
   RegistrarPage,
   ProgresoPage,
   RescatePage,
   WeeklyReviewPage,
   NotFoundPage
} from '@/pages'
import { initAuthSubscription } from '@/store/auth'

const App = () => {
   useEffect(() => {
      let cleanup: (() => void) | undefined
      let cancelled = false
      void initAuthSubscription().then((fn) => {
         if (cancelled) {
            fn()
         } else {
            cleanup = fn
         }
      })
      return () => {
         cancelled = true
         cleanup?.()
      }
   }, [])

   return (
      <BrowserRouter>
         <Routes>
            {/* Landing pública */}
            <Route
               path='/'
               element={
                  <NotAuthRoute>
                     <LandingPage />
                  </NotAuthRoute>
               }
            />

            {/* Públicas (solo sin sesión) */}
            <Route
               path='/login'
               element={
                  <NotAuthRoute>
                     <LoginPage />
                  </NotAuthRoute>
               }
            />
            <Route
               path='/register'
               element={
                  <NotAuthRoute>
                     <RegisterPage />
                  </NotAuthRoute>
               }
            />
            <Route
               path='/forgot-password'
               element={
                  <NotAuthRoute>
                     <ForgotPasswordPage />
                  </NotAuthRoute>
               }
            />

            {/* Privadas */}
            <Route
               path='/home'
               element={
                  <AuthRoute>
                     <HomePage />
                  </AuthRoute>
               }
            />
            <Route
               path='/onboarding/*'
               element={
                  <AuthRoute>
                     <OnboardingRouter />
                  </AuthRoute>
               }
            />
            <Route
               path='/perfil'
               element={
                  <AuthRoute>
                     <ProfilePage />
                  </AuthRoute>
               }
            />
            <Route
               path='/plan'
               element={
                  <AuthRoute>
                     <PlanPage />
                  </AuthRoute>
               }
            />
            <Route
               path='/registrar'
               element={
                  <AuthRoute>
                     <RegistrarPage />
                  </AuthRoute>
               }
            />
            <Route
               path='/progreso'
               element={
                  <AuthRoute>
                     <ProgresoPage />
                  </AuthRoute>
               }
            />
            <Route
               path='/rescate'
               element={
                  <AuthRoute>
                     <RescatePage />
                  </AuthRoute>
               }
            />
            <Route
               path='/revision'
               element={
                  <AuthRoute>
                     <WeeklyReviewPage />
                  </AuthRoute>
               }
            />

            {/* Aliases sin acento por compatibilidad. */}
            <Route path='/profile' element={<Navigate to='/perfil' replace />} />

            <Route path='*' element={<NotFoundPage />} />
         </Routes>
      </BrowserRouter>
   )
}

export default App
