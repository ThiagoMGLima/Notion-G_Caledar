
---

# Notion to Google Calendar Intelligent Sync

Esta automação provê uma sincronização robusta e inteligente entre bases de dados do **Notion** e o **Google Calendar** utilizando **Google Apps Script**. O diferencial deste projeto reside na capacidade de mapear horários de eventos (como provas e trabalhos) dinamicamente, baseando-se em uma grade curricular relacional, além de gerir múltiplos esquemas de notificação e processos de exclusão automatizada.



## 🚀 Funcionalidades

* **Sincronização Incremental:** Processa apenas itens editados na última semana, otimizando o consumo de cotas das APIs.
* **Mapeamento Relacional de Horários:** Identifica a disciplina vinculada ao evento e consulta uma base secundária para definir o horário de início e fim com base no dia da semana.
* **Gestão de Notificações Inteligentes:** * **Provas:** Alertas em 6 e 3 dias de antecedência, disparados invariavelmente às 09:00 AM.
    * **Trabalhos:** Alerta em 1 dia de antecedência às 09:00 AM.
    * **Contas a Pagar:** Conversão para evento com horário fixo (09:00-10:00) para garantir notificação precisa no dia do vencimento às 09:00 AM.
* **Ciclo de Vida de Eventos:** Suporta criação, atualização de metadados e exclusão física no Google Calendar através do gatilho de tipo "Excluida".

## 🛠️ Tecnologias Utilizadas

* **Google Apps Script:** Motor de execução e integração.
* **Notion API (v2022-06-28):** Fonte de dados.
* **Google Calendar API:** Destino da sincronização.

---

## 📂 Estrutura do Notion (Data Schema)

A inteligência desta automação reside na correta estruturação e interconexão de dois bancos de dados. Siga as especificações abaixo rigorosamente:

### 1. Banco de Dados: `Disciplinas` (Tabela de Referência)
Este banco funciona como a sua grade horária fixa. Ele é consultado pelo script para definir os horários de início e fim dos eventos.

* **Propriedades Obrigatórias:**
    * `Name` (Título): Nome da disciplina (ex: `Cálculo I`).
    * `Segunda`, `Terça`, `Quarta`, `Quinta`, `Sexta`, `Sábado` (Texto): Horário da aula.
* **⚠️ Regra de Formatação Crítica:**
    * O horário deve seguir o padrão estrito `HH:mm-HH:mm` (ex: `15:50-17:30`).
    * Não utilize espaços entre os números e o hífen.
    * Dias sem aula devem ser deixados **em branco**. O script interpretará células vazias como eventos de "Dia Inteiro".



### 2. Banco de Dados: `Calendário` (Base Principal)
Onde você insere seus compromissos, provas e contas.

* **Propriedades Obrigatórias:**
    * `Name` (Título): Descrição do compromisso.
    * `Date` (Data): Data do evento.
    * `Tipo` (Select): Determina a lógica de notificação e o gatilho de exclusão. Opções: `Prova`, `Trabalho`, `Contas a pagar`, `Excluida`.
    * `Matéria` (Relation): Conexão com o banco de `Disciplinas`.
    * `Google Calendar ID` (Rich Text): Campo técnico preenchido automaticamente pelo script.



---

## 🔗 Configuração e Conexão

### Como obter os IDs do Notion
Para configurar o script, você precisará do `DATABASE_ID` do seu banco de dados **Calendário**.
1. Abra o banco de dados no navegador.
2. O ID é a sequência de 32 caracteres na URL localizada entre a última barra (`/`) e o ponto de interrogação (`?`).
   * Exemplo: `notion.so/usuario/732095dcf0db445a963f91b0cc05a366?v=...` -> O ID é `732095dcf0db445a963f91b0cc05a366`.

### Configurando a Relação (Passo a Passo)
1. No banco **Calendário**, adicione uma propriedade do tipo **Relation**.
2. Selecione o banco de dados **Disciplinas**.
3. Renomeie a propriedade para **`Matéria`** (respeite a acentuação).
4. Para cada item no Calendário, selecione a disciplina correspondente.

### 🔐 Autorização
A integração deve ter permissão explícita em **ambas** as páginas:
1. No Notion, abra as páginas dos bancos de dados.
2. Clique nos três pontos (**...**) no canto superior direito -> **Add Connections**.
3. Selecione o nome da sua integração.

---

## 🔧 Instalação no Google Apps Script

1. Acesse o [Google Apps Script](https://script.google.com/).
2. Crie um novo projeto e cole o código fornecido em `Code.gs`.
3. No menu lateral, clique em **Serviços (+)** e adicione a **Google Calendar API**.
4. Configure as constantes no topo do script com o seu Token e IDs.
5. Acesse **Acionadores (Triggers)** no menu lateral e configure a função `sincronizarNotionCalendar` para rodar "Baseado no tempo" (recomendado: a cada 30 ou 60 minutos).

## ⚠️ Observações de Manutenção

* **Zelo pelo ID:** Nunca altere manualmente a coluna `Google Calendar ID`. Ela evita a duplicidade de eventos.
* **Formatação:** Certifique-se de que não existam espaços nas colunas de horários (ex: use `08:00-09:40` e não `08:00 - 09:40`).
* **Processo de Exclusão:** Altere o `Tipo` para `Excluida` e aguarde a execução do script para que o evento seja removido do Google Calendar antes de apagar a linha no Notion.

---

## 📄 Licença

Este projeto está sob a licença MIT. Sinta-se à vontade para adaptá-lo às suas necessidades acadêmicas.

---
*README gerado para fins de documentação técnica de fluxo de trabalho automatizado.*