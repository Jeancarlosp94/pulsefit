import { Navigate, Route, Routes } from 'react-router-dom'
import Step1Welcome from './Step1Welcome'
import Step2Goals from './Step2Goals'
import Step3Body from './Step3Body'
import Step4Activity from './Step4Activity'
import Step5Diet from './Step5Diet'
import Step6Schedule from './Step6Schedule'
import Step7Review from './Step7Review'

/**
 * Sub-router del wizard de onboarding. Cada step es una ruta hija de
 * `/onboarding`. `/onboarding` (sin step) redirige al 1.
 *
 * El guard `<AuthRoute>` ya se encargó de comprobar que hay sesión y que
 * `onboarding_completed === false`. Aquí no validamos eso de nuevo.
 */
const OnboardingRouter = () => {
   return (
      <Routes>
         <Route index element={<Navigate to='1' replace />} />
         <Route path='1' element={<Step1Welcome />} />
         <Route path='2' element={<Step2Goals />} />
         <Route path='3' element={<Step3Body />} />
         <Route path='4' element={<Step4Activity />} />
         <Route path='5' element={<Step5Diet />} />
         <Route path='6' element={<Step6Schedule />} />
         <Route path='7' element={<Step7Review />} />
         <Route path='*' element={<Navigate to='1' replace />} />
      </Routes>
   )
}

export default OnboardingRouter
