// --- CONFIGURAÇÕES GERAIS ---
// Mantenha suas chaves aqui
const NOTION_TOKEN = 'seu_token_aqui';
const DATABASE_ID = 'id_do_banco_calendario';
const CALENDAR_ID = 'seu_email@gmail.com';

const NOTION_VERSION = '2022-06-28';
const HEADERS = {
  'Authorization': 'Bearer ' + NOTION_TOKEN,
  'Notion-Version': NOTION_VERSION,
  'Content-Type': 'application/json'
};

function sincronizarNotionCalendar() {
  const url = `https://api.notion.com/v1/databases/${DATABASE_ID}/query`;
  const payload = {
    "filter": {
      "timestamp": "last_edited_time",
      "last_edited_time": { "past_week": {} }
    }
  };

  const options = {
    method: 'post',
    headers: HEADERS,
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  if (response.getResponseCode() !== 200) return;

  const results = JSON.parse(response.getContentText()).results;
  const calendar = CalendarApp.getCalendarById(CALENDAR_ID);

  results.forEach(page => processarItem(page, calendar));
}

// Função de tratamento de data (ajustada para 00:00 para facilitar cálculos de horário)
function parseDateLocal(dateStr) {
  if (!dateStr) return null;
  if (dateStr.includes('T')) return new Date(dateStr);
  const parts = dateStr.split('-');
  return new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0);
}

function processarItem(page, calendar) {
  const props = page.properties;

  if (!props['Name']?.title[0] || !props['Date']?.date) return;

  const pageId = page.id;
  const nome = props['Name'].title[0].plain_text;
  const gcalId = props['Google Calendar ID']?.rich_text[0]?.plain_text || null;
  const tipo = (props['Tipo']?.select?.name || "").trim();

  // 1. LÓGICA DE EXCLUSÃO
  if (tipo === 'Excluida') {
    if (gcalId) {
      try {
        const evento = calendar.getEventById(gcalId);
        if (evento) evento.deleteEvent();
        atualizarNotionComGcalId(pageId, "");
        Logger.log(`Ação: Evento "${nome}" removido.`);
      } catch (e) {
        atualizarNotionComGcalId(pageId, "");
      }
    }
    return;
  }

  // 2. PREPARAÇÃO DE DATAS
  const dataOriginal = parseDateLocal(props['Date'].date.start);
  let dataInicio = new Date(dataOriginal);
  let dataFim = new Date(dataOriginal);
  let ehDiaInteiro = true;
  let lembretes = [];

  // 3. BUSCA DE HORÁRIOS (PROVA E TRABALHO)
  if (tipo === 'Prova' || tipo === 'Trabalho') {
    const materiaRelation = props['Matéria']?.relation;

    if (materiaRelation && materiaRelation.length > 0) {
      // Busca o horário na matéria vinculada usando o dia da semana (0-6)
      const infoHorario = buscarHorarioMateria(materiaRelation[0].id, dataOriginal.getDay());

      if (infoHorario) {
        ehDiaInteiro = false;
        dataInicio.setHours(infoHorario.hInicio, infoHorario.mInicio, 0, 0);
        dataFim.setHours(infoHorario.hFim, infoHorario.mFim, 0, 0);
      }
    }

    // Cálculo de lembretes para 09:00 AM (Independente do horário da aula)
    // Offset em minutos do início do dia até o início do evento
    const offset = ehDiaInteiro ? 0 : (dataInicio.getHours() * 60 + dataInicio.getMinutes());

    if (tipo === 'Prova') {
      // 6 dias (8640 min) e 3 dias (4320 min). Ajusta para soar às 09:00 AM.
      lembretes = [(8640 + offset - 540), (4320 + offset - 540)];
    } else {
      // 1 dia (1440 min). Ajusta para soar às 09:00 AM.
      lembretes = [(1440 + offset - 540)];
    }
  }

  // 4. LÓGICA PARA CONTAS A PAGAR
  else if (tipo === 'Contas a pagar') {
    ehDiaInteiro = false;
    dataInicio.setHours(9, 0, 0, 0);
    dataFim = new Date(dataInicio);
    dataFim.setHours(10, 0, 0, 0);
    lembretes = [1440, 0]; // 1 dia antes às 09:00 e no próprio dia às 09:00
  }

  // 5. SINCRONIZAÇÃO GOOGLE CALENDAR
  try {
    let evento;
    if (!gcalId) {
      evento = ehDiaInteiro ? calendar.createAllDayEvent(nome, dataInicio) : calendar.createEvent(nome, dataInicio, dataFim);
      atualizarNotionComGcalId(pageId, evento.getId());
    } else {
      evento = calendar.getEventById(gcalId);
      if (evento) {
        evento.setTitle(nome);
        ehDiaInteiro ? evento.setAllDayDate(dataInicio) : evento.setTime(dataInicio, dataFim);
      }
    }

    if (evento) {
      evento.removeAllReminders();
      lembretes.forEach(min => {
        if (min >= 0) evento.addPopupReminder(min);
      });
    }
    Logger.log(`Processado: ${nome} | Tipo: ${tipo} | Horário: ${ehDiaInteiro ? 'Dia Inteiro' : dataInicio.getHours()+':'+dataInicio.getMinutes()}`);
  } catch (e) {
    Logger.log(`Erro crítico em "${nome}": ${e.message}`);
  }
}

// FUNÇÃO PARA BUSCAR HORÁRIO NO BANCO DE DISCIPLINAS
function buscarHorarioMateria(materiaPageId, diaSemana) {
  const colunas = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const nomeColuna = colunas[diaSemana];

  try {
    const response = UrlFetchApp.fetch(`https://api.notion.com/v1/pages/${materiaPageId}`, { headers: HEADERS });
    const res = JSON.parse(response.getContentText());
    const horarioStr = res.properties[nomeColuna]?.rich_text[0]?.plain_text;

    if (horarioStr && horarioStr.includes('-')) {
      const partes = horarioStr.split('-');
      const inicio = partes[0].trim().split(':');
      const fim = partes[1].trim().split(':');
      return {
        hInicio: parseInt(inicio[0]), mInicio: parseInt(inicio[1]),
        hFim: parseInt(fim[0]), mFim: parseInt(fim[1])
      };
    }
  } catch (e) { return null; }
  return null;
}

function atualizarNotionComGcalId(pageId, gcalId) {
  const url = `https://api.notion.com/v1/pages/${pageId}`;
  UrlFetchApp.fetch(url, {
    method: 'patch',
    headers: HEADERS,
    payload: JSON.stringify({
      "properties": { "Google Calendar ID": { "rich_text": [{ "text": { "content": gcalId } }] } }
    })
  });
}