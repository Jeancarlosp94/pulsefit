import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ErrorBoundary } from './ErrorBoundary'

const Bomb = () => {
   throw new Error('boom')
}

describe('ErrorBoundary', () => {
   beforeEach(() => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
   })

   it('renderiza children cuando no hay error', () => {
      render(
         <ErrorBoundary>
            <p>todo bien</p>
         </ErrorBoundary>
      )
      expect(screen.getByText('todo bien')).toBeInTheDocument()
   })

   it('muestra mensaje compasivo cuando un hijo lanza', () => {
      render(
         <ErrorBoundary>
            <Bomb />
         </ErrorBoundary>
      )
      expect(screen.getByText(/algo no salió como esperábamos/i)).toBeInTheDocument()
      /* No usar mensajes punitivos. */
      expect(screen.queryByText(/error|fallaste|incorrecto/i)).not.toBeInTheDocument()
   })

   it('expone botón de Recargar accesible', () => {
      render(
         <ErrorBoundary>
            <Bomb />
         </ErrorBoundary>
      )
      const btn = screen.getByRole('button', { name: /recargar/i })
      expect(btn).toBeInTheDocument()
   })
})
