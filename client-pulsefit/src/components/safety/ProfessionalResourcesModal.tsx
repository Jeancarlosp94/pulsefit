import { Heart, Phone, ExternalLink } from 'lucide-react'
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getResourcesForCountry, type ItfMentalHealthResource } from '@/features/safety-guards'
import { cn } from '@/utils'

interface ProfessionalResourcesModalProps {
   open: boolean
   onOpenChange: (v: boolean) => void
   /** Código de país ISO-2 del usuario (EC, PE, CO, etc.). */
   countryCode?: string | null
   /** Razón opcional que llevó a mostrar el modal. */
   reason?: string | null
   /** Si severity=high, no puede cerrarse con click fuera ni X. */
   severity?: 'high' | 'medium' | null
}

const TYPE_LABEL: Record<ItfMentalHealthResource['type'], string> = {
   crisis_line: 'Línea de crisis',
   directory: 'Directorio profesional',
   info: 'Información'
}

const COST_LABEL: Record<ItfMentalHealthResource['cost'], string> = {
   free: 'Gratis',
   paid: 'Costo según profesional',
   na: ''
}

const isUrl = (s: string): boolean => /^https?:\/\//.test(s)
const isPhone = (s: string): boolean => /^[\d\s+()-]+$/.test(s)

export const ProfessionalResourcesModal = ({
   open,
   onOpenChange,
   countryCode,
   reason,
   severity
}: ProfessionalResourcesModalProps) => {
   const resources = getResourcesForCountry(countryCode)
   const isHighSeverity = severity === 'high'

   return (
      <Dialog
         open={open}
         onOpenChange={(v) => {
            /* Severity=high no permite cerrar con click fuera. */
            if (isHighSeverity && !v) return
            onOpenChange(v)
         }}
      >
         <DialogContent className='sm:max-w-md'>
            <DialogHeader>
               <DialogTitle className='flex items-center gap-2'>
                  <Heart className='h-4 w-4 text-primary' />
                  Aquí estamos para ti
               </DialogTitle>
               <DialogDescription>
                  {reason ??
                     'Buscar apoyo profesional es valentía, no debilidad. Estos recursos son gratuitos y confidenciales 🌿'}
               </DialogDescription>
            </DialogHeader>

            <div className='space-y-3'>
               <p className='text-xs text-muted-foreground'>
                  Recursos en <strong>{resources.country_name}</strong>:
               </p>

               <div className='space-y-2'>
                  {resources.resources.map((res, i) => (
                     <ResourceCard key={i} resource={res} />
                  ))}
               </div>

               <div className='rounded-md border border-border bg-muted/30 p-3 text-[10px] leading-relaxed text-muted-foreground'>
                  PulseFit <strong>no reemplaza</strong> atención clínica profesional. Si te
                  encuentras en peligro inmediato, llama al servicio de emergencias de tu país.
               </div>

               {isHighSeverity ? (
                  <Button className='w-full' onClick={() => onOpenChange(false)}>
                     Entendido, gracias
                  </Button>
               ) : (
                  <Button variant='outline' className='w-full' onClick={() => onOpenChange(false)}>
                     Cerrar
                  </Button>
               )}
            </div>
         </DialogContent>
      </Dialog>
   )
}

interface ResourceCardProps {
   resource: ItfMentalHealthResource
}

const ResourceCard = ({ resource }: ResourceCardProps) => {
   const isLink = isUrl(resource.contact)
   const isCall = !isLink && isPhone(resource.contact)

   const href = isLink
      ? resource.contact
      : isCall
        ? `tel:${resource.contact.replace(/\s/g, '')}`
        : undefined

   return (
      <Card
         className={cn(
            'border-l-4',
            resource.type === 'crisis_line' ? 'border-l-primary' : 'border-l-border'
         )}
      >
         <CardContent className='space-y-1 pt-4 pb-3'>
            <div className='flex items-center justify-between gap-2'>
               <p className='text-sm font-medium'>{resource.name}</p>
               <span className='shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground'>
                  {TYPE_LABEL[resource.type]}
               </span>
            </div>
            {href ? (
               <a
                  href={href}
                  target={isLink ? '_blank' : undefined}
                  rel={isLink ? 'noopener noreferrer' : undefined}
                  className='inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline'
               >
                  {isCall ? (
                     <Phone className='h-3.5 w-3.5' />
                  ) : (
                     <ExternalLink className='h-3.5 w-3.5' />
                  )}
                  {resource.contact}
               </a>
            ) : (
               <p className='text-sm'>{resource.contact}</p>
            )}
            <p className='text-[10px] text-muted-foreground'>
               {resource.hours}
               {resource.cost !== 'na' ? ` · ${COST_LABEL[resource.cost]}` : ''}
            </p>
         </CardContent>
      </Card>
   )
}
