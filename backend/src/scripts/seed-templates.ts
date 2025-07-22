import { prisma } from '../config/database'
import { WorkflowDefinition } from '../types/workflow'

const defaultTemplates = [
  {
    name: 'Recordatorio de Facturas Pendientes',
    description: 'Envía recordatorios automáticos a clientes con facturas vencidas',
    category: 'administration',
    industry: 'general',
    tags: ['facturacion', 'cobranza', 'email', 'automatico'],
    definition: {
      nodes: [
        {
          id: 'trigger-1',
          type: 'schedule',
          name: 'Cada día a las 9:00',
          description: 'Ejecutar diariamente por la mañana',
          config: { cron: '0 9 * * *' },
          position: { x: 200, y: 50 }
        },
        {
          id: 'action-1',
          type: 'action',
          name: 'Buscar facturas vencidas',
          description: 'Consultar facturas con más de 30 días de vencimiento',
          integration: 'sheets',
          config: {
            spreadsheetId: '{{INVOICE_SPREADSHEET}}',
            range: 'A:F',
            filter: 'due_date < TODAY()-30'
          },
          position: { x: 200, y: 200 }
        },
        {
          id: 'condition-1',
          type: 'condition',
          name: '¿Hay facturas vencidas?',
          description: 'Verificar si existen facturas para procesar',
          config: { condition: 'length > 0' },
          position: { x: 200, y: 350 }
        },
        {
          id: 'action-2',
          type: 'action',
          name: 'Enviar email recordatorio',
          description: 'Enviar email personalizado al cliente',
          integration: 'gmail',
          config: {
            template: 'invoice_reminder',
            subject: 'Recordatorio: Factura pendiente de pago',
            to: '{{customer_email}}',
            body: 'Estimado {{customer_name}}, le recordamos que tiene una factura pendiente...'
          },
          position: { x: 200, y: 500 }
        }
      ],
      edges: [
        { id: 'e1', source: 'trigger-1', target: 'action-1', type: 'default' },
        { id: 'e2', source: 'action-1', target: 'condition-1', type: 'default' },
        { id: 'e3', source: 'condition-1', target: 'action-2', type: 'conditional', condition: 'true' }
      ],
      variables: {
        INVOICE_SPREADSHEET: '',
        reminder_frequency: '7'
      },
      settings: {
        timeout: 300000,
        retryCount: 3,
        errorHandling: 'continue'
      }
    } as WorkflowDefinition
  },
  {
    name: 'Onboarding Automático de Clientes',
    description: 'Secuencia automática de bienvenida para nuevos clientes',
    category: 'sales',
    industry: 'general',
    tags: ['onboarding', 'bienvenida', 'email', 'whatsapp'],
    definition: {
      nodes: [
        {
          id: 'trigger-1',
          type: 'trigger',
          name: 'Nuevo cliente registrado',
          description: 'Se activa cuando se registra un nuevo cliente',
          config: { type: 'webhook', endpoint: '/webhook/new-customer' },
          position: { x: 200, y: 50 }
        },
        {
          id: 'action-1',
          type: 'action',
          name: 'Email de bienvenida',
          description: 'Enviar email de bienvenida inmediato',
          integration: 'gmail',
          config: {
            template: 'welcome_email',
            subject: '¡Bienvenido a {{company_name}}!',
            to: '{{customer_email}}',
            delay: 0
          },
          position: { x: 200, y: 200 }
        },
        {
          id: 'action-2',
          type: 'delay',
          name: 'Esperar 1 día',
          description: 'Pausa antes del siguiente mensaje',
          config: { duration: 86400000 },
          position: { x: 200, y: 350 }
        },
        {
          id: 'action-3',
          type: 'action',
          name: 'WhatsApp de seguimiento',
          description: 'Mensaje de WhatsApp con información útil',
          integration: 'whatsapp',
          config: {
            template: 'onboarding_day1',
            to: '{{customer_phone}}',
            message: 'Hola {{customer_name}}, ¿cómo va tu experiencia con nosotros?'
          },
          position: { x: 200, y: 500 }
        },
        {
          id: 'action-4',
          type: 'delay',
          name: 'Esperar 1 semana',
          description: 'Pausa antes del check-up final',
          config: { duration: 604800000 },
          position: { x: 200, y: 650 }
        },
        {
          id: 'action-5',
          type: 'action',
          name: 'Email de satisfacción',
          description: 'Solicitar feedback y reseña',
          integration: 'gmail',
          config: {
            template: 'satisfaction_survey',
            subject: '¿Cómo ha sido tu experiencia?',
            to: '{{customer_email}}'
          },
          position: { x: 200, y: 800 }
        }
      ],
      edges: [
        { id: 'e1', source: 'trigger-1', target: 'action-1', type: 'default' },
        { id: 'e2', source: 'action-1', target: 'action-2', type: 'default' },
        { id: 'e3', source: 'action-2', target: 'action-3', type: 'default' },
        { id: 'e4', source: 'action-3', target: 'action-4', type: 'default' },
        { id: 'e5', source: 'action-4', target: 'action-5', type: 'default' }
      ],
      variables: {
        company_name: 'Mi Empresa',
        survey_link: 'https://forms.google.com/survey'
      },
      settings: {
        timeout: 600000,
        retryCount: 2,
        errorHandling: 'continue'
      }
    } as WorkflowDefinition
  },
  {
    name: 'Backup Automático de Datos',
    description: 'Copia de seguridad semanal de documentos importantes',
    category: 'administration',
    industry: 'general',
    tags: ['backup', 'seguridad', 'documentos', 'drive'],
    definition: {
      nodes: [
        {
          id: 'trigger-1',
          type: 'schedule',
          name: 'Cada domingo a las 23:00',
          description: 'Backup semanal automático',
          config: { cron: '0 23 * * 0' },
          position: { x: 200, y: 50 }
        },
        {
          id: 'action-1',
          type: 'action',
          name: 'Crear carpeta de backup',
          description: 'Crear carpeta con fecha actual',
          integration: 'drive',
          config: {
            action: 'create_folder',
            name: 'Backup_{{DATE}}',
            parent: '{{BACKUP_FOLDER_ID}}'
          },
          position: { x: 200, y: 200 }
        },
        {
          id: 'action-2',
          type: 'action',
          name: 'Copiar documentos importantes',
          description: 'Copiar archivos de carpetas críticas',
          integration: 'drive',
          config: {
            action: 'copy_files',
            source_folders: ['{{DOCUMENTS_FOLDER}}', '{{INVOICES_FOLDER}}'],
            destination: '{{backup_folder_id}}'
          },
          position: { x: 200, y: 350 }
        },
        {
          id: 'action-3',
          type: 'action',
          name: 'Exportar hoja de cálculo',
          description: 'Exportar datos importantes a Excel',
          integration: 'sheets',
          config: {
            spreadsheet_id: '{{MAIN_SPREADSHEET}}',
            export_format: 'xlsx',
            destination: '{{backup_folder_id}}'
          },
          position: { x: 200, y: 500 }
        },
        {
          id: 'action-4',
          type: 'action',
          name: 'Notificar completado',
          description: 'Enviar confirmación por email',
          integration: 'gmail',
          config: {
            to: '{{admin_email}}',
            subject: 'Backup completado - {{DATE}}',
            body: 'El backup automático se ha completado exitosamente.'
          },
          position: { x: 200, y: 650 }
        }
      ],
      edges: [
        { id: 'e1', source: 'trigger-1', target: 'action-1', type: 'default' },
        { id: 'e2', source: 'action-1', target: 'action-2', type: 'default' },
        { id: 'e3', source: 'action-2', target: 'action-3', type: 'default' },
        { id: 'e4', source: 'action-3', target: 'action-4', type: 'default' }
      ],
      variables: {
        BACKUP_FOLDER_ID: '',
        DOCUMENTS_FOLDER: '',
        INVOICES_FOLDER: '',
        MAIN_SPREADSHEET: '',
        admin_email: ''
      },
      settings: {
        timeout: 600000,
        retryCount: 2,
        errorHandling: 'stop'
      }
    } as WorkflowDefinition
  }
]

export async function seedTemplates() {
  try {
    console.log('Seeding workflow templates...')
    
    for (const template of defaultTemplates) {
      const existing = await prisma.workflowTemplate.findFirst({
        where: { name: template.name }
      })
      
      if (!existing) {
        await prisma.workflowTemplate.create({
          data: {
            ...template,
            definition: JSON.parse(JSON.stringify(template.definition))
          }
        })
        console.log(`✅ Created template: ${template.name}`)
      } else {
        console.log(`⏭️  Template already exists: ${template.name}`)
      }
    }
    
    console.log('✅ Template seeding completed')
  } catch (error) {
    console.error('❌ Error seeding templates:', error)
    throw error
  }
}

// Run if called directly
if (require.main === module) {
  seedTemplates()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}