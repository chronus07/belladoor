// ==============================================================================
// BELLADOOR - MOTOR DE CÁLCULO DE AGENDAMENTOS COM DESLOCAMENTO (BUFFER TIME)
// Regra de negócio essencial para atendimento de beleza a domicílio
// ==============================================================================

import { AvailabilityRule, Appointment } from '../types';

export interface TimeSlot {
  startTime: string; // '09:00'
  endTime: string;   // '10:00'
  isAvailable: boolean;
  reason?: string;
}

/**
 * Converte 'HH:mm' para total de minutos desde a meia-noite (0 a 1439)
 */
export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Converte minutos totais de volta para formato 'HH:mm'
 */
export function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Calcula os horários disponíveis para agendamento considerando:
 * 1. A grade de trabalho do dia
 * 2. A duração do serviço desejado
 * 3. O tempo de deslocamento (bufferTimeMinutes) antes e depois de cada atendimento existente
 * 4. Os agendamentos já confirmados
 */
export function calculateAvailableSlots(params: {
  workSchedule: AvailabilityRule;
  existingAppointments: Appointment[];
  serviceDurationMinutes: number;
  bufferTimeMinutes: number;
  slotIntervalMinutes?: number; // De quanto em quanto tempo testar (padrão: 30 min)
}): TimeSlot[] {
  const {
    workSchedule,
    existingAppointments,
    serviceDurationMinutes,
    bufferTimeMinutes,
    slotIntervalMinutes = 30,
  } = params;

  const slots: TimeSlot[] = [];
  const dayStart = timeToMinutes(workSchedule.startTime);
  const dayEnd = timeToMinutes(workSchedule.endTime);

  // Mapeia os intervalos ocupados com margem de deslocamento
  const blockedIntervals = existingAppointments
    .filter((app) => app.status !== 'CANCELLED')
    .map((app) => {
      const appStart = timeToMinutes(app.startTime);
      const appEnd = timeToMinutes(app.endTime);
      return {
        // Bloqueia um pouco antes (para chegar ao cliente) e depois (para ir ao próximo)
        start: Math.max(0, appStart - bufferTimeMinutes),
        end: appEnd + bufferTimeMinutes,
      };
    });

  // Percorre a grade do dia testando horários
  for (
    let currentStart = dayStart;
    currentStart + serviceDurationMinutes <= dayEnd;
    currentStart += slotIntervalMinutes
  ) {
    const currentEnd = currentStart + serviceDurationMinutes;

    // Verifica se esse horário conflita com algum atendimento ou margem de trânsito
    const hasCollision = blockedIntervals.some(
      (blocked) => currentStart < blocked.end && currentEnd > blocked.start
    );

    slots.push({
      startTime: minutesToTime(currentStart),
      endTime: minutesToTime(currentEnd),
      isAvailable: !hasCollision,
      reason: hasCollision ? 'Conflito com atendimento ou tempo de deslocamento' : undefined,
    });
  }

  return slots;
}
