import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncReminders, verifyUnsubscribeToken } from "@/lib/reminders";

function page(title: string, body: string) {
  return `<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;background:#FDFCF8;color:#14130F;font-family:Inter,Arial,sans-serif;display:grid;place-items:center;min-height:100vh;padding:24px">
<div style="max-width:420px;width:100%;background:#fff;border:1px solid #E7E3D8;padding:32px">
<div style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#6B675C">POznaj</div>
<h1 style="font-family:Georgia,serif;font-size:26px;margin:10px 0 12px">${title}</h1>
<p style="font-size:15px;line-height:1.6;color:#3D3A33;margin:0 0 20px">${body}</p>
<a href="https://po-znaj.pl" style="display:inline-block;background:#3D5A40;color:#fff;text-decoration:none;padding:12px 18px;font-size:15px;font-weight:600">Wróć do POznaj</a>
</div></body></html>`;
}

export async function GET(request: NextRequest) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const userId = verifyUnsubscribeToken(token);

  if (!userId) {
    return new NextResponse(page("Nieprawidłowy link", "Ten link jest nieaktualny lub nieprawidłowy."), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  await prisma.user.update({ where: { id: userId }, data: { emailReminders: false } });
  await syncReminders(prisma, userId);

  return new NextResponse(
    page("Przypomnienia wyłączone", "Nie będziemy już wysyłać Ci przypomnień e-mail. Możesz włączyć je ponownie w ustawieniach."),
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
