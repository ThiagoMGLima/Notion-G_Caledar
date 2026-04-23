
---

# Notion to Google Calendar Intelligent Sync

Esta automação provê uma sincronização robusta e inteligente entre bases de dados do **Notion** e o **Google Calendar** utilizando **Google Apps Script**. O diferencial deste projeto reside na capacidade de mapear horários de eventos (como provas e trabalhos) dinamicamente, baseando-se em uma grade curricular relacional, além de gerir múltiplos esquemas de notificação e processos de exclusão automatizada.



## 🚀 Funcionalidades

* **Sincronização Incremental:** Processa apenas itens editados na última semana, otimizando o consumo de cotas das APIs.
* **Mapeamento Relacional de Horários:** Identifica a disciplina vinculada ao evento e consulta uma base secundária para definir o horário de início e fim com base no dia da semana.
* **Gestão de Notificações Inteligentes:** * **Provas:** Alertas em 6 e 3 dias de antecedência, disparados invariavelmente às 09:00 AM.
    * **Trabalhos:** Alerta em 1 dia de antecedência às 09:00 AM.
    * **Contas a Pagar:** Conversão para evento com horário fixo (09:00-10:00) para garantir notificação precisa no dia do vencimento.
* **Ciclo de Vida de Eventos:** Suporta criação, atualização de metadados e exclusão física no Google Calendar através do gatilho de status "Excluida".

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
    * `Tipo` (Select): Determina a lógica de notificação e o gatilho de exclusão. Opções:
        * `Prova`: Notificação 6 e 3 dias antes (09:00 AM).
        * `Trabalho`: Notificação 1 dia antes (09:00 AM).
        * `Contas a pagar`: Converte para horário fixo (09:00 AM) com alerta no dia.
        * `Excluida`: Gatilho para remoção automática no Google Calendar.
    * `Matéria` (Relation): Conexão com o banco de `Disciplinas`.
    * `Google Calendar ID` (Rich Text): Campo técnico preenchido automaticamente pelo script. **Não editar manualmente.**



---

## 🔗 Configurando a Relação (Passo a Passo)

1.  No banco **Calendário**, adicione uma nova propriedade do tipo **Relation**.
2.  Selecione o banco de dados **Disciplinas**.
3.  Renomeie a propriedade para `Matéria` (certifique-se de usar a acentuação correta para que o script a localize).
4.  Para cada item criado no Calendário, clique na célula `Matéria` e selecione a disciplina correspondente.

### 🔐 Autorização e Conexões

Para que o script acesse os dados, a integração deve ter permissão explícita em **ambas** as páginas:
1.  No Notion, abra a página do banco de dados (faça isso tanto para o `Calendário` quanto para o `Disciplinas`).
2.  Clique nos três pontos (**...**) no canto superior direito.
3.  Vá em **Connections** e clique em **Add Connections**.
4.  Pesquise e selecione o nome da sua integração (ex: `Notion Sync`).


---

## 🔧 Configuração e Instalação

1.  **Integração no Notion:**
    * Crie uma integração em [notion.so/my-integrations](https://www.notion.so/my-integrations).
    * Obtenha o `Internal Integration Token`.
    * Compartilhe ambos os bancos de dados com a integração criada.

2.  **Configuração no Google Apps Script:**
    * Acesse o [Google Apps Script](https://script.google.com/).
    * Crie um novo projeto e cole o código fornecido em `Code.gs`.
    * No menu lateral, clique em **Serviços (+)** e adicione a **Google Calendar API**.
    * Preencha as constantes no topo do script:
        ```javascript
        const NOTION_TOKEN = 'seu_token_aqui';
        const DATABASE_ID = 'id_do_banco_calendario';
        const CALENDAR_ID = 'seu_email@gmail.com';
        ```

3.  **Configuração de Gatilhos (Triggers):**
    * No menu lateral, acesse **Acionadores (Triggers)**.
    * Adicione um novo acionador para a função `sincronizarNotionCalendar`.
    * Configure como **Baseado no tempo** -> **Temporizador de minutos/horas** (recomendado: 30 a 60 minutos).

## ⚠️ Observações de Manutenção

* **Zelo pelo ID:** Não altere manualmente a coluna `Google Calendar ID`. Ela garante que o script não duplique eventos.
* **Formatação de Horário:** O script utiliza `split('-')`. Certifique-se de que não existam espaços entre o hífen e os números nas colunas de dias da semana (Ex: `08:00-09:40`).
* **Processo de Exclusão:** Para remover um evento, altere o `Tipo` para `Excluida` e aguarde a execução do script antes de deletar a linha permanentemente do Notion.

---

## 📄 Licença

Este projeto é de código aberto sob a licença MIT. Sinta-se à vontade para adaptá-lo às suas necessidades acadêmicas ou profissionais.

---
*README gerado para fins de documentação técnica de fluxo de trabalho automatizado.*