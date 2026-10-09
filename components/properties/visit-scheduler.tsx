"use client";

import { useActionState, useMemo, useState } from "react";
import { CalendarCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/field";
import type { ActionState } from "@/lib/actions";
import { createVisitAction } from "@/lib/visit-actions";
import type { AvailableDay } from "@/lib/visits";
import { cn } from "@/lib/utils";

const initialState: ActionState = {};

const dayLabelFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" });

export function VisitScheduler({ propertyId, days }: { propertyId: string; days: AvailableDay[] }) {
  const [state, formAction, pending] = useActionState(createVisitAction, initialState);
  const [selectedDate, setSelectedDate] = useState(days[0]?.date ?? "");
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const selectedDay = useMemo(() => days.find((day) => day.date === selectedDate), [days, selectedDate]);

  if (state.success) {
    return (
      <div className="mt-8">
        <h2 className="text-2xl font-bold">Agendar visita</h2>
        <div className="mt-4 flex flex-col items-center gap-3 rounded-xl border bg-secondary p-6 text-center">
          <CheckCircle2 className="h-10 w-10 text-primary" />
          <p className="font-semibold text-foreground">{state.message}</p>
        </div>
      </div>
    );
  }

  if (days.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold">Agendar visita</h2>
      <p className="mt-1 text-sm text-muted-foreground">Escolha um horário e deixe seus dados — nossa equipe confirma a visita.</p>

      <form action={formAction} className="mt-4 rounded-xl border bg-background p-6">
        <input type="hidden" name="propertyId" value={propertyId} />
        <input type="hidden" name="scheduledFor" value={selectedSlot ?? ""} />
        {/* Honeypot: invisível para pessoas, preenchido por robôs de spam. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label htmlFor="visit-website">Site</label>
          <input id="visit-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        {state.message && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{state.message}</div>}

        <div className="flex flex-wrap gap-2">
          {days.map((day) => (
            <button
              key={day.date}
              type="button"
              onClick={() => {
                setSelectedDate(day.date);
                setSelectedSlot(null);
              }}
              className={cn(
                "flex flex-col items-center rounded-lg border px-3 py-2 text-sm",
                selectedDate === day.date ? "border-primary bg-primary text-primary-foreground" : "hover:bg-secondary"
              )}
            >
              <span className="font-semibold">{day.label.slice(0, 3)}</span>
              <span>{dayLabelFormatter.format(new Date(`${day.date}T12:00:00`))}</span>
            </button>
          ))}
        </div>

        {selectedDay && (
          <div className="mt-4 flex flex-wrap gap-2">
            {selectedDay.slots.map((slot) => (
              <button
                key={slot.iso}
                type="button"
                onClick={() => setSelectedSlot(slot.iso)}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-sm font-medium",
                  selectedSlot === slot.iso ? "border-primary bg-primary text-primary-foreground" : "hover:bg-secondary"
                )}
              >
                {slot.time}
              </button>
            ))}
          </div>
        )}

        {selectedSlot && (
          <div className="mt-5 space-y-4 border-t pt-4">
            <div>
              <Label htmlFor="visitorName">Nome</Label>
              <Input id="visitorName" name="visitorName" autoComplete="name" defaultValue={state.values?.visitorName} required />
              <FieldError message={state.errors?.visitorName?.[0]} />
            </div>
            <div>
              <Label htmlFor="visitorEmail">E-mail</Label>
              <Input id="visitorEmail" name="visitorEmail" type="email" autoComplete="email" defaultValue={state.values?.visitorEmail} required />
              <FieldError message={state.errors?.visitorEmail?.[0]} />
            </div>
            <div>
              <Label htmlFor="visitorPhone">Telefone / WhatsApp</Label>
              <Input
                id="visitorPhone"
                name="visitorPhone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="(00) 00000-0000"
                defaultValue={state.values?.visitorPhone}
                required
              />
              <FieldError message={state.errors?.visitorPhone?.[0]} />
            </div>
            <label className="flex items-start gap-2 text-xs text-muted-foreground">
              <input type="checkbox" required className="mt-0.5 h-4 w-4 rounded border-border" />
              Concordo em ser contatado pela equipe sobre esta visita.
            </label>
            <Button type="submit" className="w-full gap-2" disabled={pending}>
              <CalendarCheck className="h-4 w-4" />
              {pending ? "Agendando..." : "Confirmar agendamento"}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
