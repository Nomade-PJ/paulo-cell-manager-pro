import { supabase } from "@/integrations/supabaseClient";

// Tipos para as notificações
export type NotificationType = 'service' | 'inventory' | 'payment' | 'document' | 'system';

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  description: string;
  actionLink?: string;
  relatedId?: string;
}

/**
 * Envia uma notificação para um usuário específico
 */
export const sendNotification = async (params: CreateNotificationParams) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert([
        {
          user_id: params.userId,
          type: params.type,
          title: params.title,
          description: params.description,
          read: false,
          action_link: params.actionLink,
          related_id: params.relatedId,
          created_at: new Date().toISOString()
        }
      ]);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Erro ao enviar notificação:", error);
    throw error;
  }
};

/**
 * Envia uma notificação para múltiplos usuários (administradores)
 */
export const sendAdminNotification = async (params: Omit<CreateNotificationParams, 'userId'>) => {
  try {
    // Buscar todos os usuários administradores
    const { data: admins, error: adminsError } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'Admin');

    if (adminsError) throw adminsError;
    if (!admins || admins.length === 0) return null;

    // Criar uma notificação para cada admin
    const notifications = admins.map(admin => ({
      user_id: admin.id,
      type: params.type,
      title: params.title,
      description: params.description,
      read: false,
      action_link: params.actionLink,
      related_id: params.relatedId,
      created_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('notifications')
      .insert(notifications);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Erro ao enviar notificação para administradores:", error);
    throw error;
  }
};

/**
 * Envia uma notificação sobre estoque baixo
 */
export const sendLowStockNotification = async (userId: string, itemName: string, quantity: number, itemId: string) => {
  return sendNotification({
    userId,
    type: 'inventory',
    title: `Estoque baixo: ${itemName}`,
    description: `Apenas ${quantity} ${quantity === 1 ? 'unidade restante' : 'unidades restantes'}`,
    actionLink: `/dashboard/inventory`,
    relatedId: itemId
  });
};

/**
 * Envia uma notificação sobre serviço aguardando
 */
export const sendServiceWaitingNotification = async (userId: string, serviceNumber: string, days: number, serviceId: string) => {
  return sendNotification({
    userId,
    type: 'service',
    title: `Serviço #${serviceNumber} aguardando ação`,
    description: `Sem atualização há ${days} ${days === 1 ? 'dia' : 'dias'}`,
    actionLink: `/dashboard/service-registration/${serviceId}`,
    relatedId: serviceId
  });
};

/**
 * Envia uma notificação sobre pagamento pendente
 */
export const sendPaymentPendingNotification = async (userId: string, clientName: string, value: number, serviceId: string) => {
  return sendNotification({
    userId,
    type: 'payment',
    title: `Pagamento pendente de ${clientName}`,
    description: `R$ ${value.toFixed(2).replace('.', ',')} - Vence hoje`,
    actionLink: `/dashboard/service-registration/${serviceId}`,
    relatedId: serviceId
  });
};

/**
 * Envia uma notificação sobre documento fiscal
 */
export const sendDocumentNotification = async (userId: string, documentNumber: string, status: string, documentId: string) => {
  return sendNotification({
    userId,
    type: 'document',
    title: `Documento fiscal #${documentNumber}`,
    description: status,
    actionLink: `/dashboard/documents`,
    relatedId: documentId
  });
};

/**
 * Envia uma notificação sobre atualização do sistema
 */
export const sendSystemUpdateNotification = async (userId: string, title: string, description: string) => {
  return sendNotification({
    userId,
    type: 'system',
    title,
    description
  });
}; 