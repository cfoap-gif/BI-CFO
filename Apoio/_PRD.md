# PRD — Sistema de Boletim Interno do CFO
## 1. Nome do Produto
Sistema de Boletim Interno do CFO
Sigla sugerida: BI-CFO
## 2. Visão Geral
O BI-CFO será um sistema web destinado ao registro, validação, organização e geração do Boletim Interno do Curso de Formação de Oficiais da Academia Bombeiro Militar do CBMAP.
O sistema deverá centralizar informações provenientes da Coordenação do CFO, Livro de Dia, escalas, QTS, instrutores, monitores e registros administrativos, permitindo que a Coordenação gere um PDF oficial, enxuto, moderno, formal e pronto para publicação ou arquivamento.
A lógica do produto será:
Registrar com detalhe.
Validar com segurança.
Publicar apenas o essencial.
Gerar um PDF oficial bem formatado.
## 3. Problema
Atualmente, as informações da rotina do CFO podem ficar dispersas em escalas, registros do Aluno de Dia, QTS, comunicações da Coordenação, anotações administrativas e documentos avulsos.
Isso gera riscos como:
retrabalho na digitação;
perda de informações relevantes;
dificuldade de consolidar dados diários;
ausência de padronização documental;
demora na geração do Boletim Interno;
excesso de informações pouco relevantes no documento final;
dificuldade de localizar registros antigos;
dependência de edição manual em documentos de texto.
## 4. Objetivo do Produto
Criar um sistema simples, seguro e funcional para transformar registros da rotina do CFO em um Boletim Interno oficial em PDF.
O sistema deve:
facilitar o preenchimento pelo Aluno de Dia;
permitir revisão e validação pela Coordenação;
aproveitar informações do QTS e das escalas;
separar informações internas, restritas e publicáveis;
gerar PDF moderno, formal e enxuto;
manter histórico dos BIs gerados;
permitir geração diária ou por período selecionado.
## 5. Público-Alvo
### 5.1 Usuários principais
Coordenação do CFO;
Coordenadores de pelotão;
Aluno de Dia ao Corpo de Alunos;
Aluno de Dia ao Pelotão;
Instrutores;
Monitores.
### 5.2 Usuários secundários
Comando da Academia Bombeiro Militar;
Seções administrativas da ABM;
militares autorizados para consulta;
equipe responsável pelo arquivo documental do curso.
## 6. Escopo do MVP
A primeira versão deverá focar no funcionamento mínimo necessário para gerar um BI real em PDF.
### 6.1 Funcionalidades incluídas no MVP
Cadastro de alunos oficiais;
Cadastro de instrutores/militares;
Cadastro de disciplinas;
Cadastro simples de escalas;
Lançamento de Livro de Dia;
Registro de faltas e atrasos;
Registro de instruções ministradas;
Registro de missões internas e externas;
Registro de alterações de material;
Validação pela Coordenação;
Classificação do registro como publicável, interno ou restrito;
Prévia do Boletim Interno;
Geração de PDF;
Arquivo dos BIs gerados;
Geração diária ou por período selecionado.
### 6.2 Fora do MVP
Ficam fora da primeira versão:
assinatura eletrônica;
QR Code de validação;
integração com sistema externo do Estado;
importação automática de planilhas;
aplicativo mobile nativo;
notificações push;
IA para resumir registros;
controle completo de comportamento escolar;
integração com e-mail ou WhatsApp;
reconhecimento de documentos por OCR;
geração automática de processo disciplinar.
Essas funções poderão ser planejadas para fases futuras.
## 7. Princípios de Design do Produto
O sistema deverá seguir os seguintes princípios:
Pouca digitação manual;
Campos objetivos;
Botões claros;
Fluxo simples;
Visual institucional;
Separação clara entre rascunho, validado e publicado;
Dados sensíveis protegidos;
PDF final limpo e formal;
Histórico preservado;
Uso confortável em desktop e smartphone.
## 8. Fluxo Principal
### 8.1 Fluxo diário padrão
Coordenação cadastra ou confere escalas e QTS do dia.
O sistema cria a base do Livro de Dia.
Aluno de Dia acessa o Livro de Dia.
O sistema já mostra atividades previstas, escalas e instruções.
Aluno de Dia registra o que realmente ocorreu.
Aluno de Dia lança faltas, atrasos, baixas, alterações e missões.
Aluno de Dia envia o Livro de Dia para a Coordenação.
Coordenação revisa os registros.
Coordenação marca o que entra ou não no BI.
Sistema monta a prévia do Boletim Interno.
Coordenação revisa a prévia.
Coordenação aprova.
Sistema gera o PDF.
BI fica arquivado.
### 8.2 Fluxo por período
Coordenação seleciona data inicial e data final.
Sistema busca todos os registros validados no período.
Sistema agrupa os registros por parte e por data.
Coordenação revisa a prévia consolidada.
Sistema gera um único PDF para o período.
## 9. Regras de Periodicidade
O BI será preferencialmente diário, mas poderá ser gerado por período selecionado.
### 9.1 BI diário
Quando data inicial e data final forem iguais, o sistema considera o documento como BI diário.
Exemplo:
BI CFO nº 005/2026
Macapá-AP, 02 de junho de 2026.
### 9.2 BI por período
Quando data inicial e data final forem diferentes, o sistema considera o documento como BI por período.
Exemplo:
BI CFO nº 006/2026
Período abrangido: 01/06/2026 a 03/06/2026
Macapá-AP, 03 de junho de 2026.
## 10. Estrutura do PDF
O PDF final deverá conter:
Cabeçalho institucional;
Número do BI;
Data de publicação;
Período abrangido, quando houver;
1ª Parte — Legislação, Organização e Ensino;
2ª Parte — Alteração de Pessoal;
3ª Parte — Assuntos Gerais e Administrativos;
4ª Parte — Justiça, Disciplina e Comportamento Escolar;
5ª Parte — Comunicação Social, Avisos e Prescrições Diversas;
Campo de aprovação;
Rodapé com controle documental.
## 11. Estilo Visual do PDF
O PDF deverá ser moderno, formal, limpo e de fácil leitura.
Características obrigatórias:
papel A4;
fonte legível;
títulos em caixa alta;
cabeçalho centralizado;
partes bem destacadas;
tabelas com cabeçalho em cinza claro;
linhas leves;
pouco uso de bordas;
textos curtos;
espaçamento adequado;
rodapé com página, data de geração, versão e código de verificação.
O documento deve parecer oficial, mas mais organizado e legível do que um boletim tradicional pesado.
## 12. Estrutura das Partes do BI
### 12.1 1ª Parte — Legislação, Organização e Ensino
Conteúdos possíveis:
alterações de QTS;
ordens de ensino;
orientações pedagógicas;
instruções extraordinárias;
designação de instrutores;
orientações sobre PLAV;
mudanças de horário;
mudanças de local de instrução;
regras temporárias da Coordenação.
Regra:
Se não houver registro validado, exibir:
“Sem alteração.”
### 12.2 2ª Parte — Alteração de Pessoal
Conteúdos possíveis:
faltas;
atrasos;
baixas;
dispensas;
apresentações;
reapresentações;
restrições médicas com impacto na atividade;
alterações de situação de aluno;
exclusão, trancamento ou desligamento, quando formalizado.
Dados médicos sensíveis não devem aparecer no PDF.
Regra:
O BI pode informar a condição administrativa, mas não deve publicar CID, laudo, diagnóstico ou detalhes pessoais.
### 12.3 3ª Parte — Assuntos Gerais e Administrativos
Conteúdos possíveis:
serviço diário;
escalas;
Aluno de Dia;
Aluno de Dia ao Pelotão;
permanência;
militares de apoio;
instruções ministradas;
missões internas;
missões externas;
alterações de material;
uso de viaturas;
eventos;
formaturas;
atividades complementares;
demandas logísticas relevantes.
Essa será a parte mais utilizada do BI.
### 12.4 4ª Parte — Justiça, Disciplina e Comportamento Escolar
Conteúdos possíveis:
elogios;
recompensas;
punições escolares aplicadas;
destaques escolares;
registros disciplinares finalizados;
cumprimento de punição, quando necessário;
decisão da Coordenação sobre comportamento escolar.
Registros em apuração não devem ser publicados.
### 12.5 5ª Parte — Comunicação Social, Avisos e Prescrições Diversas
Conteúdos possíveis:
avisos oficiais;
uniforme do dia seguinte;
horário de apresentação;
local de apresentação;
material obrigatório;
orientações de segurança;
avisos de solenidades;
prescrições gerais;
comunicados ao Corpo de Alunos.
## 13. Classificação dos Registros
Cada registro criado no sistema deverá ter uma classificação.
### 13.1 Publicável
Registro validado e adequado para aparecer no PDF.
### 13.2 Interno
Registro útil para controle da Coordenação, mas que não deve aparecer no PDF.
### 13.3 Restrito
Registro sensível, com acesso limitado.
Exemplos:
dados médicos;
defesa disciplinar;
ocorrência em análise;
documentos pessoais;
assunto sigiloso.
## 14. Status dos Registros
Cada registro deverá possuir status:
rascunho;
enviado;
em revisão;
pendente de correção;
validado;
incluído no BI;
interno;
restrito;
cancelado;
arquivado.
Somente registros com status “validado” e marcados como “incluir no BI” poderão aparecer no PDF.
## 15. Status do Boletim Interno
Cada BI deverá possuir status:
rascunho;
em preenchimento;
aguardando revisão;
revisado;
aprovado;
PDF gerado;
publicado;
arquivado;
substituído;
cancelado.
## 16. Perfis de Acesso
### 16.1 Administrador
Pode acessar todos os módulos, configurar usuários, permissões, cadastros e parâmetros do sistema.
### 16.2 Coordenação do CFO
Pode criar BI, revisar registros, validar, classificar, aprovar, gerar PDF e arquivar.
### 16.3 Coordenador de Pelotão
Pode revisar registros do seu pelotão e validar informações específicas, conforme permissão da Coordenação.
### 16.4 Aluno de Dia ao Corpo de Alunos
Pode preencher Livro de Dia geral, consolidar informações dos pelotões e enviar para revisão.
### 16.5 Aluno de Dia ao Pelotão
Pode preencher informações do seu pelotão.
### 16.6 Instrutor
Pode confirmar instrução ministrada, carga horária, faltas e alterações da disciplina.
### 16.7 Consulta
Pode visualizar apenas BIs publicados e autorizados.
## 17. Telas do MVP
### 17.1 Tela — Dashboard da Coordenação
Deve exibir:
BI do dia;
registros pendentes;
Livros de Dia aguardando validação;
faltas do dia;
escalas do dia;
instruções previstas;
missões em andamento;
botão para gerar BI;
botão para revisar registros.
### 17.2 Tela — Livro de Dia
Usuário principal: Aluno de Dia.
Campos:
data;
Aluno de Dia ao Corpo de Alunos;
Alunos de Dia aos Pelotões;
efetivo previsto;
efetivo presente;
faltas;
atrasos;
baixas;
dispensas;
instruções realizadas;
missões;
alterações de material;
ocorrências;
passagem de serviço;
observações.
A tela deve puxar automaticamente o que estiver cadastrado em escalas e QTS.
### 17.3 Tela — Escalas
Usuário principal: Coordenação.
Campos:
data;
tipo de escala;
função;
aluno ou militar;
horário;
local;
uniforme;
observação;
status.
Tipos de escala:
Aluno de Dia ao Corpo de Alunos;
Aluno de Dia ao Pelotão;
Permanência;
Apoio interno;
Missão interna;
Missão externa;
Apoio à instrução.
### 17.4 Tela — Registros e Alterações
Permite lançar:
falta;
atraso;
baixa;
dispensa;
alteração de material;
missão;
ocorrência;
elogio;
punição;
aviso;
prescrição da Coordenação.
Cada registro deve ter:
tipo;
data;
descrição;
responsável;
classificação;
status;
campo “incluir no BI”.
### 17.5 Tela — Validação da Coordenação
Deve permitir:
ver registros enviados;
corrigir texto;
devolver ao responsável;
marcar como publicável;
marcar como interno;
marcar como restrito;
validar;
cancelar;
incluir observação da Coordenação.
### 17.6 Tela — Prévia do BI
Deve mostrar o documento quase igual ao PDF final.
Deve permitir:
revisar cabeçalho;
revisar partes;
ocultar item;
editar texto final;
reordenar itens;
conferir partes sem alteração;
aprovar para PDF.
### 17.7 Tela — Gerar PDF
Campos:
número do BI;
ano;
data de publicação;
data inicial;
data final;
tipo: diário ou período;
versão;
responsável pela aprovação;
botão gerar PDF;
botão arquivar;
botão baixar.
### 17.8 Tela — Repositório de BIs
Deve permitir:
listar BIs;
buscar por número;
buscar por data;
buscar por período;
buscar por aluno;
buscar por missão;
baixar PDF;
visualizar status;
visualizar versão.
## 18. Entidades do Banco de Dados
### 18.1 users
Representa usuários do sistema.
Campos sugeridos:
id;
name;
login;
role;
active;
created_at;
updated_at.
### 18.2 students
Representa alunos oficiais.
Campos sugeridos:
id;
student_number;
full_name;
war_name;
platoon;
registration_number;
status;
phone;
active;
created_at;
updated_at.
### 18.3 military_staff
Representa militares, instrutores, monitores e coordenação.
Campos sugeridos:
id;
rank;
full_name;
war_name;
registration_number;
role_description;
phone;
active;
created_at;
updated_at.
### 18.4 disciplines
Representa disciplinas.
Campos sugeridos:
id;
name;
cfo_year;
workload_hours;
type;
main_instructor_id;
active;
created_at;
updated_at.
### 18.5 qts_items
Representa atividades previstas no QTS.
Campos sugeridos:
id;
date;
start_time;
end_time;
discipline_id;
instructor_id;
location;
platoon;
workload_hours;
uniform;
required_materials;
notes;
created_at;
updated_at.
### 18.6 duty_scales
Representa escalas.
Campos sugeridos:
id;
date;
scale_type;
function_name;
student_id;
military_staff_id;
start_time;
end_time;
location;
uniform;
notes;
status;
created_at;
updated_at.
### 18.7 daily_books
Representa Livro de Dia.
Campos sugeridos:
id;
date;
student_duty_ca_id;
expected_effective;
present_effective;
summary;
status;
submitted_at;
validated_at;
created_at;
updated_at.
### 18.8 daily_book_entries
Representa registros do Livro de Dia.
Campos sugeridos:
id;
daily_book_id;
entry_type;
reference_date;
student_id;
discipline_id;
description;
classification;
include_in_bulletin;
status;
coordination_note;
created_at;
updated_at.
### 18.9 absences
Representa faltas, atrasos e ausências.
Campos sugeridos:
id;
date;
student_id;
type;
activity;
discipline_id;
time;
justification;
status;
include_in_bulletin;
created_at;
updated_at.
### 18.10 missions
Representa missões internas e externas.
Campos sugeridos:
id;
mission_type;
title;
start_date;
end_date;
location;
presentation_time;
activation_time;
responsible_id;
uniform;
vehicle;
description;
result;
status;
include_in_bulletin;
created_at;
updated_at.
### 18.11 material_changes
Representa alterações de material.
Campos sugeridos:
id;
date;
material_name;
asset_number;
location;
responsible_name;
change_type;
description;
action_taken;
status;
include_in_bulletin;
created_at;
updated_at.
### 18.12 disciplinary_records
Representa registros disciplinares.
Campos sugeridos:
id;
date;
student_id;
fact_description;
legal_reference;
action_taken;
classification;
restricted_access;
status;
include_in_bulletin;
created_at;
updated_at.
### 18.13 notices
Representa avisos e prescrições.
Campos sugeridos:
id;
date;
title;
content;
target_audience;
classification;
status;
include_in_bulletin;
created_at;
updated_at.
### 18.14 bulletins
Representa Boletins Internos.
Campos sugeridos:
id;
number;
year;
publication_date;
start_date;
end_date;
type;
status;
created_by;
reviewed_by;
approved_by;
pdf_url;
verification_code;
version;
created_at;
updated_at.
### 18.15 bulletin_items
Representa itens publicados no BI.
Campos sugeridos:
id;
bulletin_id;
part_number;
reference_date;
title;
content;
source_type;
source_id;
display_order;
visible;
created_at;
updated_at.
## 19. Regras de Negócio
### 19.1 Numeração do BI
O número do BI deve ser único por ano.
O sistema não deve permitir dois BIs com o mesmo número e ano.
A numeração pertence ao documento, não ao dia.
Um BI por período recebe apenas um número.
### 19.2 Validação
Nenhum registro entra no PDF sem validação da Coordenação.
Registros enviados pelo Aluno de Dia ficam pendentes até revisão.
A Coordenação pode corrigir, aprovar, restringir ou cancelar registros.
### 19.3 Dados sensíveis
CID, laudo médico, detalhes familiares e documentos pessoais não devem aparecer no PDF.
Registros disciplinares em apuração não devem aparecer no PDF.
Informações restritas exigem permissão específica.
### 19.4 Geração do PDF
O PDF só pode ser gerado após aprovação da prévia.
BI aprovado não pode ser editado diretamente.
Correção posterior deve gerar nova versão.
A versão anterior deve ser preservada.
### 19.5 Partes sem alteração
Se uma parte não possuir item validado, o sistema deve exibir “Sem alteração”.
A Coordenação poderá optar por ocultar partes sem alteração em versões futuras, mas no MVP o padrão será exibir todas.
### 19.6 BI por período
O sistema deve agrupar registros por data dentro de cada parte.
Registros do período devem estar validados.
Itens pendentes não entram no PDF.
## 20. Critérios de Aceite do MVP
### 20.1 Cadastro
Deve ser possível cadastrar, editar e desativar aluno.
Deve ser possível cadastrar, editar e desativar instrutor/militar.
Deve ser possível cadastrar, editar e desativar disciplina.
### 20.2 Livro de Dia
Deve ser possível criar Livro de Dia por data.
Deve ser possível registrar efetivo previsto e presente.
Deve ser possível registrar faltas, atrasos, instruções, missões e alterações.
Deve ser possível enviar Livro de Dia para revisão.
### 20.3 Validação
Coordenação deve conseguir ver registros pendentes.
Coordenação deve conseguir marcar registros como publicáveis, internos ou restritos.
Coordenação deve conseguir validar ou devolver registro.
Somente registros validados entram na prévia.
### 20.4 BI
Deve ser possível criar BI diário.
Deve ser possível criar BI por período.
Deve ser possível gerar prévia.
Deve ser possível aprovar prévia.
Deve ser possível gerar PDF.
Deve ser possível baixar PDF.
Deve ser possível consultar BI gerado.
### 20.5 PDF
O PDF deve conter cabeçalho institucional.
O PDF deve conter número, data e período, quando aplicável.
O PDF deve conter as cinco partes.
Partes sem lançamento devem exibir “Sem alteração”.
Tabelas devem ser legíveis.
Rodapé deve conter página, data de geração, versão e código de verificação.
O PDF deve ser formal, limpo e adequado para arquivamento.
## 21. Casos de Uso Principais
### 21.1 Criar Livro de Dia
Como Aluno de Dia, quero preencher o Livro de Dia para registrar as alterações e atividades realizadas no curso.
### 21.2 Validar registros
Como Coordenação, quero revisar os registros enviados para decidir o que será publicado no BI.
### 21.3 Gerar BI diário
Como Coordenação, quero gerar o BI de uma data específica para registrar oficialmente a rotina do CFO.
### 21.4 Gerar BI por período
Como Coordenação, quero selecionar um intervalo de datas para consolidar registros em um único BI.
### 21.5 Arquivar BI
Como Coordenação, quero manter os BIs publicados em um repositório para consulta futura.
## 22. Roadmap
### Fase 1 — MVP
cadastros básicos;
Livro de Dia;
escalas simples;
validação;
prévia;
PDF;
repositório básico.
### Fase 2 — QTS integrado
cadastro de QTS;
puxar atividades previstas para o Livro de Dia;
vincular disciplinas e instrutores;
controle de carga horária.
### Fase 3 — Controle avançado
histórico detalhado;
versões;
retificações;
permissões refinadas;
trilha de auditoria.
### Fase 4 — Publicação documental
QR Code;
código de verificação;
assinatura eletrônica;
envio institucional;
busca avançada.
### Fase 5 — Automação inteligente
resumo automático;
sugestão de classificação;
geração automática de texto;
alertas de pendências;
importação de planilhas;
relatórios estatísticos.
## 23. Recomendação Técnica Inicial
O sistema pode ser construído como uma aplicação web responsiva.
Stack sugerida:
Frontend: React ou Next.js;
Backend/Banco: Supabase;
Autenticação: Supabase Auth ou login interno controlado;
PDF: geração por template HTML/CSS convertido em PDF;
Armazenamento: Supabase Storage;
Banco: PostgreSQL;
Deploy: Vercel.
A geração do PDF deve ser baseada em template, não em montagem manual linha por linha. Isso facilita manter padrão visual, revisar layout e evoluir o documento.
## 24. Observação Final
O BI-CFO deve ser tratado como sistema documental oficial, não apenas como formulário.
A prioridade do MVP é gerar um Boletim Interno confiável, limpo e útil para a Coordenação.
Funcionalidades avançadas devem ser adicionadas somente depois que o fluxo principal estiver funcionando:
Livro de Dia → Validação → Prévia → PDF → Arquivo.