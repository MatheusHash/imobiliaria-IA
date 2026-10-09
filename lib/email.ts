// Camada de envio de e-mail isolada atrás de uma interface pequena, para trocar o
// remetente por um provedor real (Resend, SendGrid, SES...) sem tocar em quem chama
// `emailSender.send`. Hoje não há provedor configurado — ver docs/modulos.md, pergunta
// 5.6: decisão pendente do dono do produto (qual serviço, qual domínio remetente).
// Enquanto isso, o envio só registra no log do servidor.

export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
};

export interface EmailSender {
  send(message: EmailMessage): Promise<void>;
}

class ConsoleEmailSender implements EmailSender {
  async send(message: EmailMessage) {
    console.log(`[email] (sem provedor configurado) Para: ${message.to} | Assunto: ${message.subject}\n${message.text}`);
  }
}

export const emailSender: EmailSender = new ConsoleEmailSender();
