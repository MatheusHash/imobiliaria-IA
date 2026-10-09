import { DeleteVisitSlotRuleButton } from "@/components/visits/delete-visit-slot-rule-button";
import { ToggleVisitSlotRule } from "@/components/visits/toggle-visit-slot-rule";
import { VisitSlotRuleForm } from "@/components/visits/visit-slot-rule-form";
import { requireAdmin } from "@/lib/auth";
import { requireModule } from "@/lib/modules";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const WEEKDAY_LABELS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export default async function AdminVisitDisponibilidadePage() {
  await requireAdmin("/admin/visitas/disponibilidade");
  await requireModule("visitas");

  const rules = await prisma.visitSlotRule.findMany({
    where: { userId: null },
    orderBy: [{ weekday: "asc" }, { startTime: "asc" }]
  });

  return (
    <main className="container-page py-10">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Administração</p>
        <h1 className="text-3xl font-bold text-foreground">Horários disponíveis para visita</h1>
        <p className="mt-2 text-muted-foreground">
          Janelas recorrentes em que o site aceita agendamento. Ainda não há agenda por corretor — é a disponibilidade geral da imobiliária.
        </p>
      </div>

      <VisitSlotRuleForm />

      <div className="mt-6 overflow-hidden rounded-xl border bg-background shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="text-left text-xs font-semibold uppercase tracking-wide text-primary">
              <tr>
                <th className="px-4 py-3">Dia</th>
                <th className="px-4 py-3">Das</th>
                <th className="px-4 py-3">Até</th>
                <th className="px-4 py-3">Duração</th>
                <th className="px-4 py-3">Ativo</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rules.map((rule) => (
                <tr key={rule.id} className={rule.active ? "" : "text-muted-foreground"}>
                  <td className="px-4 py-3 font-medium">{WEEKDAY_LABELS[rule.weekday]}</td>
                  <td className="px-4 py-3">{rule.startTime}</td>
                  <td className="px-4 py-3">{rule.endTime}</td>
                  <td className="px-4 py-3">{rule.slotMinutes} min</td>
                  <td className="px-4 py-3">
                    <ToggleVisitSlotRule id={rule.id} active={rule.active} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DeleteVisitSlotRuleButton id={rule.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rules.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">Nenhum horário cadastrado — o site ainda não mostra nenhuma data disponível.</div>
        )}
      </div>
    </main>
  );
}
