# Modelo Conceitual de Dados — Sistema de Boletim Interno do CFO
## 1. Objetivo do Modelo
Este documento define o modelo conceitual de dados do Sistema de Boletim Interno do CFO.
O objetivo é organizar as principais entidades, relacionamentos, campos e regras de integridade para permitir o fluxo:
Cadastro → Planejamento/Escala → Livro de Dia → Registros → Validação → Boletim Interno → PDF → Arquivo.
O banco deve ser preparado para funcionamento em aplicação web, preferencialmente com Supabase/PostgreSQL.
## 2. Princípio Central do Modelo
O sistema não deve gerar o PDF diretamente do Livro de Dia.
A regra principal será:
Livro de Dia gera registros.
Registros são validados.
Registros validados viram itens do BI.
Itens do BI viram PDF.
Isso garante rastreabilidade, segurança administrativa e possibilidade de revisão antes da publicação.
## 3. Visão Geral das Entidades
O modelo será composto pelas seguintes entidades principais:
users;
profiles;
students;
platoons;
military_staff;
disciplines;
locations;
qts_items;
duty_scales;
daily_books;
records;
absences;
health_records;
instruction_records;
missions;
material_changes;
disciplinary_records;
notices;
bulletins;
bulletin_items;
pdf_documents;
audit_logs.
## 4. Organização por Grupos
### 4.1 Grupo de Identidade e Acesso
users;
profiles;
audit_logs.
### 4.2 Grupo de Cadastros Institucionais
students;
platoons;
military_staff;
disciplines;
locations.
### 4.3 Grupo de Planejamento e Escalas
qts_items;
duty_scales.
### 4.4 Grupo de Rotina e Registros
daily_books;
records;
absences;
health_records;
instruction_records;
missions;
material_changes;
disciplinary_records;
notices.
### 4.5 Grupo de Publicação Documental
bulletins;
bulletin_items;
pdf_documents.
## 5. Entidade: users
Representa os usuários que acessam o sistema.
### Campos sugeridos
id;
name;
login;
email;
role;
active;
created_at;
updated_at.
### Observações
No Supabase, essa tabela pode se relacionar com auth.users. Caso o sistema use login interno sem e-mail real, o campo login pode ser usado como identificador principal visível.
### Relacionamentos
Um user pode criar vários registros.
Um user pode validar vários registros.
Um user pode aprovar vários boletins.
Um user pode gerar vários PDFs.
Um user pode aparecer em audit_logs.
## 6. Entidade: profiles
Representa os perfis de acesso do sistema.
### Campos sugeridos
id;
name;
description;
permissions;
active;
created_at;
updated_at.
### Perfis mínimos
Administrador;
Coordenação;
Coordenador de Pelotão;
Aluno de Dia ao Corpo de Alunos;
Aluno de Dia ao Pelotão;
Instrutor;
Consulta.
### Regras
Perfil define permissões.
Usuário sem perfil ativo não deve acessar o sistema.
Registros restritos só podem ser acessados por perfis autorizados.
## 7. Entidade: platoons
Representa os pelotões do CFO.
### Campos sugeridos
id;
name;
description;
cfo_year;
active;
created_at;
updated_at.
### Exemplos
1º Pelotão;
2º Pelotão;
Turma única;
CFO 2026.1.
### Relacionamentos
Um pelotão possui vários alunos.
Um pelotão pode ter vários Alunos de Dia.
Um pelotão pode ter registros no Livro de Dia.
Um pelotão pode aparecer em escalas e QTS.
## 8. Entidade: students
Representa os alunos oficiais.
### Campos sugeridos
id;
student_number;
full_name;
war_name;
platoon_id;
registration_number;
situation;
phone;
institutional_login;
active;
created_at;
updated_at.
### Campos obrigatórios
student_number;
full_name;
war_name;
platoon_id;
situation.
### Regras
student_number deve ser único na turma.
Aluno vinculado a BI, escala, falta ou Livro de Dia não deve ser excluído definitivamente.
A exclusão lógica deve ser feita por active = false ou situation = inativo/desligado.
### Relacionamentos
Um student pertence a um platoon.
Um student pode estar em várias duty_scales.
Um student pode ter várias absences.
Um student pode aparecer em health_records.
Um student pode aparecer em disciplinary_records.
Um student pode ser Aluno de Dia em daily_books.
## 9. Entidade: military_staff
Representa militares da Coordenação, instrutores, monitores e apoio.
### Campos sugeridos
id;
rank;
full_name;
war_name;
registration_number;
staff_type;
phone;
active;
created_at;
updated_at.
### staff_type sugeridos
coordenação;
instrutor;
monitor;
apoio;
comandante;
outro.
### Regras
Militar já vinculado a registro histórico não deve ser excluído definitivamente.
Pode ser instrutor de uma ou várias disciplinas.
Pode ser responsável por missão, validação, apoio ou instrução.
### Relacionamentos
Um military_staff pode ministrar várias instruction_records.
Um military_staff pode ser responsável por várias missions.
Um military_staff pode validar registros.
Um military_staff pode ser responsável por duty_scales.
## 10. Entidade: disciplines
Representa disciplinas do CFO.
### Campos sugeridos
id;
name;
cfo_year;
workload_hours;
discipline_type;
main_instructor_id;
active;
created_at;
updated_at.
### discipline_type sugeridos
teórica;
prática;
mista;
estágio;
atividade complementar.
### Relacionamentos
Uma discipline pode ter vários qts_items.
Uma discipline pode ter várias instruction_records.
Uma discipline pode estar associada a absences.
Uma discipline pode aparecer no BI por meio de bulletin_items.
## 11. Entidade: locations
Representa locais de instrução, serviço, missão e eventos.
### Campos sugeridos
id;
name;
description;
address;
location_type;
active;
created_at;
updated_at.
### location_type sugeridos
sala de aula;
pátio;
campo de instrução;
unidade operacional;
local externo;
auditório;
outro.
### Relacionamentos
Um location pode ser usado em qts_items.
Um location pode ser usado em duty_scales.
Um location pode ser usado em missions.
Um location pode ser usado em instruction_records.
## 12. Entidade: qts_items
Representa atividades previstas no Quadro de Trabalho Semanal.
### Campos sugeridos
id;
date;
start_time;
end_time;
discipline_id;
instructor_id;
monitor_id;
location_id;
platoon_id;
title;
description;
workload_hours;
uniform;
required_materials;
requires_safety_plan;
status;
created_by;
created_at;
updated_at.
### status sugeridos
previsto;
alterado;
cancelado;
executado;
não executado.
### Regras
QTS registra previsão, não execução.
A execução real será registrada em instruction_records ou daily_book_entries.
Alteração relevante de QTS pode gerar records.
Uma atividade de QTS pode alimentar automaticamente o Livro de Dia.
### Relacionamentos
Um qts_item pode gerar uma instruction_record.
Um qts_item pode gerar um record.
Um qts_item pode aparecer indiretamente no BI se validado.
## 13. Entidade: duty_scales
Representa escalas e serviços.
### Campos sugeridos
id;
date;
scale_type;
function_name;
student_id;
military_staff_id;
platoon_id;
start_time;
end_time;
location_id;
uniform;
notes;
status;
publish_suggestion;
created_by;
validated_by;
validated_at;
created_at;
updated_at.
### scale_type sugeridos
Aluno de Dia ao Corpo de Alunos;
Aluno de Dia ao Pelotão;
Permanência;
Apoio interno;
Apoio à instrução;
Missão interna;
Missão externa;
Militar de serviço;
Outro.
### status sugeridos
rascunho;
validada;
alterada;
cancelada;
publicada.
### Regras
Deve haver student_id ou military_staff_id.
Um mesmo aluno não deve ser escalado em funções incompatíveis no mesmo horário sem alerta.
Escala validada pode alimentar a 3ª Parte do BI.
Permuta deve gerar alteração ou nova versão da escala.
### Relacionamentos
Uma duty_scale pode se vincular a daily_books.
Uma duty_scale pode gerar records.
Uma duty_scale pode originar bulletin_items.
## 14. Entidade: daily_books
Representa o Livro de Dia principal.
### Campos sugeridos
id;
date;
course_label;
student_duty_ca_id;
expected_effective;
present_effective;
general_summary;
service_passage;
status;
submitted_by;
submitted_at;
reviewed_by;
reviewed_at;
validated_by;
validated_at;
created_at;
updated_at.
### status sugeridos
rascunho;
enviado;
em revisão;
pendente de correção;
validado;
arquivado.
### Regras
Deve existir apenas um Livro de Dia principal por data e curso, salvo reabertura autorizada.
O Aluno de Dia preenche.
A Coordenação valida.
O Livro de Dia não gera PDF diretamente.
O Livro de Dia gera registros que serão avaliados pela Coordenação.
### Relacionamentos
Um daily_book possui vários records.
Um daily_book pode ter vários daily_book_entries, se essa tabela for usada.
Um daily_book pode estar associado a várias absences, instruction_records, missions e material_changes.
## 15. Entidade: records
Representa o registro central de qualquer fato ou alteração.
Essa é uma das entidades mais importantes do sistema.
### Campos sugeridos
id;
record_type;
source_type;
source_id;
reference_date;
student_id;
platoon_id;
discipline_id;
title;
original_description;
publication_text;
classification;
status;
include_in_bulletin;
bulletin_part;
created_by;
submitted_by;
reviewed_by;
validated_by;
validated_at;
coordination_note;
created_at;
updated_at.
### record_type sugeridos
falta;
atraso;
baixa;
dispensa;
instrução ministrada;
alteração de material;
missão interna;
missão externa;
escala;
aviso;
elogio;
punição;
ocorrência disciplinar;
alteração de QTS;
prescrição da Coordenação;
outro.
### source_type sugeridos
daily_book;
duty_scale;
qts_item;
absence;
health_record;
instruction_record;
mission;
material_change;
disciplinary_record;
notice;
manual.
### classification sugeridos
publicável;
interno;
restrito.
### status sugeridos
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
### bulletin_part sugeridos
1;
2;
3;
4;
### Regras
Nenhum record entra no BI se não estiver validado.
Nenhum record entra no BI se classification for interno ou restrito.
Nenhum record entra no BI se include_in_bulletin for false.
publication_text é o texto que irá para o BI.
original_description deve ser preservada.
O registro pode ser criado a partir de outras tabelas específicas ou manualmente.
A Coordenação pode editar publication_text sem alterar original_description.
### Relacionamentos
Um record pode originar um bulletin_item.
Um record pode estar vinculado a student, discipline, platoon ou source.
Um record deve aparecer em audit_logs quando validado, alterado ou publicado.
## 16. Entidade: absences
Representa faltas, atrasos e ausências.
### Campos sugeridos
id;
date;
student_id;
absence_type;
activity;
discipline_id;
expected_time;
arrival_time;
justification_status;
justification_text;
has_document;
restricted_note;
status;
include_in_bulletin;
created_by;
validated_by;
validated_at;
created_at;
updated_at.
### absence_type sugeridos
falta;
atraso;
saída autorizada;
ausência parcial;
não comparecimento.
### justification_status sugeridos
não informado;
informado;
justificado;
não justificado;
pendente de análise.
### Regras
Faltas e atrasos devem ser validados pela Coordenação.
Justificativas detalhadas podem ficar internas.
O PDF deve publicar apenas resumo administrativo.
Documento comprobatório não deve ser publicado no PDF.
### Relacionamentos
Uma absence pertence a um student.
Uma absence pode estar vinculada a discipline.
Uma absence pode gerar um record.
Uma absence pode gerar bulletin_item após validação.
## 17. Entidade: health_records
Representa registros de saúde, baixas, atendimentos e restrições.
### Campos sugeridos
id;
date;
student_id;
event_type;
activity_impact;
administrative_summary;
restricted_details;
document_presented;
status;
include_in_bulletin;
created_by;
validated_by;
validated_at;
created_at;
updated_at.
### event_type sugeridos
encaminhamento ao CSAU;
baixa médica;
dispensa de atividade;
restrição de esforço;
retorno às atividades;
outro.
### Regras
Deve iniciar como restrito por padrão.
Não deve armazenar CID em campo publicável.
Detalhes médicos devem ficar em restricted_details.
O PDF só pode usar administrative_summary validado.
Publicação deve evitar exposição sensível.
### Relacionamentos
Um health_record pertence a um student.
Um health_record pode gerar record.
Um health_record pode aparecer no BI somente como resumo administrativo validado.
## 18. Entidade: instruction_records
Representa instruções efetivamente ministradas.
### Campos sugeridos
id;
date;
qts_item_id;
discipline_id;
instructor_id;
monitor_id;
location_id;
platoon_id;
start_time;
end_time;
workload_hours;
content_summary;
expected_effective;
present_effective;
absences_summary;
safety_observations;
status;
include_in_bulletin;
created_by;
validated_by;
validated_at;
created_at;
updated_at.
### Regras
Deve informar disciplina, instrutor e carga horária.
Pode ser preenchida pelo Aluno de Dia ou Instrutor.
Deve ser validada pela Coordenação.
Pode alimentar a 3ª Parte do BI.
Observações de segurança podem ficar internas se não forem publicáveis.
### Relacionamentos
Uma instruction_record pertence a uma discipline.
Uma instruction_record pode ter instructor_id.
Uma instruction_record pode se originar de qts_item.
Uma instruction_record pode gerar record.
Uma instruction_record pode aparecer como bulletin_item.
## 19. Entidade: missions
Representa missões internas e externas.
### Campos sugeridos
id;
mission_type;
title;
start_date;
end_date;
location_id;
external_location_text;
presentation_time;
activation_start_time;
activation_end_time;
responsible_staff_id;
responsible_student_id;
vehicle;
uniform;
material;
description;
result_summary;
sensitive_details;
status;
include_in_bulletin;
created_by;
validated_by;
validated_at;
created_at;
updated_at.
### mission_type sugeridos
interna;
externa;
prevenção;
apoio;
visita técnica;
estágio;
exercício de campo;
solenidade;
outro.
### Regras
Missão deve ter título, período, local e responsável.
Missão externa deve ser sugerida como publicável.
Missão sensível pode ser restrita.
result_summary pode alimentar o BI.
sensitive_details não deve aparecer no PDF.
### Relacionamentos
Uma mission pode ter vários participantes, por meio de mission_participants.
Uma mission pode gerar record.
Uma mission pode aparecer na 3ª Parte do BI.
## 20. Entidade auxiliar: mission_participants
Representa participantes de uma missão.
### Campos sugeridos
id;
mission_id;
student_id;
military_staff_id;
function_name;
notes;
created_at;
updated_at.
### Regras
Deve haver student_id ou military_staff_id.
Um participante pode ter função específica.
Pode ser usado para montar tabela de efetivo no BI.
## 21. Entidade: material_changes
Representa alterações de materiais e equipamentos.
### Campos sugeridos
id;
date;
material_name;
asset_number;
location_id;
responsible_student_id;
responsible_staff_id;
change_type;
description;
action_taken;
status;
include_in_bulletin;
created_by;
validated_by;
validated_at;
created_at;
updated_at.
### change_type sugeridos
avaria;
extravio;
cautela;
devolução;
manutenção;
reposição;
conferência;
outro.
### Regras
Alteração deve ter descrição.
Alterações pequenas podem ficar internas.
Alterações relevantes podem entrar na 3ª Parte.
Registro deve ser validado antes de publicação.
### Relacionamentos
Um material_change pode gerar record.
Um material_change pode gerar bulletin_item.
## 22. Entidade: disciplinary_records
Representa ocorrências disciplinares, elogios, punições e recompensas.
### Campos sugeridos
id;
date;
student_id;
disciplinary_type;
fact_description;
legal_reference;
action_taken;
publication_summary;
restricted_details;
status;
classification;
include_in_bulletin;
created_by;
validated_by;
validated_at;
created_at;
updated_at.
### disciplinary_type sugeridos
elogio;
recompensa;
punição escolar;
ocorrência em análise;
comunicação disciplinar;
destaque;
cumprimento de punição.
### Regras
Ocorrência em análise deve iniciar como restrita.
Elogio validado pode ser publicável.
Punição só deve ser publicada após decisão da autoridade competente.
Defesa, análise e detalhes sensíveis devem ficar restritos.
O BI deve usar publication_summary.
### Relacionamentos
Um disciplinary_record pertence a student.
Um disciplinary_record pode gerar record.
Um disciplinary_record pode aparecer na 4ª Parte do BI.
## 23. Entidade: notices
Representa avisos, prescrições e orientações da Coordenação.
### Campos sugeridos
id;
date;
title;
content;
target_audience;
bulletin_part;
classification;
status;
include_in_bulletin;
created_by;
validated_by;
validated_at;
created_at;
updated_at.
### target_audience sugeridos
Corpo de Alunos;
1º Pelotão;
2º Pelotão;
Instrutores;
Coordenação;
Geral.
### Regras
Aviso publicável deve ser validado.
Aviso pode entrar na 1ª, 3ª ou 5ª Parte, conforme conteúdo.
Rascunho de aviso não entra no BI.
Aviso restrito não aparece no PDF.
### Relacionamentos
Um notice pode gerar record.
Um notice pode gerar bulletin_item.
## 24. Entidade: bulletins
Representa o Boletim Interno.
### Campos sugeridos
id;
number;
year;
publication_date;
start_date;
end_date;
bulletin_type;
title;
status;
created_by;
reviewed_by;
approved_by;
approved_at;
version;
verification_code;
notes;
created_at;
updated_at.
### bulletin_type sugeridos
diário;
período.
### status sugeridos
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
### Regras
number + year deve ser único.
start_date e end_date são obrigatórios.
Se start_date = end_date, bulletin_type = diário.
Se start_date diferente de end_date, bulletin_type = período.
BI aprovado não deve ser editado sem controle de versão.
BI publicado deve preservar seus itens congelados.
### Relacionamentos
Um bulletin possui vários bulletin_items.
Um bulletin pode ter vários pdf_documents, em caso de versões.
Um bulletin aparece em audit_logs.
## 25. Entidade: bulletin_items
Representa os itens finais publicados no BI.
Essa tabela congela aquilo que foi aprovado para publicação.
### Campos sugeridos
id;
bulletin_id;
part_number;
reference_date;
title;
content;
item_type;
source_type;
source_id;
display_order;
visible;
created_at;
updated_at.
### part_number
1: Legislação, Organização e Ensino;
2: Alteração de Pessoal;
3: Assuntos Gerais e Administrativos;
4: Justiça, Disciplina e Comportamento Escolar;
5: Comunicação Social, Avisos e Prescrições Diversas.
### item_type sugeridos
texto;
tabela;
escala;
falta;
instrução;
missão;
material;
aviso;
elogio;
punição;
sem alteração.
### Regras
bulletin_item deve conter o texto final aprovado.
Alterar o registro original não deve alterar automaticamente bulletin_item já aprovado.
bulletin_item é a fonte principal para geração do PDF.
Item pode ser ocultado na prévia se visible = false.
display_order controla ordem dentro da parte.
### Relacionamentos
Um bulletin_item pertence a um bulletin.
Um bulletin_item pode ter origem em record, mission, absence, notice, etc.
## 26. Entidade: pdf_documents
Representa o arquivo PDF gerado.
### Campos sugeridos
id;
bulletin_id;
version;
file_name;
file_url;
generated_by;
generated_at;
verification_code;
status;
replacement_reason;
created_at;
updated_at.
### status sugeridos
gerado;
publicado;
arquivado;
substituído;
cancelado.
### Regras
PDF deve ser gerado apenas a partir de BI aprovado.
PDF não deve ser sobrescrito.
Nova geração após publicação deve criar nova versão.
Nome do arquivo deve seguir padrão.
Deve manter código de verificação.
### Nome padrão
Para BI diário:
BI_CFO_2026_N005_02-06-2026.pdf
Para BI por período:
BI_CFO_2026_N006_01-06-2026_a_03-06-2026.pdf
## 27. Entidade: audit_logs
Registra ações importantes.
### Campos sugeridos
id;
user_id;
action;
entity_type;
entity_id;
old_value;
new_value;
ip_address;
created_at.
### action sugeridos
create;
update;
delete;
validate;
approve;
publish;
generate_pdf;
classify;
cancel;
archive;
restore;
login.
### Regras
Validação de registro deve gerar log.
Aprovação de BI deve gerar log.
Geração de PDF deve gerar log.
Alteração de classificação deve gerar log.
Criação de nova versão deve gerar log.
Logs não devem ser editáveis por usuários comuns.
## 28. Relacionamentos Principais
### 28.1 Aluno e Pelotão
Um pelotão possui muitos alunos.
Um aluno pertence a um pelotão.
Relação:
platoons 1:N students
### 28.2 Livro de Dia e Registros
Um Livro de Dia possui muitos registros.
Um registro pode ter origem em um Livro de Dia.
Relação:
daily_books 1:N records
### 28.3 Registros e Boletim
Um registro validado pode originar um item de BI.
Um item de BI pode apontar para o registro de origem.
Relação:
records 1:N bulletin_items
### 28.4 Boletim e Itens
Um Boletim Interno possui vários itens.
Relação:
bulletins 1:N bulletin_items
### 28.5 Boletim e PDF
Um Boletim Interno pode possuir um ou mais PDFs, em caso de versões.
Relação:
bulletins 1:N pdf_documents
### 28.6 QTS e Instrução
Um item do QTS pode originar uma instrução ministrada.
Relação:
qts_items 1:N instruction_records
### 28.7 Missão e Participantes
Uma missão pode possuir vários participantes.
Relação:
missions 1:N mission_participants
### 28.8 Usuários e Auditoria
Um usuário pode realizar várias ações auditadas.
Relação:
users 1:N audit_logs
## 29. Regras de Integridade
### 29.1 Integridade de publicação
Registro não validado não pode virar bulletin_item.
Registro interno não pode virar bulletin_item.
Registro restrito não pode virar bulletin_item.
BI não aprovado não pode gerar PDF final.
PDF não deve ser gerado diretamente de records, mas de bulletin_items.
### 29.2 Integridade de numeração
number + year em bulletins deve ser único.
Não permitir dois BIs com mesmo número e ano.
BI por período recebe apenas um número.
### 29.3 Integridade de data
start_date não pode ser posterior a end_date.
publication_date deve ser igual ou posterior a start_date, salvo exceção autorizada.
Registros usados no BI devem estar dentro do período selecionado.
### 29.4 Integridade de segurança
health_records devem iniciar como restritos.
disciplinary_records em análise devem iniciar como restritos.
Dados sensíveis não devem ser copiados para publication_text.
Usuários sem permissão não podem acessar registros restritos.
### 29.5 Integridade de histórico
Registros já publicados não devem ser apagados.
BI aprovado não deve ser editado diretamente.
PDF publicado não deve ser sobrescrito.
Correções devem gerar nova versão ou retificação.
## 30. Enumerações Sugeridas
### 30.1 classification
publicável;
interno;
restrito.
### 30.2 record_status
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
### 30.3 bulletin_status
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
### 30.4 bulletin_type
diário;
período.
### 30.5 absence_type
falta;
atraso;
saída autorizada;
ausência parcial;
não comparecimento.
### 30.6 mission_type
interna;
externa;
prevenção;
apoio;
visita técnica;
estágio;
exercício de campo;
solenidade;
outro.
### 30.7 discipline_type
teórica;
prática;
mista;
estágio;
atividade complementar.
## 31. Modelo de Publicação
O sistema deve seguir esta sequência:
Registro é criado.
Registro é enviado.
Coordenação revisa.
Coordenação classifica.
Coordenação valida.
Coordenação marca para incluir no BI.
Sistema cria bulletin_item.
BI é aprovado.
PDF é gerado a partir dos bulletin_items.
PDF é arquivado.
## 32. Estratégia para o MVP
Para simplificar o MVP, pode-se começar com as tabelas essenciais:
users;
students;
platoons;
military_staff;
disciplines;
duty_scales;
daily_books;
records;
bulletins;
bulletin_items;
pdf_documents.
As demais tabelas específicas podem ser adicionadas gradualmente.
No MVP, absences, missions, material_changes, notices e disciplinary_records podem inicialmente ser tipos de records. Depois, conforme o sistema amadurecer, podem ganhar tabelas próprias.
## 33. Decisão Técnica Recomendada
Para evitar complexidade inicial, recomenda-se o seguinte:
### MVP
Usar uma tabela central records para todos os lançamentos.
Campos como record_type, classification, status, bulletin_part e publication_text resolvem a maior parte das necessidades iniciais.
### Fase futura
Criar tabelas especializadas para:
absences;
missions;
health_records;
material_changes;
disciplinary_records;
instruction_records.
Essa abordagem permite lançar o sistema mais rápido, sem impedir evolução futura.
## 34. Resumo Executivo
O modelo conceitual do BI-CFO deve garantir que:
alunos, instrutores, disciplinas e escalas estejam cadastrados;
o Livro de Dia registre a rotina;
os fatos virem registros;
a Coordenação valide o que é relevante;
apenas registros publicáveis entrem no BI;
o BI congele seus itens antes do PDF;
o PDF seja gerado a partir dos itens aprovados;
o sistema preserve histórico, versões e rastreabilidade.
A principal proteção arquitetural é separar:
Livro de Dia
Registros
Boletim Interno
PDF
Essa separação evita erro, facilita auditoria e melhora a qualidade do documento final.